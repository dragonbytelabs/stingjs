import { defineConfig } from "@playwright/test"

const projects = [
  { name: "chromium", use: { browserName: "chromium" } },
  { name: "firefox", use: { browserName: "firefox" } },
  { name: "webkit", use: { browserName: "webkit" } },
]

export default defineConfig({
  testDir: "test",
  projects,

  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
  },

  webServer: {
    command: "npx http-server . -a 127.0.0.1 -p 5173 -c-1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },

  reporter: [["list"], ["html", { open: "never" }]],
})
