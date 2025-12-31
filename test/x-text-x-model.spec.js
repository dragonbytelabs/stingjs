import { test, expect } from "@playwright/test"
import { gotoDemo } from "./helpers.js"

test("Profile: x-model updates store; x-text reflects it", async ({ page }) => {
  await gotoDemo(page)

  const root = page.getByTestId("profile")
  const input = root.locator('input[x-model="user.name"]')

  await input.fill("Gandalf")

  // x-text updates the nested span
  await expect(root.locator("text=Gandalf")).toBeVisible()

  // x-bind:title should track user.name too
  await expect(input).toHaveAttribute("title", "Gandalf")
})

test("Profile: Rename button updates model and DOM", async ({ page }) => {
  await gotoDemo(page)

  const root = page.getByTestId("profile")
  await root.getByRole("button", { name: /Rename/i }).click()

  const greeting = page.getByTestId("profile-greeting")
  await expect(greeting).toContainText("Frodo")
})
