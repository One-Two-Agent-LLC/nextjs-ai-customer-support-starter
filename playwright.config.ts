import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.STARTER_TEST_URL || "http://127.0.0.1:3417",
    headless: true,
  },
  outputDir: "test-results",
});
