import { test, expect } from '@playwright/test'

const PUBLIC_USERNAME = process.env.E2E_PUBLIC_USERNAME

test.describe('public profile', () => {
  test.skip(!PUBLIC_USERNAME, 'E2E_PUBLIC_USERNAME not set')

  test('loads /perfil/:username without authentication', async ({ page }) => {
    await page.goto(`/perfil/${PUBLIC_USERNAME}`)
    // The page should not redirect to /auth and should not show the sign-in form
    await expect(page.getByPlaceholder('Email')).toHaveCount(0)
    // It should mention the username somewhere
    await expect(page.getByText(new RegExp(`@?${PUBLIC_USERNAME}`, 'i'))).toBeVisible({
      timeout: 10_000,
    })
  })
})
