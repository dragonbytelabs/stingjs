import { test, expect } from "@playwright/test"
import { gotoDemo } from "./helpers.js"

test("ForLab: x-for renders items and updates when mutated", async ({ page }) => {
  await gotoDemo(page) 

  const root = page.getByTestId("forLab")
  const add = root.getByTestId("for-add")
  const pop = root.getByTestId("for-pop")

  // initial
  await expect(root.getByTestId("for-item")).toHaveCount(3)

  // add
  await add.click()
  await expect(root.getByTestId("for-item")).toHaveCount(4)

  // pop
  await pop.click()
  await expect(root.getByTestId("for-item")).toHaveCount(3)
})
