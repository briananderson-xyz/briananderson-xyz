import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:4137",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer:
    process.env.CI && !process.env.CI_USE_LOCAL_SERVER
      ? undefined
      : {
          command: "pnpm exec vite preview",
          port: 4137,
          timeout: 60000,
          gracefulShutdown: { signal: "SIGINT", timeout: 5000 },
        },
});
