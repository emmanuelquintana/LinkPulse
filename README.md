# LinkPulse

> **URL shortener SaaS** — crea, gestiona y monitorea enlaces cortos con analytics en tiempo real.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build/)

---

## ✨ Características principales

- 🔗 **Short links** — genera URLs cortas únicas con `nanoid`
- 🏢 **Workspaces** — organiza enlaces por equipo u organización
- ⚡ **Redirector de baja latencia** — servicio independiente con Fastify + caché Redis
- 📊 **Analytics** — registra clics, user-agent, país, device, y más
- 🔐 **Autenticación** — Supabase Auth con JWT verificación en la API
- 💳 **Billing** — integración con Stripe (planes y límites por workspace)
- 🧾 **Observabilidad** — logging estructurado, health checks y trace IDs

---

## 🏗️ Arquitectura

Este proyecto es un **monorepo Turborepo** con tres aplicaciones y paquetes compartidos:

```
linkpulse/
├── apps/
│   ├── web/          # Frontend — Next.js 15 (App Router)
│   ├── api/          # Backend API — NestJS + REST
│   └── redirector/   # Servicio de redirección — NestJS + Fastify
├── packages/
│   ├── config/       # Configuraciones compartidas (ESLint, TS, etc.)
│   └── types/        # Tipos TypeScript compartidos
├── prisma/           # Schema y migraciones de base de datos
└── turbo.json
```

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router) |
| Backend API | NestJS |
| Redirector | NestJS + Fastify |
| Auth | Supabase Auth |
| Base de datos | Supabase PostgreSQL |
| ORM | Prisma |
| Cache / Rate limiting | Upstash Redis |
| Billing | Stripe |
| Monorepo | Turborepo + pnpm workspaces |

---

## 🚀 Inicio rápido

### Requisitos previos

- [Node.js](https://nodejs.org/) `>=20.0.0`
- [pnpm](https://pnpm.io/) `10.x`
- Cuenta en [Supabase](https://supabase.com/)
- Cuenta en [Upstash](https://upstash.com/) (Redis)

### 1. Clonar el repositorio

```bash
git clone https://github.com/emmanuelquintana/LinkPulse.git
cd LinkPulse
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales (ver [Variables de entorno](#-variables-de-entorno)).

### 4. Generar el cliente Prisma y aplicar migraciones

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Levantar el entorno de desarrollo

```bash
pnpm dev
```

| Servicio | URL |
|---|---|
| Web (frontend) | http://localhost:3000 |
| API | http://localhost:3001 |
| Redirector | http://localhost:3002 |

---

## 🔧 Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Levanta todos los servicios en paralelo |
| `pnpm build` | Build de producción (todos los apps) |
| `pnpm lint` | Lint en todo el monorepo |
| `pnpm typecheck` | Verificación de tipos TypeScript |
| `pnpm format` | Formatea el código con Prettier |
| `pnpm db:generate` | Genera el cliente Prisma |
| `pnpm db:migrate` | Aplica migraciones de BD |
| `pnpm db:studio` | Abre Prisma Studio |

---

## 🌐 Variables de entorno

Copia `.env.example` como `.env` y completa los valores:

```env
# App
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:3001
REDIRECTOR_URL=http://localhost:3002

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_ISSUER=https://YOUR_PROJECT.supabase.co/auth/v1

# Database (Prisma)
DATABASE_URL=postgresql://postgres:PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://YOUR_DB.upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Redirector
REDIRECT_CACHE_TTL_SECONDS=300
RATE_LIMIT_MAX_REQUESTS=60
RATE_LIMIT_WINDOW_SECONDS=60
```

> Consulta [`.env.example`](./.env.example) para la lista completa de variables.

---

## 📡 API — Convención de respuestas

Todas las respuestas siguen el wrapper estándar:

```ts
{
  code: string;       // e.g. "LINK_CREATED"
  message: string;
  traceId: string;    // para trazabilidad
  data: T;
  metadata?: PaginationMetadata;
}
```

Los errores también siguen este formato, manejados por un exception filter global.

---

## 🤝 Contribuir

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feat/mi-feature`
3. Commitea tus cambios: `git commit -m 'feat: agregar mi feature'`
4. Haz push: `git push origin feat/mi-feature`
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.
