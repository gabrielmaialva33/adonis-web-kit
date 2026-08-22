export * from './api'

/**
 * The authenticated user as shared with every Inertia page by the
 * inertia middleware (a small subset of the full User model).
 */
export interface AuthUser {
  id: number
  full_name: string
  email: string
}

/**
 * A tenant the user belongs to, including the user's role inside it
 * (from the `user_tenants` pivot). Shared with every page.
 */
export interface TenantSummary {
  id: number
  name: string
  slug: string
  is_active: boolean
  role: string | null
}

export interface AuthSharedProps {
  user: AuthUser | null
  tenants: TenantSummary[]
  activeTenantId: number | null
  permissions: string[]
}

// Extend shared props with our app-specific props (declaration merging)
declare module '@adonisjs/inertia/types' {
  export interface SharedProps {
    auth?: AuthSharedProps
    flash?: {
      success?: string
      error?: string
      warning?: string
      info?: string
    }
  }
}
