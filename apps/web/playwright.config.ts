import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL: "https://impostor.localhost",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "corepack pnpm --dir ../.. dev",
    url: "https://impostor.localhost",
    reuseExistingServer: true,
    timeout: 120_000
  },
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
