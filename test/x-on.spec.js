import { test, expect } from "@playwright/test"
import { gotoDemo } from "./helpers.js"

test("Counter: buttons update count + mood", async ({ page }) => {
  await gotoDemo(page)

  const root = page.getByTestId("counter")

  const mood = root.locator(".debug").filter({ hasText: "mood:" })

  // start
  await expect(mood).toContainText("neutral")

  await root.getByRole("button", { name: "+1" }).click()
  await expect(mood).toContainText("vibing")

  await root.getByRole("button", { name: "+1" }).click()
  await root.getByRole("button", { name: "+1" }).click()
  await expect(mood).toContainText("overclocked")

  await root.getByRole("button", { name: "Reset" }).click()
  await expect(mood).toContainText("neutral")
})
