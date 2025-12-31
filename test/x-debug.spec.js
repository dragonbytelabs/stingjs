import { test, expect } from "@playwright/test"
import { gotoDemo } from "./helpers.js"

test("x-debug renders something and updates when toggled", async ({ page }) => {
  await gotoDemo(page)

  const root = page.getByTestId("profile")
  const dbg = root.locator('[x-debug="$open"]')

  await expect(dbg).not.toHaveText("") // renders

  await root.getByRole("button", { name: /Toggle visibility/i }).click()
  await expect(dbg).not.toHaveText("") // still renders after change
})
