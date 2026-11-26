# Contributing to Adonis Web Kit

Thank you for contributing. This is a pre-1.0 AdonisJS 7, React 19, and Inertia
template. Read the [Code of Conduct](CODE_OF_CONDUCT.md) before participating.
Report vulnerabilities privately using the [security policy](SECURITY.md), never
in a public issue or pull request. Contributions are made under the repository's
[MIT license](LICENSE).

## Local setup

1. Fork the repository and create a focused branch from `master`.
2. Use the Node version pinned in [.nvmrc](.nvmrc): currently **24.21.0**. With nvm,
   run `nvm install` and `nvm use`. With Mise, prefix commands with
   `mise exec node@24.21.0 --`.
3. Install **pnpm 11**, preferably **11.22.0**, matching `packageManager` in
   [package.json](package.json). Install the locked dependencies:

   ```sh
   pnpm install --frozen-lockfile
   cp .env.example .env
   pnpm ace generate:key
   ```

4. Provide dedicated PostgreSQL and Redis instances. The bundled compose uses
   PostgreSQL 16 and Redis 7; Mailpit is available for local email:

   ```sh
   docker context show
   docker compose up -d postgres redis mailpit
   ```

   Check for port conflicts before starting services. Docker bind mounts and
   published ports belong to the active Docker host; a remote context does not
   publish ports on your workstation. Configure `.env` from
   [.env.example](.env.example), including `DB_*`, `REDIS_*`, `QUEUE_REDIS_*`, and
   SMTP settings for your actual service host. Use disposable resources dedicated
   to this project, not another application's databases or Redis.

5. After checking that `.env` points to your development database, initialize it:

   ```sh
   pnpm ace migration:run
   pnpm ace db:seed
   pnpm dev
   ```

Use **`pnpm ace <command>`**, not `node ace`: the package script supplies the
TypeScript loader. Never commit `.env`, real credentials, tokens, or private data.

## Architecture and conventions

Follow [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md). Backend features belong in
`app/modules/<domain>/`, with their own controllers, services, repositories,
models, validators, and `routes.ts`. Cross-cutting middleware, JWT support, and
shared services belong in `app/shared/`; typed exceptions belong in
`app/exceptions/`. Register module routes through `start/routes.ts`.

Keep the flow **controller → service → repository → model**. Controllers validate
requests and shape responses; services contain business rules; repositories own
queries. Use `@inject()` for dependency injection. Use `#modules/*`, `#shared/*`,
`#exceptions/*`, and the other aliases declared in `package.json`; do not introduce
relative `../../` imports or legacy aliases such as `#models/*` or `#controllers/*`.
Adonis generators target the default layout, so relocate generated files into the
correct module and fix their imports before submitting them.

Frontend code lives in `inertia/`. Backend tests are in
`tests/{unit,functional,browser}/` (`*.spec.ts`); frontend tests are in
`inertia/tests/` (`*.test.tsx`, `*.spec.tsx`, or the existing `*.test.ts` convention).
Use strict TypeScript, two-space indentation, LF endings, snake_case backend
filenames, PascalCase classes/components, and camelCase functions/variables.
Follow neighboring frontend filenames and components.

## Multi-tenancy and security

Tenant-scoped tables must have a non-null `tenant_id`. Require tenant middleware
and pass the verified `ctx.tenant.id` through services to repositories, filtering
every tenant-scoped read and write. Never authorize an object by its ID alone or
trust a client-supplied tenant ID without checking active membership. The existing
explicit-tenant download route checks membership in the tenant named in the URL
before making a scoped query; preserve that check when extending it.

Users can belong to multiple tenants. Roles, permissions, and audit logs are
global in the current model; do not silently change their scope. Add tests for
foreign tenants, inactive membership, insufficient permissions, ownership, and
privileged target accounts when changing authorization. Preserve hierarchical
RBAC, private storage, credential revocation, refresh rotation, and CSRF protection
for API mutations authenticated by cookie. See [SECURITY.md](SECURITY.md).

## Migrations before 1.0

For an unshipped table or constraint, edit its original `create_*` migration and
recreate only the disposable development/test database. Do not add an `alter`
migration for that change. Add a migration for a genuinely new table or schema
object. Explain schema changes and recreation requirements in the PR. After the
first stable release, migration history becomes append-only.

## Regression tests and required checks

Add a regression test that fails before a bug fix and passes afterward. Prefer
Japa unit/functional tests for backend behavior and Vitest for frontend behavior;
use browser tests when the behavior requires a real browser. Mock mail/cloud
integrations and use synthetic credentials rather than ambient cloud credentials.

Japa setup automatically migrates and seeds the database, rolls back migrations,
and clears Redis/limiter state. Configure the values from [.env.test](.env.test)
for **dedicated disposable test services**, using command-line environment
overrides when needed. Do not point tests at a development, production, shared,
or unrelated project's database or Redis. Install the browser used by the suite:

```sh
pnpm exec playwright install chromium
```

Run all required gates before requesting review:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm test:ui
pnpm build
```

`pnpm test` runs Japa unit tests; `pnpm test:e2e` runs unit, functional, and browser
suites, so the unit coverage intentionally overlaps. `pnpm typecheck` checks both
backend and frontend. The [CI workflow](.github/workflows/ci-cd.yml) runs lint,
typecheck, all Japa suites, Vitest, and build against PostgreSQL/Redis services,
with Node from `.nvmrc` and pnpm 11.22.0. Record exact results and any environment
limitation in your PR; an unrun check is not a passing check.

Cap frontend workers on memory-constrained machines with
`pnpm test:ui --maxWorkers=4`. On Linux with a user systemd session, the equivalent
bounded run is:

```sh
systemd-run --user --scope -p MemoryHigh=10G -p MemoryMax=12G \
  -p MemorySwapMax=2G -p OOMPolicy=kill -- \
  pnpm exec vitest run --maxWorkers=4
```

Use `pnpm exec prettier --check .` for a read-only formatting check. The existing
`pnpm format` script is `prettier --write .`, so it rewrites files; prefer
`pnpm exec prettier --write <changed-files>` to avoid unrelated formatting changes.

## Issues, commits, and pull requests

Use the bug and feature issue forms. Include a minimal reproduction, runtime and
service versions, expected/actual behavior, and redacted logs for bugs. Explain
the user problem and alternatives for features. Discuss substantial architecture
changes in a feature request before implementing them.

Follow Conventional Commits with focused, imperative subjects, matching history:
`fix(auth): invalidate stale credentials`, `feat(health): include Redis in readiness checks`,
`test(security): add authorization regressions`, or `docs(readme): clarify setup`.

Open PRs against `master` using the provided template. Explain the problem,
resulting behavior, linked issues, tests, migrations, and multi-tenancy/security
impact. Include screenshots for UI changes and document new configuration.
Keep unrelated changes out of the PR and do not include private incident details.
