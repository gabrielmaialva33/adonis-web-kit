# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL RULE: KEEP THE MODULAR STRUCTURE

This project does **NOT** use the default AdonisJS layout (`app/controllers`, `app/models`, …).
It uses a **modular, domain-driven** layout under `app/modules/<domain>/` plus cross-cutting
code in `app/shared/`. Two things follow from that:

1. **`node ace make:*` generates files in the DEFAULT location** (`app/controllers/...`,
   `#controllers/...` aliases) which is **wrong** for this repo. So when you scaffold:
   - Generate with ace if you want the boilerplate, then **MOVE** the file into the right
     module (`app/modules/<domain>/{controllers,services,...}/`) and **fix the imports** to
     `#modules/*` / `#shared/*`, **OR**
   - Create the file directly following the existing module pattern (look at a sibling module
     like `app/modules/users/` and copy its shape).
2. **Never use the removed legacy aliases** (`#controllers`, `#models`, `#services`,
   `#repositories`, `#middleware`, `#validators`, `#interfaces`, `#routes`). They no longer
   exist. Use `#modules/*`, `#shared/*`, `#exceptions/*` (see "Import Aliases").

The spirit of the old rule still holds: **stay consistent with the existing structure** — just
don't trust the default ace output paths.

> **Runtime note:** this is **AdonisJS v7** running TypeScript directly via `@poppinss/ts-exec`.
> There is **no `node ace`** anymore. Use `pnpm ace <cmd>` (or
> `node --import=@poppinss/ts-exec ace.js <cmd>`).

## Common Development Commands

Package manager is **pnpm** (there is a `pnpm-workspace.yaml` with `allowBuilds` /
`verifyDepsBeforeRun`). Node **24 LTS** (`.nvmrc` → `v24.13.0`).

> **TypeScript runs side by side.** `typescript` is aliased to
> `@typescript/typescript6` (TS 6, binary `tsc6`) because `typescript-eslint`
> throws on the TS 7 API ([typescript-eslint#10940]) and resolves TS through its
> peer dependency — pnpm `overrides` cannot redirect a peer, so the alias has to
> live at the root. TS 7 comes in as `typescript-native` and owns the plain `tsc`
> binary, which is what `pnpm typecheck` and `pnpm build` use. Collapse both back
> into a single `typescript` entry once typescript-eslint supports TS 7.
>
> [typescript-eslint#10940]: https://github.com/typescript-eslint/typescript-eslint/issues/10940

### Development

- `pnpm dev` - Start development server with HMR
- `pnpm build` - Build application for production
- `pnpm start` - Start production server (`node bin/server.js`)
- `pnpm ace <cmd>` - Run any ace command (wraps `node --import=@poppinss/ts-exec ace.js`)

### Testing

- `pnpm test` - Run unit tests only (Japa, `--force-exit`)
- `pnpm test:e2e` - Run ALL backend suites: unit + functional + browser (Japa)
- `pnpm test:ui` - Run frontend tests (Vitest, one-shot)
- `pnpm test:ui:watch` - Frontend tests in watch mode

### Code Quality

- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix linting issues automatically
- `pnpm format` - Format code with Prettier
- `pnpm typecheck` - Type-check **both** sides: backend `tsc --noEmit` **and** frontend
  `tsc --noEmit -p inertia/tsconfig.json`

### Database

- `pnpm ace migration:run` - Run pending migrations
- `pnpm ace migration:fresh` - Drop all tables and re-migrate
- `pnpm ace db:seed` - Run database seeders
- `pnpm ace migration:rollback` - Rollback last migration

### Docker

- `pnpm docker` - Run migrations, seeders, then start the production server

> **Infra requirement:** PostgreSQL **and** Redis must be running for both dev and tests.

## Architecture Overview

This is an **AdonisJS v7** application with a **React 19 + Inertia.js** frontend. The codebase is
organized **by domain (modular)**, not by technical layer.

### Key Technologies

- **Backend**: AdonisJS v7 (runs TS directly via `@poppinss/ts-exec`)
- **Runtime**: Node.js 24 LTS
- **Frontend**: React 19 with Inertia.js for an SPA-like experience
- **Database**: PostgreSQL (dev/prod); SQLite (`better-sqlite3`) available for tests
- **Styling**: TailwindCSS v4
- **Authentication**: Multiple guards — access JWT (default, cookie + header), rotating opaque refresh tokens, API tokens, session, basic
- **Multi-tenancy**: N:N (users ↔ tenants via `user_tenants` pivot), JWT-carried active tenant
- **Validation**: VineJS
- **Testing**: Japa (backend) + Vitest (frontend)
- **Queue**: Bull Queue (`@rlanz/bull-queue`) with Redis
- **Cache**: `@adonisjs/cache` backed by Redis

### Project Structure

#### Backend Architecture (`app/`)

Three top-level areas:

```
app/
├── modules/        # domain modules — the heart of the app
│   ├── auth/         controllers/ services/ events/ routes.ts
│   ├── users/        controllers/ services/ repositories/ models/ validators/ interfaces/ routes.ts
│   ├── roles/        controllers/ services/ repositories/ models/ validators/ interfaces/ routes.ts
│   ├── permissions/  controllers/ services/ repositories/ models/ validators/ interfaces/ routes.ts
│   ├── files/        controllers/ services/ models/ routes.ts
│   ├── audits/       services/ models/
│   ├── tenants/      controllers/ models/ routes.ts
│   ├── health/       controllers/ routes.ts
│   └── web/          controllers/ services/ routes.ts   # Inertia pages (login, dashboard, users, files, tenant switch)
├── shared/         # cross-cutting concerns
│   ├── middleware/   auth, guest, acl, permission, ownership, tenant, locale, inertia, …
│   ├── services/     ownership_service
│   ├── jwt/          custom JWT guard (define_config, jwt, jwt_service, types)
│   ├── lucid/        base repository + interface (lucid_repository)
│   └── interfaces/   ownership_interface
└── exceptions/     # typed exceptions at the root
    ├── base_exception.ts
    ├── bad_request_exception.ts
    ├── forbidden_exception.ts
    ├── not_found_exception.ts
    ├── unauthorized_exception.ts
    ├── validation_exception.ts
    └── handler.ts
```

Each module owns its slice end to end. A module typically wires
**controller → service → repository → model**, registers its own `routes.ts` (imported from
`start/routes.ts`), and keeps its validators/interfaces alongside.

#### Frontend (`inertia/`)

- **app/**: React entry points
- **pages/**: page components (auth/login, auth/register, dashboard, users/{index,create,edit}, files, errors, home, ui_demo)
- **layouts/**: admin shell — `main_layout` (sidebar + header with tenant switcher, user menu, theme toggle) and `auth/auth_split_layout`
- **components/ui/**: ~78 Metronic (shadcn-style) components, kebab-case (button, card, data-grid, form, dialog, drawer, command, calendar, chart, …)
- **components/ui/core/**: legacy components, in transition out
- **hooks/ lib/ providers/ services/ utils/ types/**: client-side support code
- **css/**: stylesheets (Tailwind v4)

#### Configuration (`config/`)

- **auth.ts**: 4 guards — `jwt` (default, cookie-based custom guard from `#shared/jwt`), `api` (access tokens), `web` (session), `basicAuth`
- **database.ts**: `DB_CONNECTION` selects `postgres` (default) or `sqlite`
- **drive.ts**: file storage (`DRIVE_DISK`: fs / s3 / spaces / r2 / gcs)
- **mail.ts**, **redis.ts**, **cache.ts**, **limiter.ts**, **queue.ts**, **inertia.ts**, etc.

### Multi-Tenancy

The app is multi-tenant with an **N:N** relationship:

- **`Tenant`** model (`tenants` table) and a **`user_tenants`** pivot carrying a `role` column
  (`owner` / `admin` / `member`, defaults to `member`). `User` `manyToMany` `Tenant`.
- The **active tenant rides in the verified access JWT** as a `tenantId` claim (minted on sign-in
  and on tenant switch). Tenant-scoped entities explicitly declare a non-null `tenant_id` and their
  repositories must scope reads and writes to `ctx.tenant.id`.
- **`#shared/middleware/tenant_middleware`** resolves `ctx.tenant` in this order:
  1. `x-tenant-id` request header
  2. `tenantId` claim from the JWT (bearer header or `token` cookie)
  3. fallback: the user's first tenant (via `user_tenants`)

  It **always enforces membership** — resolving a tenant the user doesn't belong to throws
  `ForbiddenException`. If nothing resolves, the request continues without `ctx.tenant`.

- **Endpoints:**
  - API: `GET /api/v1/tenants/me` (lists tenants + the user's role in each),
    `POST /api/v1/tenants/switch` (validates membership, mints fresh tokens with the new `tenantId`)
  - Web (Inertia): `POST /tenant/switch` (re-mints the JWT **cookie** with the new `tenantId`)
- **Global (NOT tenant-scoped):** `roles`, `permissions`, and `audit_logs` are global.

### Authentication & Authorization

RBAC on top of the multi-guard auth:

- **Guards**: `jwt` (default — custom guard in `#shared/jwt`, cookie + `Authorization` header),
  `api` (access tokens), `web` (session), `basicAuth`.
- **Role–Permission system**: users have roles, roles have permissions, users can also have
  direct permissions. Roles can **inherit** permissions from other roles. Permission checks are
  **cached**.
- **Named middleware** (`start/kernel.ts`): `auth`, `guest`, `acl`, `permission`, `ownership`,
  `tenant` — all resolve from `#shared/middleware/*`.
- **Ownership-based access**: `ownership` middleware + `ownership_service` validate that a user
  owns the resource being accessed.

### Frontend (UI components)

The UI is built on a **Metronic (shadcn-style) component library** under
`inertia/components/ui/` (~78 components, kebab-case filenames). It leans on Radix UI primitives,
`class-variance-authority`, `tailwind-merge`, and `lucide-react`. The admin shell
(`inertia/layouts/main_layout.tsx`) provides a sidebar + header with a **tenant switcher**, user
menu, and theme toggle (`next-themes`). Legacy components live in `inertia/components/ui/core/`
and are being phased out — prefer the top-level `ui/` components for new work.

### Database

- **ORM**: Lucid with snake_case naming strategy
- **Migrations**: `database/migrations/` (includes `create_tenants_table`, `create_user_tenants_table`)
- **Pre-1.0 migration policy**: this is an unreleased template, so unshipped schema changes belong in the original `create_*` migration. Recreate dev/test databases instead of adding compatibility alters. Add a new migration only for a genuinely new table/schema object. After the first stable release, migrations become append-only.
- **Soft Deletes**: `User` uses an `is_deleted` flag; other domains must opt in explicitly
- **Relationships**: heavy use of many-to-many (RBAC roles/permissions, user↔tenant)

### Testing

Three Japa suites are configured in `adonisrc.ts`:

- **unit**: `tests/unit/**/*.spec.ts` (2s timeout)
- **functional**: `tests/functional/**/*.spec.ts` (30s timeout)
- **browser**: `tests/browser/**/*.spec.ts` (60s timeout, Playwright via `@japa/browser-client`)

Frontend tests run under **Vitest** (`pnpm test:ui`) with Testing Library + jsdom + MSW.
Japa is wired with the API client and OpenAPI assertion support. Tests need Postgres + Redis.

### Import Aliases

Defined in `package.json` `imports` (and mirrored in tsconfig):

- `#modules/*` → `./app/modules/*.js`
- `#shared/*` → `./app/shared/*.js`
- `#exceptions/*` → `./app/exceptions/*.js`
- `#providers/*` → `./providers/*.js`
- `#database/*` → `./database/*.js`
- `#tests/*` → `./tests/*.js`
- `#start/*` → `./start/*.js`
- `#config/*` → `./config/*.js`

> The old per-layer aliases (`#controllers`, `#models`, `#services`, `#repositories`,
> `#middleware`, `#validators`, `#interfaces`, `#routes`) were **removed**. Do not use them.

## AdonisJS Commands Reference

> **Important:** ace runs via `pnpm ace <cmd>` (not `node ace`). The `make:*` generators emit
> files into the **default** AdonisJS layout (`app/controllers`, `app/models`, …) and reference
> the default aliases. This repo is **modular** — after generating, **move the file into the
> correct `app/modules/<domain>/` (or `app/shared/`) folder and fix imports to `#modules/*` /
> `#shared/*`**. When in doubt, copy the shape of an existing module instead of scaffolding.

### File Generation Commands

```bash
pnpm ace make:controller Product            # → move to app/modules/products/controllers/
pnpm ace make:controller Product --resource # RESTful methods
pnpm ace make:model Product                 # → move to app/modules/products/models/
pnpm ace make:model Product -m              # model + migration
pnpm ace make:migration products            # → database/migrations/ (correct as-is)
pnpm ace make:migration add_x_to_products --alter
pnpm ace make:service products/CreateProduct # → move to app/modules/products/services/
pnpm ace make:middleware RateLimit          # → move to app/shared/middleware/
pnpm ace make:validator products/Create     # → move to app/modules/products/validators/
pnpm ace make:test ProductController --suite=functional
pnpm ace make:factory Product               # → database/factories/ (correct as-is)
pnpm ace make:seeder Product                # → database/seeders/ (correct as-is)
pnpm ace make:event ProductCreated          # → move into the owning module
pnpm ace make:listener SendNotification
pnpm ace make:mail VerifyEmail
pnpm ace make:exception SomethingFailed     # → app/exceptions/
pnpm ace make:provider AppProvider          # → providers/ (correct as-is)
pnpm ace make:command SendEmails            # → commands/ (correct as-is)
pnpm ace make:job ProcessPayment
```

### Migration Commands

```bash
pnpm ace migration:run        # run pending
pnpm ace migration:rollback   # rollback last batch
pnpm ace migration:reset      # rollback all
pnpm ace migration:fresh      # drop all tables and re-migrate
pnpm ace migration:refresh    # rollback + re-run all
pnpm ace migration:status     # check status
```

### Package Management

```bash
pnpm ace add @adonisjs/lucid        # install + configure a package
pnpm ace configure @adonisjs/lucid  # configure an already-installed package
```

## REPL (Read-Eval-Print Loop) Usage

### Starting REPL

```bash
pnpm ace repl
```

### Common REPL Operations

```javascript
// Import a model (use the MODULAR alias)
const User = await importDefault('#modules/users/models/user')
const { default: Tenant } = await import('#modules/tenants/models/tenant')

// Query
const users = await User.all()
const user = await User.find(1)

// Create
const newUser = await User.create({ email: 'test@example.com', password: 'secret' })

// Load app services
await loadApp() // app service
await loadRouter() // router
await loadConfig() // config
await loadHash() // hash
await loadHelpers() // helpers
```

### REPL Tips

- Use modular aliases (`#modules/...`, `#shared/...`) — the legacy ones are gone.
- `importDefault()` for clean default imports.
- `.ls` lists available methods, Tab auto-completes, `.exit` (or Ctrl+C twice) quits.
- Great for testing queries, debugging services, and inspecting config before implementing.

## Important Instructions for AI Assistants

1. **Respect the modular structure** — code lives in `app/modules/<domain>/` and `app/shared/`.
   `make:*` output lands in the wrong place; move it and fix imports, or hand-write to match a
   sibling module.

2. **Follow the per-module flow** — Controller → Service → Repository → Model. Use `@inject()`
   for dependency injection. Keep business logic in services, not controllers.

3. **Use the modular import aliases** — `#modules/*`, `#shared/*`, `#exceptions/*`,
   `#config/*`, etc. Never use relative `../../` imports or the removed legacy aliases.

4. **Run ace via pnpm** — `pnpm ace <cmd>`, never `node ace`.

5. **Validate before committing**
   - `pnpm lint` — must pass
   - `pnpm typecheck` — must pass (checks backend **and** `inertia/`)
   - `pnpm test` — must pass (and `pnpm test:ui` if you touched the frontend)

6. **Multi-tenancy awareness** — tenant-scoped tables declare a non-null `tenant_id`; require the
   tenant middleware and scope every read/write by `ctx.tenant.id`. Roles, permissions and audit
   logs remain global in the current RBAC model.

7. **Keep pre-1.0 migrations native** — update the original create migration for unshipped schema
   changes and rebuild the disposable dev/test database. Do not add alter/backfill migrations for
   compatibility with a schema that has never been released.

8. **Example workflow** (new "products" feature)

   ```bash
   pnpm ace make:model Product -m
   pnpm ace make:controller Product --resource
   pnpm ace make:validator products/CreateProduct
   pnpm ace make:service products/CreateProduct
   # then MOVE the generated controller/model/validator/service into
   # app/modules/products/{controllers,models,validators,services}/ and rewrite
   # their imports to #modules/* / #shared/*, add app/modules/products/routes.ts,
   # and import it from start/routes.ts
   pnpm ace migration:run
   ```
