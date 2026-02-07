import { test, expect } from "@playwright/test"

test("CSP smoke: strict policy page still mounts and reacts", async ({ page }) => {
  const cspErrors = []
  page.on("console", (msg) => {
    if (msg.type() !== "error") return
    const text = msg.text()
    if (/Content Security Policy|Refused to|unsafe-eval/i.test(text)) cspErrors.push(text)
  })

  await page.goto("/static/csp-smoke.html")

  await expect(page.getByRole("heading", { name: "StingJS CSP Smoke" })).toBeVisible()

  const count = page.getByTestId("csp-count")
  await expect(count).toHaveText("0")

  await page.getByTestId("csp-inc").click()
  await page.getByTestId("csp-inc").click()
  await expect(count).toHaveText("2")

  expect(cspErrors).toEqual([])
})
