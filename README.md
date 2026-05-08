# 💪 StackForge: Fitness Tracker

Tracker de suplementación + entrenamiento construido con React 19, Supabase y Tailwind CSS. Proyecto de portafolio orientado a la industria de health/fitness tech, pensado para uso real diario.

**[🚀 Ver app en producción](https://suplementos-app-tawny.vercel.app)**

---

## Capturas

| Dashboard | Training | Perfil público |
|---|---|---|
| _Suplementación diaria + racha + gráfica de consistencia_ | _Rutina semanal + tracker de sesiones con autosave_ | _Stack compartible por link_ |

---

## Features

### Suplementación
- Registro diario por fecha con catálogo moderado (admin aprueba sugerencias)
- Gráfica de consistencia con filtros de 7/15/30 días
- Racha de días consecutivos al 100%
- Stacks/rutinas reutilizables, aplicables en un tap
- Búsqueda en Open Food Facts + auto-llenado de dosis recomendada
- Recordatorio diario por Web Push real (servidor) según zona horaria del usuario
- Story image 9:16 compartible en redes (PNG generado con html-to-image)

### Training
- Rutina semanal por día (Mon–Sun) con ejercicios, sets y rep ranges
- Tracker de sesión en vivo con autosave debounceado (800 ms) y finish/discard
- Ficha por ejercicio con fotos del movimiento (alternan tipo GIF), instrucciones paso a paso y 3 alternativas que comparten músculo principal
- Match ES→EN para que "Remo con barra" o "Sentadilla" encuentren la entrada correcta en free-exercise-db
- Snapshot pattern: cada workout copia los ejercicios al iniciar, así editar la rutina nunca afecta sesiones pasadas

### Plataforma
- Auth completa por email + recovery + onboarding obligatorio (username permanente)
- Perfil público en `/perfil/:username` con avatar, bio y stack del día
- PWA instalable (iOS Safari ≥ 16, Android Chrome) con banner de update controlado por el usuario
- Modo oscuro nativo, accesibilidad básica (aria-labels, role=switch, focus rings)
- Admin panel para moderar catálogo + listar usuarios
- Observabilidad opt-in con Sentry (`sendDefaultPii: false`)

---

## Tech Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript |
| Estilos | Tailwind CSS v4 |
| Routing | React Router v7 |
| Iconos | lucide-react |
| Base de datos | Supabase (PostgreSQL) con RLS |
| Auth | Supabase Auth |
| Storage | Supabase Storage (avatars) |
| Backend | Supabase Edge Functions (Deno) |
| Push | Web Push API + VAPID + pg_cron |
| Gráficas | Chart.js + chartjs-plugin-datalabels |
| Story PNG | html-to-image |
| PWA | vite-plugin-pwa + Workbox (injectManifest) |
| Tests | Vitest + Testing Library + Playwright + MSW |
| Observabilidad | Sentry (opt-in) |
| Deploy | Vercel (CI/CD automático) + CSP/HSTS headers |
| Datos externos | Open Food Facts, free-exercise-db (CDN) |

---

## Arquitectura

```
src/
  components/        AgregarSuplemento, BuscadorAlimento, ConfirmModal,
                     HintButton, InstallPrompt, Notificaciones, ShareButton,
                     StoryCard, SupplementoItem, UpdateBanner, WelcomeEmptyState
  hooks/             useActiveRoutine, useAuth, usePerfil, usePublicProfile,
                     useRacha, useSuplementos, useWorkout
  lib/               authErrors, avatar, dates, exercises/, push, sentry,
                     share, swUpdate, training, validation
  layout/            AppLayout (con onboarding gate), BottomNav, SideMenu
  pages/
    Supplements      Dashboard principal
    Profile          Datos personales + username + avatar
    Onboarding       Username gate primera sesión
    PerfilPublico    /perfil/:username
    ResetPassword    Recovery flow
    SupportUs        PayPal handle
    admin/           Catalog (moderación) + Users + Layout
    legal/           Privacy + Terms
    training/        Training + RoutineEditor + WorkoutTracker + ExerciseInfo
supabase/
  functions/send-push/   Edge Function de notificaciones
  migrations/            Schema + RLS + integridad + storage policies
```

---

## Base de datos (resumen)

Schema completo en [`supabase/migrations/`](supabase/migrations/). Esquema lógico:

```sql
-- Suplementación
suplementos_cat       -- Catálogo moderado (status pending/approved/rejected)
suplementos           -- Registro diario (FK suplemento_id → cat)
rutinas               -- Stacks reutilizables
rutina_suplementos    -- Items dentro de cada rutina

-- Perfiles
perfiles              -- avatar_url, bio, full_name, weight_kg, height_cm, ...
                      -- + CHECK constraints (rango 20-400 kg, regex username, etc.)

-- Notificaciones
notif_settings        -- hora + zona horaria + activa
push_subscriptions    -- endpoint VAPID por dispositivo

-- Training (3 capas)
routines              -- 1 activa por usuario (partial unique index)
routine_days          -- 0=Sun..6=Sat por rutina
routine_exercises     -- Plan del día (sets, rep_range, notes)
workouts              -- Sesión (status in_progress/completed/abandoned)
workout_exercises     -- Snapshot de routine_exercises al iniciar
workout_sets          -- Reps/peso real con autosave
```

Todas las tablas con `user_id` denormalizado y RLS estricta (`user_id = auth.uid()`). FKs con `ON DELETE CASCADE` para borrado limpio. CHECK constraints en cliente y servidor para defense-in-depth.

---

## Instalación local

```bash
git clone https://github.com/LDgamiz/suplementos-app
cd suplementos-app
npm install --legacy-peer-deps
```

Crea un archivo `.env` con tus credenciales:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_KEY=tu_anon_key
VITE_VAPID_PUBLIC_KEY=tu_vapid_public
VITE_SENTRY_DSN=opcional
VITE_PAYPAL_HANDLE=opcional
```

```bash
npm run dev          # dev server
npm run test:run     # 97 unit tests
npm run typecheck
npm run lint
npm run build
```

E2E tests con Playwright skipean si no hay `E2E_USER_EMAIL` y `E2E_USER_PASSWORD` en `.env`.

---

## Deploy

CI/CD automático en Vercel. Cada push a `main` genera un nuevo deploy. [`vercel.json`](vercel.json) configura los security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy, etc.) por defecto en todas las rutas.

---

## Decisiones técnicas

**¿Por qué Supabase?** PostgreSQL real con auth, storage, edge functions y RLS. Permite escalar sin rotar de stack ni montar backend propio.

**¿Por qué snapshot pattern en workouts?** Cada `workouts` clona `routine_exercises` al iniciar. Editar la rutina después no contamina sesiones pasadas. Trade-off: redundancia de datos a cambio de inmutabilidad histórica.

**¿Por qué Chart.js sobre Recharts?** Mayor control sobre la personalización visual, especialmente datalabels encima de barras y plugins custom.

**¿Por qué `injectManifest` en lugar de `generateSW`?** Necesitaba un service worker custom para manejar push notifications + skipWaiting controlado por el usuario vía `UpdateBanner`.

**¿Por qué free-exercise-db client-side?** Sin API key, sin costo por request, funciona offline una vez cacheado por el SW. El JSON (~1 MB) se carga vía dynamic import solo al abrir `/training/exercise/:name`, no infla el bundle principal.

**¿Por qué validación tanto en cliente como en DB?** Defense in depth — el cliente da feedback inmediato, los CHECK constraints en Postgres bloquean peticiones que esquivan la UI llamando a Supabase directo.

---

## Roadmap

- [ ] Historial de workouts (vista + filtros)
- [ ] Comparación entre sesiones del mismo ejercicio
- [ ] Tracking de PRs (max weight × reps por ejercicio)
- [ ] Exportar historial a CSV
- [ ] Internacionalización (la mitad del UI está en inglés, la otra en español)

---

## Autor

**Luis Daniel Gamiz** — Desarrollador web con 7 años de experiencia en .NET, SQL Server y Angular, actualmente expandiéndose hacia health/fitness tech con React + Supabase.

[GitHub](https://github.com/LDgamiz) · [App en producción](https://suplementos-app-tawny.vercel.app)
