import { test, expect } from "@playwright/test"
import { gotoDemo } from "./helpers.js"

test("Profile: x-show toggles greeting visibility", async ({ page }) => {
  await gotoDemo(page)

  const root = page.getByTestId("profile")

  const greeting = root.locator("text=Hello,").first()
  await expect(greeting).toBeVisible()

  await root.getByRole("button", { name: /Toggle visibility/i }).click()
  await expect(greeting).toBeHidden()

  await root.getByRole("button", { name: /Toggle visibility/i }).click()
  await expect(greeting).toBeVisible()
})
