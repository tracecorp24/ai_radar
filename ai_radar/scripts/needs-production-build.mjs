import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const buildId = path.join(root, ".next-prod", "BUILD_ID");
const sourceRoot = path.join(root, "src");

if (!existsSync(buildId)) {
  process.stdout.write("YES");
  process.exit(0);
}

const buildTime = statSync(buildId).mtimeMs;
const pending = [sourceRoot];
let needsBuild = false;
while (pending.length && !needsBuild) {
  const directory = pending.pop();
  if (!directory) break;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) pending.push(target);
    else if (entry.isFile() && statSync(target).mtimeMs > buildTime) { needsBuild = true; break; }
  }
}
process.stdout.write(needsBuild ? "YES" : "NO");
