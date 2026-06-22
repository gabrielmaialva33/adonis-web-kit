# Plano Mestre — adonis-web-kit → base v7 modular multi-tenant + UI Metronic

> Objetivo: transformar o `adonis-web-kit` numa **boa base genérica** (starter kit) com:
> AdonisJS **v7** + arquitetura **modular** (estilo eduguard) + **multi-tenancy genérico** +
> biblioteca de **componentes UI** (inspirada no Metronic v9.5.0 / base shadcn MIT).
>
> Princípios: módulos **genéricos de plataforma** (auth, users, roles, permissions, files, tenants) —
> SEM domínio do eduguard (risk, school, compliance). Multi-tenant genérico (`tenant_id`/`organization_id`,
> NÃO `school_id`). Cada fase é um commit isolado e validado.

## Gabaritos de referência
- `/home/gabrielmaia/Documents/projects/eduguard` → arquitetura v7 modular + multi-tenant (JÁ roda v7).
- `/home/gabrielmaia/Documents/metronic-v9.5.0/metronic-tailwind-react-starter-kit/typescript/vite` → UI (React 19 + Tailwind v4 + Radix). **Licença comercial Envato** → usar shadcn/ui (MIT) + Metronic como referência visual; NÃO copiar 1:1 em repo público.

## Estado / baseline
- Branch: `feat/v7-modular-multitenant`
- Baseline v6: `pnpm typecheck` ✅ verde (exit 0)
- pnpm 11.3.0, node v22.19.0 (eduguard v7 roda nisso de boa)

## Versões alvo (v7) — confirmadas via npm
| pacote | v6 atual | v7 alvo |
|---|---|---|
| @adonisjs/core | ^6.19 | ^7.3.4 |
| @adonisjs/lucid | ^21.8 | ^22.4.2 |
| @adonisjs/auth | ^9.4 | ^10.1.0 |
| @adonisjs/inertia | 4.0.0-next.0 | ^4.2.0 |
| @adonisjs/cors | ^2.2 | ^3.0.0 |
| @adonisjs/drive | ^3.4 | ^4.0.0 |
| @adonisjs/mail | ^9.2 | ^10.2.1 |
| @adonisjs/redis | ^9.2 | ^10.0.0 |
| @adonisjs/session | ^7.5 | ^8.1.0 |
| @adonisjs/static | ^1.1 | ^2.0.1 |
| @adonisjs/vite | 5.0.0-next.0 | ^5.1.1 |
| @adonisjs/cache | ^1.3 | ^2.1.0 |
| @adonisjs/limiter | ^2.4 | ^3.0.1 |
| @adonisjs/shield | ^8.2 | ^9.0.0 |
| @adonisjs/ally | ^5.1 | ^6.3.0 |
| @adonisjs/i18n | ^2.2 | ^3.0.1 |
| @vinejs/vine | ^3.0 | ^4.4.0 |
| @adonisjs/assembler (dev) | ^7.8 | ^8.4.0 |
| @adonisjs/eslint-config (dev) | ^2.1 | ^3.1.0 |
| @adonisjs/tsconfig (dev) | ^1.4 | ^2.0.0 (ou tsconfig explícito) |
| typescript (dev) | ~5.9 | ~6.0.3 |
| eslint (dev) | ^9.34 | ^10.4 |
| **+ @poppinss/ts-exec (dev)** | — | 1.4.4 (novo runtime) |
| **− ts-node-maintained** | remover | — |

## Mudanças de toolchain v6→v7 (do gabarito eduguard)
- Runtime: `node --import=@poppinss/ts-exec ace.js ...` (substitui ts-node-maintained).
- `ace.js` = wrapper 3 linhas → `await import('./bin/console.ts')`.
- `bin/server.ts` / `bin/console.ts` enxutos (Ignitor + IMPORTER).
- `tsconfig.json` explícito (NÃO estende preset), com `rewriteRelativeImportExtensions: true`, TS6.
- `tsconfig.frontend.json` separado pro inertia.
- Scripts `typecheck` rodam backend + frontend.

---

## FASE 1 — Upgrade v7 (sobre estrutura ATUAL)  [commit: `chore: upgrade to adonisjs v7`]
Isola breaking changes de framework antes de mexer em layout.
1. Reescrever `package.json`: versões v7, scripts ts-exec, remover ts-node, +ts-exec. (aliases ficam pra Fase 2)
2. `ace.js`, `bin/{server,console,test}.ts` no estilo v7.
3. `tsconfig.json` explícito + `tsconfig.frontend.json`.
4. `eslint.config.js` (configApp v3).
5. `adonisrc.ts`: `hooks.buildStarting` (era `onBuildStarting`?), experimental flags, ajustar providers.
6. `pnpm install`, depois consertar breaking changes em cascata:
   - config/* (auth v10, session v8, shield v9, limiter v3, vine v4, drive v4...).
   - VineJS v3→v4 (validators).
   - Lucid v21→v22 (paginator/naming, tipos).
   - Auth v9→v10 (guards, jwt custom, tokens).
7. Validar: `pnpm typecheck` + `pnpm test` (unit) + build.

## FASE 2 — Reestruturação modular  [commit: `refactor: modular architecture (app/modules + app/shared)`]
Mover sem mudar lógica. Aliases: `#modules/*`, `#shared/*`, `#exceptions/*`.
```
app/modules/{auth,users,roles,permissions,files,health,web}/{controllers,services,repositories,models,validators,routes.ts,interfaces}
app/shared/{models,repositories,middleware,services,helpers,jwt}
app/exceptions/
```
- Atualizar `package.json` imports + `tsconfig` paths.
- Atualizar todos os imports (`#controllers`→`#modules/.../controllers` etc).
- `start/routes.ts` importa `#modules/*/routes`.
- ⚠️ Quebra a regra "sempre ace make" do CLAUDE.md → atualizar CLAUDE.md no fim (Fase 6).
- Validar typecheck + test.

## FASE 3 — Patterns eduguard  [commit: `refactor: adopt AppError, base_repository, jwt_guard`]
1. `app/exceptions/app_error.ts` (factory: badRequest/unauthorized/forbidden/notFound/unprocessable) + handler.
2. `app/shared/repositories/base_repository.ts` (substitui lucid_repository) — query tenant-scoped.
3. `app/modules/auth/guards/jwt_guard.ts` (generateTokenPair/refresh/revokeAll) — consolida shared/jwt.
4. **Renomear `optimized_permission_service.ts` → `permission_service.ts`** (mata o adjetivo).
5. `validators/index.ts` por módulo.
6. Validar.

## FASE 4 — Multi-tenancy genérico  [commit: `feat: generic multi-tenancy`]
1. `app/shared/models/tenant_base_model.ts` (tenantId + soft delete).
2. Modelo `Tenant`/`Organization` + migration.
3. Migration: add `tenant_id` em users/files/etc (FK).
4. `app/shared/middleware/tenant_middleware.ts` → `ctx.tenant.id` (do JWT claim).
5. Repos tenant-scoped (`query(tenantId)`).
6. JWT payload inclui `tenantId`.
7. Seeder: tenant default + admin.
8. Validar (migrations + test).

## FASE 5 — UI / componentes (Metronic→shadcn)  [commit: `feat: UI component library + admin layout`]
1. Subir libs frontend (vite 8, migrar `@radix-ui/react-*` → `radix-ui` unificado? avaliar), tailwind tokens.
2. `inertia/components/ui/` — set shadcn completo (button, card, input, form, dialog, select, badge, avatar, table, tabs, dropdown, etc.) com styling estilo Metronic.
3. `data-grid` (TanStack Table) com filter/sort/pagination/visibility.
4. Layout admin: sidebar + header + breadcrumb + user menu + theme toggle (adaptar Metronic layout-1 pro Inertia, sem React Router).
5. Páginas: dashboard com widgets/stats, auth (login/register), users CRUD, files, account settings.
6. `tsconfig.frontend.json` + vitest verde.

## FASE 6 — Validação final + docs  [commit: `docs: update for v7 modular architecture`]
- `pnpm lint && pnpm typecheck && pnpm test && pnpm build` verdes.
- Atualizar `CLAUDE.md` (nova arquitetura modular; ajustar regra "ace make").
- Atualizar README + `.env.example` (tenant vars).
- PR.

## Riscos
- Auth v9→v10 + JWT guard custom: maior risco de breaking.
- Reestruturação modular: centenas de imports — fazer com typecheck a cada bloco.
- Multi-tenant: mexe em schema (migrations) — irreversível em dados; só em dev.
- Licença Metronic: não copiar 1:1 (usar shadcn MIT).
