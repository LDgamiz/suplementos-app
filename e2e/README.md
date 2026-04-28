# E2E Tests (Playwright)

These tests run against a built copy of the app (`vite build` + `vite preview`) and a real Supabase instance.

## Required environment variables

Place them in `.env` (loaded by Vite at build time) **and**, if your CI doesn't load `.env`, also as Playwright environment variables:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_KEY` | Supabase anon key |
| `VITE_VAPID_PUBLIC_KEY` | Web Push VAPID key |
| `VITE_PAYPAL_HANDLE` | PayPal handle for the donate page |
| `E2E_USER_EMAIL` | Existing test user's email (must already exist in Supabase auth) |
| `E2E_USER_PASSWORD` | Existing test user's password |
| `E2E_PUBLIC_USERNAME` | A `username` value present in `perfiles` for the public-profile test |

Use a **dedicated test/staging Supabase project**, never production.

## Local commands

```bash
npm run build            # build the app
npx playwright install   # install browser binaries (first run only)
npm run test:e2e         # run all E2E
npm run test:e2e:ui      # interactive UI mode
```

The `webServer` block in `playwright.config.ts` starts `vite preview` automatically.

## Skipping E2E

Tests gracefully skip if `E2E_USER_EMAIL` is not set, so they won't fail on developer machines without credentials.
