# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development

- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build application for production
- `pnpm start` - Start production server

### Testing

- `pnpm test` - Run unit tests only
- `pnpm run test:e2e` - Run all tests (functional and e2e)

### Code Quality

- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Fix linting issues automatically
- `pnpm run format` - Format code with Prettier
- `pnpm run typecheck` - Run TypeScript type checking

### Database

- `node ace migration:run` - Run pending migrations
- `node ace db:seed` - Run database seeders
- `node ace migration:rollback` - Rollback last migration

### Docker

- `pnpm run docker` - Run migrations, seeders, and start server

## Architecture Overview

This is an AdonisJS v6 application with React frontend using Inertia.js. The project follows a modular structure with
clear separation of concerns.

### Key Technologies

- **Backend**: AdonisJS v6 (Node.js framework)
- **Frontend**: React 19 with Inertia.js for SPA-like experience
- **Database**: PostgreSQL (production), SQLite (testing)
- **Styling**: TailwindCSS v4
- **Authentication**: Multiple guards - JWT (default), API tokens, session, basic auth
- **Validation**: VineJS
- **Testing**: Japa framework
- **Queue**: Bull Queue with Redis

### Project Structure

#### Backend Architecture (`app/`)

- **controllers/**: HTTP request handlers organized by domain (user, role, permission, file, health)
- **models/**: Lucid ORM models with relationships and hooks
- **services/**: Business logic layer organized by domain with specific use cases
- **repositories/**: Data access layer abstraction
- **middleware/**: HTTP middleware for auth, ACL, ownership checks
- **validators/**: Request validation schemas
- **events/**: Domain events and listeners
- **exceptions/**: Custom exception classes

#### Frontend (`inertia/`)

- **app/**: React application entry points
- **pages/**: React page components
- **css/**: Stylesheets

#### Configuration (`config/`)

- **auth.ts**: Multi-guard authentication (JWT default, API tokens, session, basic auth)
- **database.ts**: PostgreSQL/SQLite configuration
- **drive.ts**: File storage (local, S3, GCS)

### Authentication & Authorization

The application uses a comprehensive RBAC (Role-Based Access Control) system:

- **Multiple Auth Guards**: JWT (default), API tokens, session, basic auth
- **Role-Permission System**: Users have roles, roles have permissions, users can have direct permissions
- **Permission Inheritance**: Roles can inherit permissions from other roles
- **Permission Caching**: Optimized permission checking with caching
- **Ownership-based Access**: Middleware for resource ownership validation

### Key Features

- **User Management**: CRUD operations with email verification
- **Role Management**: Dynamic role creation and permission assignment
- **File Upload**: Multi-provider file storage (local, S3, GCS)
- **Audit Logging**: Track user actions and changes
- **Rate Limiting**: API throttling
- **Internationalization**: Multi-language support (en/pt)
- **Health Checks**: System health monitoring

### Import Aliases

The project uses extensive import aliases defined in `package.json`:

- `#controllers/*` → `./app/controllers/*.js`
- `#models/*` → `./app/models/*.js`
- `#services/*` → `./app/services/*.js`
- `#repositories/*` → `./app/repositories/*.js`
- `#middleware/*` → `./app/middleware/*.js`
- `#validators/*` → `./app/validators/*.js`
- `#config/*` → `./config/*.js`
- And many more...

### Database

- **ORM**: Lucid with snake_case naming strategy
- **Migrations**: Located in `database/migrations/`
- **Soft Deletes**: Implemented in User model
- **Relationships**: Extensive use of many-to-many relationships for RBAC

### Testing

Two test suites configured in `adonisrc.ts`:

- **Unit tests**: `tests/unit/**/*.spec.ts` (2s timeout)
- **Functional tests**: `tests/functional/**/*.spec.ts` (30s timeout)

Uses Japa testing framework with API client and OpenAPI assertion support.

### File Organization

Services are organized by domain with specific use cases:

- `app/services/users/` - User-related operations
- `app/services/permissions/` - Permission management
- `app/services/roles/` - Role management
- `app/services/audits/` - Audit logging
- `app/services/upload/` - File upload handling

This structure promotes maintainability and clear separation of business logic.
