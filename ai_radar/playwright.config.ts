import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop-edge", use: { ...devices["Desktop Chrome"], channel: "msedge" } },
    { name: "mobile-edge", use: { ...devices["Pixel 7"], channel: "msedge" }, testMatch: /navigation\.spec\.ts/ }
  ],
  webServer: { command: "npm run start -- -H 127.0.0.1 -p 3100", url: "http://127.0.0.1:3100/api/health", reuseExistingServer: true, timeout: 120_000 }
});
