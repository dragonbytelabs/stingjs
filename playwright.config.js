import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "test",

  use: {
    baseURL: "http://localhost:5173",
    headless: true,
  },

  webServer: {
    command: "npx http-server . -p 5173 -c-1",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },

  reporter: [["list"], ["html", { open: "never" }]],
})
