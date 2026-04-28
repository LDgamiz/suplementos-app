import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_USER_EMAIL
const PASSWORD = process.env.E2E_USER_PASSWORD

test.describe('auth', () => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set')

  test('can sign in and reach the supplements page', async ({ page }) => {
    await page.goto('/')

    // Auth screen
    await expect(page.getByRole('heading', { name: 'My Supplements' })).toBeVisible()
    await page.getByPlaceholder('Email').fill(EMAIL!)
    await page.getByPlaceholder('Password').fill(PASSWORD!)
    await page.getByRole('button', { name: /sign in/i }).click()

    // After login the email is shown in the header (mobile) or sidebar (desktop)
    await expect(page.getByText(EMAIL!)).toBeVisible({ timeout: 10_000 })
  })

  test('shows an error message with bad credentials', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Email').fill('nope@nope.test')
    await page.getByPlaceholder('Password').fill('wrongwrongwrong')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Supabase returns "Invalid login credentials" or similar
    await expect(page.locator('p').filter({ hasText: /invalid|credentials/i })).toBeVisible({
      timeout: 10_000,
    })
  })
})
