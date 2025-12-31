import { test, expect } from "@playwright/test"

test("profile demo works end-to-end", async ({ page }) => {
  await page.goto("/demo/index.html")

  const input = page.locator('input[x-model="user.name"]')

  await input.fill("Gandalf")

  // x-text updates
  await expect(page.locator("text=Gandalf")).toBeVisible()

  // x-bind:title updates
  await expect(input).toHaveAttribute("title", "Gandalf")

  // x-show toggles
  await page.click("text=Toggle visibility")
  await expect(page.locator("text=Hello")).toBeHidden()
})
