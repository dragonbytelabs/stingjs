import { test, expect } from "@playwright/test"
import { gotoDemo } from "./helpers.js"

test("FormLab: select + checkbox update summary", async ({ page }) => {
  await gotoDemo(page)

  const root = page.getByTestId("formLab")

  const select = root.locator('select[x-model="role"]')
  const checkbox = root.locator('input[type="checkbox"][x-model="stealthMode"]')

  const summary = root.locator("text=Current build:").locator("..").locator(".kbd")

  await expect(summary).toContainText("burglar | stealth=OFF")

  await select.selectOption("wizard")
  await expect(summary).toContainText("wizard | stealth=OFF")

  await checkbox.check()
  await expect(summary).toContainText("wizard | stealth=ON")
})
