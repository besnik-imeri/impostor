import { defineConfig, devices } from "@playwright/test";

const browserChannel = process.env.PLAYWRIGHT_CHANNEL;
const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 2,
  use: {
    baseURL: "https://impostor.localhost",
    ...(browserChannel ? { channel: browserChannel } : {}),
    ignoreHTTPSErrors: true,
    launchOptions: {
      args: ["--host-resolver-rules=MAP impostor.localhost 127.0.0.1"]
    },
    trace: "retain-on-failure"
  },
  webServer: [
    {
      name: "Worker",
      command:
        "corepack pnpm --dir ../.. --filter @impostor/domain build && corepack pnpm --dir ../.. --filter @impostor/worker dev",
      url: "http://127.0.0.1:3401/api/health",
      reuseExistingServer,
      timeout: 120_000
    },
    {
      name: "Web",
      command: "corepack pnpm --dir ../.. --filter @impostor/web dev",
      url: "http://127.0.0.1:3400",
      reuseExistingServer,
      timeout: 120_000
    }
  ],
  projects: [
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] }
    },
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
