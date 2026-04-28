import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_USER_EMAIL
const PASSWORD = process.env.E2E_USER_PASSWORD

test.describe('tracking', () => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set')

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Email').fill(EMAIL!)
    await page.getByPlaceholder('Password').fill(PASSWORD!)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText(EMAIL!).first()).toBeVisible({ timeout: 10_000 })
  })

  test('navigates between sections via the menu', async ({ page }) => {
    await page.getByRole('link', { name: /profile/i }).first().click()
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()

    await page.getByRole('link', { name: /support/i }).first().click()
    await expect(page.getByRole('heading', { name: /support us/i })).toBeVisible()
  })

  test('Support Us page links to PayPal', async ({ page }) => {
    await page.getByRole('link', { name: /support/i }).first().click()
    const link = page.getByRole('link', { name: /donate via paypal/i })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', /paypal\.com\/paypalme\//)
  })
})
