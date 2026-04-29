import { test, expect } from '@playwright/test'

const PUBLIC_USERNAME = process.env.E2E_PUBLIC_USERNAME

test.describe('public profile', () => {
  test.skip(!PUBLIC_USERNAME, 'E2E_PUBLIC_USERNAME not set')

  test('loads /perfil/:username without authentication', async ({ page }) => {
    await page.goto(`/perfil/${PUBLIC_USERNAME}`)

    // Should never show the sign-in form (the route is public)
    await expect(page.getByPlaceholder('Email')).toHaveCount(0)

    // Wait for the loading text to disappear
    await expect(page.getByText('Loading...')).toHaveCount(0, { timeout: 10_000 })

    // Fail loudly if the username doesn't exist in the perfiles table.
    // Lets you spot a config issue (wrong E2E_PUBLIC_USERNAME) instead of a
    // generic locator timeout.
    const notFound = page.getByText(/profile not found/i)
    if (await notFound.isVisible().catch(() => false)) {
      throw new Error(
        `E2E_PUBLIC_USERNAME="${PUBLIC_USERNAME}" was not found in the perfiles table. ` +
        `Make sure that user exists and has set their username via /profile.`
      )
    }

    // The redesigned profile shows "@<username>" as a separate element under the
    // full name (no longer inside the heading). Just check it's visible somewhere.
    await expect(
      page.getByText(`@${PUBLIC_USERNAME}`, { exact: false }).first()
    ).toBeVisible({ timeout: 10_000 })
  })
})
