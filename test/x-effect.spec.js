import { test, expect } from "@playwright/test"
import { gotoDemo } from "./helpers.js"

test("EffectLab: x-effect runs on mount, reruns on dep change, and cleans up on removal", async ({ page }) => {
  await gotoDemo(page)

  const root = page.getByTestId("effectLab")
  const inc = root.getByTestId("effect-inc")
  const remove = root.getByTestId("effect-remove")

  // Target the actual x-text spans (unambiguous)
  const countText = root.locator('[x-text="count"]')
  const runsText = root.locator('[x-text="runs"]')
  const cleansText = root.locator('[x-text="cleans"]')

  // initial: effect runs once on mount
  await expect(countText).toHaveText("0")
  await expect(runsText).toHaveText("1")
  await expect(cleansText).toHaveText("0")

  // dep change -> rerun; cleanup for previous run should happen first
  await inc.click()
  await expect(countText).toHaveText("1")
  await expect(runsText).toHaveText("2")
  await expect(cleansText).toHaveText("1")

  // again
  await inc.click()
  await expect(countText).toHaveText("2")
  await expect(runsText).toHaveText("3")
  await expect(cleansText).toHaveText("2")

  // removing component should dispose effect -> one more cleanup
  await remove.click()
  await expect(page.getByTestId("effectLab")).toHaveCount(0)
  await expect.poll(async () => {
    return await page.evaluate(() => window.__effectLabCleanupEvents || 0)
  }).toBe(3)
})

test("Runtime: dynamically added x-data roots are tracked and cleaned on removal", async ({ page }) => {
  await gotoDemo(page)

  await page.evaluate(() => {
    window.__effectLabCleanupEvents = 0

    const host = document.createElement("div")
    host.setAttribute("x-data", "effectLab")
    host.setAttribute("data-testid", "dynamic-effect-lab")
    host.innerHTML = '<div x-effect="track"></div>'
    document.body.appendChild(host)
  })

  await expect.poll(async () => {
    return await page.evaluate(() => {
      const el = document.querySelector('[data-testid="dynamic-effect-lab"]')
      return !!el?.__stingScope
    })
  }).toBe(true)

  await page.evaluate(() => {
    document.querySelector('[data-testid="dynamic-effect-lab"]')?.remove()
  })

  await expect.poll(async () => {
    return await page.evaluate(() => window.__effectLabCleanupEvents || 0)
  }).toBe(1)
})
