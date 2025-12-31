import { test, expect } from "@playwright/test"
import { gotoDemo } from "./helpers.js"

test("Class Lab: x-bind:class adds/removes classes without losing base", async ({ page }) => {
  await gotoDemo(page)

  const root = page.getByTestId("classLab")
  const boopBtn = root.getByRole("button", { name: /Boop me/i })

  // base class should always be present
  await expect(boopBtn).toHaveClass(/btn/)

  // toggle hot => adds good + is-hot (per your computed)
  await root.getByRole("button", { name: /Toggle “hot”/i }).click()
  await expect(boopBtn).toHaveClass(/btn/)
  await expect(boopBtn).toHaveClass(/good/)
  await expect(boopBtn).toHaveClass(/is-hot/)

  // toggle danger => adds bad + is-danger
  await root.getByRole("button", { name: /Toggle “danger”/i }).click()
  await expect(boopBtn).toHaveClass(/bad/)
  await expect(boopBtn).toHaveClass(/is-danger/)

  // reset => removes bound classes but keeps base
  await root.getByRole("button", { name: /Reset/i }).click()
  await expect(boopBtn).toHaveClass(/btn/)
  await expect(boopBtn).not.toHaveClass(/good|bad|is-hot|is-danger/)
})

test("Class Lab: x-bind:title updates when booped", async ({ page }) => {
  await gotoDemo(page)

  const boopBtn = page.getByTestId("class-boop")

  await expect(boopBtn).toHaveAttribute("title", /Boops=0/)
  await expect(boopBtn).toHaveAttribute("title", /calm/)

  await boopBtn.click()
  await boopBtn.click()

  await expect(boopBtn).toHaveAttribute("title", /Boops=2/)
})
