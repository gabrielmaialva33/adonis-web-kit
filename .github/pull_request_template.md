## Problem and resulting behavior

<!-- Explain the problem, the resulting behavior, and relevant issue links. Do not include private security reports. -->

## Validation

<!-- Record commands, results, and any environment limitations. An unrun check is not a pass. -->

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm test:e2e` (unit + functional + browser)
- [ ] `pnpm test:ui` (use `--maxWorkers=4` when appropriate)
- [ ] `pnpm build`
- [ ] Changed files pass Prettier checks.

## Change checklist

<!-- For non-applicable items, state why in the impact notes below. -->

- [ ] I read [CONTRIBUTING.md](../CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md).
- [ ] Changes follow the modular layout, aliases, and controller → service → repository → model flow with `@inject()`.
- [ ] Bug fixes include regression tests that failed before the fix and pass afterward, or an explanation of why no regression test applies.
- [ ] Tenant-scoped reads/writes use the verified tenant; cross-tenant, membership, permission, and ownership effects have been reviewed and tested where applicable.
- [ ] Authentication, CSRF, RBAC, private storage, and secret-handling impact has been reviewed; vulnerability details follow [SECURITY.md](../SECURITY.md).
- [ ] Schema changes follow the pre-1.0 policy: edit original `create_*` migrations for unshipped objects; new migrations only for genuinely new schema objects.
- [ ] Configuration, migration/recreation requirements, and user-facing changes are documented.
- [ ] No credentials, private data, or unrelated changes are included.
- [ ] UI changes include screenshots or a reason they are unnecessary.

## Migration, configuration, and security impact

<!-- Describe schema changes, disposable database recreation, environment variables, compatibility, multi-tenancy/security effects, and any non-applicable checklist items. -->
