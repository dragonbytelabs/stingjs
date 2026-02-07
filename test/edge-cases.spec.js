import { test, expect } from "@playwright/test"

test("Edge cases: nested x-model path updates x-text", async ({ page }) => {
  await page.goto("/static/edge-cases.html")

  const root = page.getByTestId("edge-root")
  const input = root.getByTestId("edge-name-input")

  await expect(root.getByTestId("edge-name")).toContainText("Sam")
  await input.fill("Frodo")
  await expect(root.getByTestId("edge-name")).toContainText("Frodo")
})

test("Edge cases: x-bind removes attributes when value becomes null", async ({ page }) => {
  await page.goto("/static/edge-cases.html")

  const target = page.getByTestId("edge-target")
  const toggle = page.getByTestId("edge-toggle-title")

  await expect(target).toHaveAttribute("title", "ready")

  await toggle.click()
  await expect(target).not.toHaveAttribute("title", /.+/)

  await toggle.click()
  await expect(target).toHaveAttribute("title", "ready")
})

test("Edge cases: x-on supports literal args and $event", async ({ page }) => {
  await page.goto("/static/edge-cases.html")

  const label = page.getByTestId("edge-label")

  await page.getByTestId("edge-call-args").click()
  await expect(label).toContainText("hobbit:7:T")

  await page.getByTestId("edge-call-event").click()
  await expect(label).toContainText("click")
})
