# Copilot Instructions for Adonis Web Kit

## 🚨 Critical Rule: Use AdonisJS Commands

**NEVER manually create files.** Always use AdonisJS Ace commands:

- `node ace make:controller User` for controllers
- `node ace make:model Post -m` for models with migrations
- `node ace make:service users/CreateUser` for services
- `node ace make:middleware Auth` for middleware

## Architecture Overview

This is an **AdonisJS v6 + React 19 + Inertia.js** monorepo with comprehensive RBAC system.

### Key Patterns

**Service-Repository Pattern**: Business logic in `/app/services/` organized by domain (users/, roles/, permissions/). Repositories in `/app/repositories/` extend `LucidRepository` base class.

**Dependency Injection**: All services use `@inject()` decorator with constructor injection:

```typescript
@inject()
export default class CreateUserService {
  constructor(private userRepository: UsersRepository) {}
}
```

**Domain Events**: Authentication actions emit events (`auth:login_succeeded`, `auth:user_registered`) handled by `AuthEventService` and logged via `AuthEventsProvider`.

## Import Aliases (Always Use These)

Essential aliases defined in `package.json`:

- `#controllers/*` → `./app/controllers/*.js`
- `#services/*` → `./app/services/*.js`
- `#repositories/*` → `./app/repositories/*.js`
- `#models/*` → `./app/models/*.js`
- `#middleware/*` → `./app/middleware/*.js`
- `#validators/*` → `./app/validators/*.js`
- `#interfaces/*` → `./app/interfaces/*.js`
- `#config/*` → `./config/*.js`

## Authentication System

**Multi-Guard Setup**: JWT (default), API tokens, session, basic auth in `config/auth.ts`.

**Custom JWT Guard**: Located in `app/shared/jwt/` - handles token generation, verification, and cookie/header extraction.

**Authentication Flow**:

1. Sign-in → `SignInService` → `JwtAuthTokensService` → returns `{ access_token, refresh_token }`
2. Auth middleware checks JWT via custom guard
3. Events emitted for login attempts, successes, failures

## Permission System

**RBAC with Inheritance**: Users → Roles → Permissions with caching via Redis.

**Key Middleware**:

- `acl` - Role-based access: `middleware.acl({ role_slugs: [IRole.Slugs.ADMIN] })`
- `permission` - Permission-based: `middleware.permission({ permissions: ['users.read'] })`
- `ownership` - Resource ownership validation

**Permission Checking**: Services use `PermissionRepository.checkUserPermission(userId, permission)` with Redis caching.

## Data Layer

**Base Repository**: All repositories extend `LucidRepository` with common CRUD operations, pagination, and soft deletes.

**Model Patterns**:

- Snake_case naming strategy
- Soft deletes in User model
- Extensive M:N relationships for RBAC
- Metadata JSON columns for flexible storage

## Testing Strategy

**Two Test Suites** in `adonisrc.ts`:

- Unit tests: `tests/unit/**/*.spec.ts` (2s timeout)
- Functional tests: `tests/functional/**/*.spec.ts` (30s timeout)

**Testing Patterns**: Each test wraps in `testUtils.db().withGlobalTransaction()` for isolation.

## File Organization

**Domain Modules**: `app/modules/<domain>/` owns its controllers, services, repositories, models, validators, interfaces, and routes.

**Shared Infrastructure**: Cross-cutting middleware, JWT support, Lucid repository helpers, and ownership checks live under `app/shared/`.

**Event-Driven**: Authentication events live in `app/modules/auth/events/auth_events.ts` with listeners registered by `providers/auth_events_provider.ts`.

## Development Commands

**Essential Commands**:

- `pnpm dev` - Development with HMR
- `pnpm ace migration:run` - Run migrations
- `pnpm ace db:seed` - Seed the development database
- `pnpm test` - Unit tests only
- `pnpm test:e2e` - All tests

**Production**:

- `pnpm build` - Build for production
- `pnpm start` - Production server

## Frontend Integration

**Inertia.js Bridge**: Controllers return `inertia.render('PageName', data)` to React components in `/inertia/pages/`.

**Type Safety**: Shared TypeScript interfaces ensure end-to-end type safety between backend and frontend.

**Auth Service**: Frontend uses `/inertia/services/auth_service.ts` for API authentication calls.
