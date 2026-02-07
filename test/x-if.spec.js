import { test, expect } from "@playwright/test"
import { gotoDemo } from "./helpers.js"

test("IfLab: x-if inserts/removes block and hydrates directives inside it", async ({ page }) => {
  await gotoDemo(page)

  const root = page.getByTestId("ifLab")
  const toggle = root.getByRole("button", { name: /toggle block/i })

  // initially closed -> block not present
  await expect(root.getByTestId("ifBlock")).toHaveCount(0)

  // open -> block appears
  await toggle.click()
  await expect(root.getByTestId("ifBlock")).toHaveCount(1)

  // x-text hydrated
  await expect(root.getByTestId("ifName")).toContainText("Gandalf")

  // x-model hydrated (type + see it reflected)
  const input = root.getByTestId("ifInput")
  await input.fill("Saruman")
  await expect(root.getByTestId("ifName")).toContainText("Saruman")

  // x-on hydrated (button inside template works)
  const inc = root.getByTestId("ifInc")
  await expect(root.getByText(/clicks/i)).toBeVisible()

  // clicks start 0
  await expect(root.locator('[x-text="clicks"]')).toHaveText("0")
  await inc.click()
  await inc.click()
  await expect(root.locator('[x-text="clicks"]')).toHaveText("2")

  // close -> block removed
  await toggle.click()
  await expect(root.getByTestId("ifBlock")).toHaveCount(0)

  // reopen -> block rehydrates again (input + button still work)
  await toggle.click()
  await expect(root.getByTestId("ifBlock")).toHaveCount(1)

  await input.fill("Radagast")
  await expect(root.getByTestId("ifName")).toContainText("Radagast")
  await inc.click()
  await expect(root.locator('[x-text="clicks"]')).toHaveText("3")
})

test("If Leak Lab: effects inside x-if are disposed while hidden", async ({ page }) => {
  await gotoDemo(page)

  const root = page.getByTestId("ifLeakLab")
  const toggle = root.getByTestId("ifLeak-toggle")
  const bump = root.getByTestId("ifLeak-bump")
  const runs = root.getByTestId("ifLeak-runs")

  // initial mount runs once
  await expect(runs).toHaveText("1")

  // visible bump reruns
  await bump.click()
  await expect(runs).toHaveText("2")

  // hide block; bump while hidden should not rerun effect
  await toggle.click()
  await expect(root.getByTestId("ifLeak-mounted")).toHaveCount(0)
  await bump.click()
  await bump.click()
  await expect(runs).toHaveText("2")

  // show again; mount should run once, then bump reruns once
  await toggle.click()
  await expect(root.getByTestId("ifLeak-mounted")).toHaveCount(1)
  await expect(runs).toHaveText("3")

  await bump.click()
  await expect(runs).toHaveText("4")
})
