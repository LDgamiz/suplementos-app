# 💊 Mis Suplementos

App de seguimiento diario de suplementos construida con React, Supabase y Tailwind CSS. Proyecto de portafolio orientado a la industria de health/fitness tech.

**[🚀 Ver app en producción](https://suplementos-app-tawny.vercel.app)**

---

## Capturas

| Dashboard | Perfil público | PWA instalada |
|---|---|---|
| _Lista diaria con racha y gráfica de consistencia_ | _Stack compartible por link_ | _Instalable en iOS y Android_ |

---

## Features

- **Seguimiento diario** — registra y marca suplementos como tomados por fecha
- **Gráfica de consistencia** — visualización semanal con porcentaje por día
- **Racha de días** — contador de días consecutivos con 100% de consistencia
- **Rutinas/stacks** — guarda combinaciones de suplementos y aplícalas en un clic
- **Perfil público** — comparte tu stack diario con un link público (`/perfil/:username`)
- **Búsqueda Open Food Facts** — busca suplementos y agrégalos desde la API
- **Recordatorio diario** — notificación push local configurable por hora
- **PWA instalable** — funciona como app nativa en iOS y Android
- **Auth completa** — registro e inicio de sesión por email con Supabase

---

## Tech Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 |
| Estilos | Tailwind CSS v4 |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Gráficas | Chart.js + chartjs-plugin-datalabels |
| PWA | vite-plugin-pwa + Workbox |
| Deploy | Vercel (CI/CD automático) |
| API externa | Open Food Facts |

---

## Arquitectura

```
src/
  components/
    AgregarSuplemento.jsx   # Formulario de nuevo suplemento
    BuscadorAlimento.jsx    # Búsqueda en Open Food Facts
    ConfigPerfil.jsx        # Username y link público
    Notificaciones.jsx      # Recordatorio diario push
    SupplementoItem.jsx     # Item de lista con edición inline
  hooks/
    useAuth.js              # Sesión y signOut
    useRacha.js             # Cálculo de racha consecutiva
    useSuplementes.js       # CRUD completo de suplementos
  pages/
    PerfilPublico.jsx       # Vista pública /perfil/:username
  App.jsx                   # Rutas y orquestación
  Auth.jsx                  # Login y registro
  Rutinas.jsx               # Gestión de stacks
  WeeklyChart.jsx           # Gráfica de consistencia semanal
```

---

## Base de datos

```sql
-- Suplementos diarios del usuario
CREATE TABLE suplementos (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id   uuid,
  nombre    text,
  dosis     text,
  tomado    boolean DEFAULT false,
  publico   boolean DEFAULT false,
  fecha     date DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Rutinas guardadas
CREATE TABLE rutinas (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id   uuid,
  nombre    text,
  created_at timestamp with time zone DEFAULT now()
);

-- Suplementos dentro de cada rutina
CREATE TABLE rutina_suplementos (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rutina_id  bigint,
  nombre     text,
  dosis      text,
  created_at timestamp with time zone DEFAULT now()
);

-- Perfiles públicos
CREATE TABLE perfiles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid UNIQUE NOT NULL,
  username   text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
```

---

## Instalación local

```bash
git clone https://github.com/LDgamiz/suplementos-app
cd suplementos-app
npm install --legacy-peer-deps
```

Crea un archivo `.env` con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

```bash
npm run dev
```

---

## Deploy

El proyecto está configurado con CI/CD automático en Vercel. Cada push a `main` genera un nuevo deploy.

```bash
npm run build   # build de producción
npm run preview # preview local del build
```

---

## Decisiones técnicas

**¿Por qué Supabase?** PostgreSQL real con auth integrada y Realtime. Permite escalar a features como sincronización entre dispositivos sin cambiar de stack.

**¿Por qué Chart.js sobre Recharts?** Mayor control sobre la personalización visual, especialmente para las etiquetas de porcentaje encima de las barras.

**¿Por qué PWA local notifications sobre Web Push?** Las notificaciones locales no requieren servidor. Para una app personal esto es suficiente y mantiene el proyecto sin backend propio.

---

## Roadmap

- [ ] TypeScript — migración progresiva
- [ ] Tests con Vitest
- [ ] Notificaciones Web Push con servidor
- [ ] Modo oscuro
- [ ] Exportar historial a CSV

---

## Autor

**Luis Daniel Gamiz** — Desarrollador web con 7 años de experiencia en .NET, SQL Server y Angular, actualmente expandiéndose hacia health/fitness tech con React.

[GitHub](https://github.com/LDgamiz) · [App en producción](https://suplementos-app-tawny.vercel.app)
