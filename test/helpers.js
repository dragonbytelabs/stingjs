import { expect } from "@playwright/test"

export async function gotoDemo(page) {
  await page.goto("/demo/index.html")

  // Ensure Sting initialized (one quick sanity check that usually exists)
  await expect(page.getByRole("heading", { name: /StingJS Demo Arena/i })).toBeVisible()
}
