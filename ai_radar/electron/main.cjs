const { app, BrowserWindow, dialog, shell } = require("electron");
const { spawn } = require("node:child_process");
const { createServer } = require("node:net");
const { existsSync, mkdirSync, readdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");

let mainWindow;
let serverProcess;
let quitting = false;

function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

function waitForServer(url, attempts = 60) {
  return new Promise((resolve, reject) => {
    let remaining = attempts;
    const check = async () => {
      try {
        const response = await fetch(`${url}/api/system/readiness`, { signal: AbortSignal.timeout(1500) });
        if (response.ok) return resolve();
      } catch {}
      remaining -= 1;
      if (!remaining) return reject(new Error("Yerel uygulama sunucusu zamanında başlatılamadı."));
      setTimeout(check, 500);
    };
    check();
  });
}

async function startApplication() {
  const port = await findFreePort();
  const url = `http://127.0.0.1:${port}`;
  const appRoot = app.isPackaged ? path.join(process.resourcesPath, "server") : path.join(__dirname, "..", ".next-prod", "standalone");
  // electron-builder's portable target launches through a self-extracting
  // wrapper. process.execPath then points to that wrapper rather than the
  // extracted Electron runtime, so it cannot be used to run server.js.
  const runtimeDirectory = path.dirname(process.resourcesPath);
  const bundledRuntimeName = app.isPackaged && process.platform === "win32"
    ? readdirSync(runtimeDirectory, { withFileTypes: true }).find((entry) => entry.isFile() && entry.name.endsWith(".exe"))?.name
    : undefined;
  const bundledRuntime = bundledRuntimeName ? path.join(runtimeDirectory, bundledRuntimeName) : undefined;
  const nodeRuntime = typeof bundledRuntime === "string" && existsSync(bundledRuntime)
    ? bundledRuntime
    : process.execPath;
  const dataRoot = path.join(app.getPath("userData"), "data");
  mkdirSync(dataRoot, { recursive: true });

  serverProcess = spawn(nodeRuntime, [path.join(appRoot, "server.js")], {
    cwd: dataRoot,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
      SAVVY_DATA_DIR: dataRoot
    },
    stdio: "ignore",
    windowsHide: true
  });
  serverProcess.once("exit", (code) => {
    if (!quitting && code !== 0) dialog.showErrorBox("Savvy kapandı", "Yerel uygulama sunucusu beklenmedik biçimde durdu.");
  });

  await waitForServer(url);
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (/^https?:/i.test(target)) shell.openExternal(target);
    return { action: "deny" };
  });
  await mainWindow.loadURL(url);
}

app.whenReady().then(startApplication).catch((error) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
  try { writeFileSync(path.join(app.getPath("userData"), "startup-error.log"), message); } catch {}
  dialog.showErrorBox("Savvy başlatılamadı", message);
  app.quit();
});
app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => {
  quitting = true;
  if (serverProcess && !serverProcess.killed) serverProcess.kill();
});
