# Repository Guidelines

## Project Structure & Module Organization

This is an AdonisJS 7, React 19, and Inertia application. Backend features live in `app/modules/<domain>/`; each domain owns its controllers, services, repositories, models, validators, and `routes.ts`. Put cross-cutting middleware, JWT support, the shared Lucid repository, and shared services in `app/shared/`, and typed errors in `app/exceptions/`.

Frontend pages, layouts, components, hooks, and styles live under `inertia/`. Database migrations, factories, and seeders are in `database/`; server-rendered views and translations are in `resources/`. Backend tests mirror their suite under `tests/{unit,functional,browser}/`, while frontend tests live in `inertia/tests/`.

Adonis generators target the framework's default layout, which this repository does not use. If you run `pnpm ace make:*`, move generated code into the owning module and replace default aliases with `#modules/*`, `#shared/*`, or another alias declared in `package.json`.

## Build, Test, and Development Commands

- `pnpm install --frozen-lockfile` installs the locked dependency graph using pnpm.
- `pnpm dev` starts the application and Vite with HMR; PostgreSQL and Redis must be available.
- `pnpm ace migration:run` applies pending migrations; `pnpm ace db:seed` loads seed data.
- `pnpm build` creates the production backend and frontend bundles.
- `pnpm typecheck && pnpm lint` checks both TypeScript projects and ESLint rules.
- `pnpm test:e2e && pnpm test:ui` runs all Japa suites, then Vitest. Use `pnpm test` for backend unit tests only.

Use Node 24 from `.nvmrc`. Copy `.env.example` to `.env` for local development; never commit real credentials.

## Migration Policy Before 1.0

This repository is still a pre-release template. Keep migrations optimized for a clean installation: when an unshipped table or constraint changes, update its original `create_*` migration and recreate the development/test database. Add a new migration only for a genuinely new table or other new schema object. After the first stable release, switch to append-only forward migrations and never rewrite published history.

## Coding Style & Naming Conventions

TypeScript is strict. Use two-space indentation, LF endings, snake_case filenames, PascalCase classes and React components, and camelCase functions and variables. Run `pnpm format` (Prettier) and `pnpm lint` before submitting. Follow neighboring modules instead of introducing a new layering pattern. Do not restore removed aliases such as `#controllers/*` or `#models/*`.

## Testing Guidelines

Japa backend tests use `*.spec.ts`; Vitest/Testing Library frontend tests use `*.test.tsx` or `*.spec.tsx`. Add regression coverage in the closest matching suite. Tests migrate and seed the database automatically from `.env.test`; browser tests require Playwright Chromium. No coverage threshold is enforced, but changed behavior should be exercised.

## Commit & Pull Request Guidelines

History follows Conventional Commits, usually with scopes: `feat(ui): ...`, `fix(auth): ...`, `refactor(jwt): ...`, or `chore(ci): ...`. Keep commits focused and imperative. Pull requests should explain impact, link relevant issues, call out migrations or environment changes, include screenshots for UI work, and report results for lint, typecheck, tests, and build.
