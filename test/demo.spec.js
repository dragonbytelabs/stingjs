import { test, expect } from "@playwright/test"
import { gotoDemo } from "./helpers.js"

test("profile demo works end-to-end", async ({ page }) => {
  await gotoDemo(page)

  const profile = page.getByTestId("profile")
  const input = profile.getByTestId("profile-name-input")

  await input.fill("Gandalf")

  // x-text updates (scoped so it won't match ForLab)
  await expect(profile.locator('[x-text="user.name"]')).toHaveText("Gandalf")

  // x-bind:title updates
  await expect(input).toHaveAttribute("title", "Gandalf")

  // x-show toggles (scoped to greeting)
  await profile.getByRole("button", { name: "Toggle visibility" }).click()
  await expect(profile.getByTestId("profile-greeting")).toBeHidden()
})
