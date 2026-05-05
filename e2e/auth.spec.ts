import { test, expect } from '@playwright/test'

const EMAIL = process.env.E2E_USER_EMAIL
const PASSWORD = process.env.E2E_USER_PASSWORD

test.describe('auth', () => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set')

  test('can sign in and reach the supplements page', async ({ page }) => {
    await page.goto('/')

    // Auth screen
    await expect(page.getByRole('heading', { name: 'StackForge' })).toBeVisible()
    await page.getByPlaceholder('Email').fill(EMAIL!)
    await page.getByPlaceholder('Password').fill(PASSWORD!)
    await page.getByRole('button', { name: /sign in/i }).click()

    // After login the email is shown in the header (mobile) or sidebar (desktop)
    await expect(page.getByText(EMAIL!).first()).toBeVisible({ timeout: 10_000 })
  })

  test('shows an error message with bad credentials', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Email').fill('nope@nope.test')
    await page.getByPlaceholder('Password').fill('wrongwrongwrong')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Auth.tsx maps Supabase's "Invalid login credentials" to a friendly
    // "Email or password is incorrect." Also keep the old keywords in case
    // the mapping changes or a different auth provider returns its own text.
    await expect(
      page.locator('p').filter({ hasText: /incorrect|invalid|credentials/i })
    ).toBeVisible({ timeout: 10_000 })
  })
})
