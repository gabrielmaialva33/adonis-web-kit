/**
 * Inertia page registry.
 *
 * Inertia v4 types `inertia.render(page, props)` against this interface. Each
 * key is a page component (relative to `inertia/pages`) and the value describes
 * the props passed from the controller. Pages without page-specific props use
 * an empty object.
 */
import type { DashboardStats } from '#modules/web/services/get_dashboard_stats_service'

declare module '@adonisjs/inertia/types' {
  interface InertiaPages {
    // Auth
    'auth/login': Record<string, never>
    'auth/register': Record<string, never>

    // Root / misc
    'home': Record<string, never>
    'ui_demo': Record<string, never>
    'dashboard': { stats: DashboardStats }

    // Files
    'files/index': Record<string, never>

    // Users
    'users/index': {
      users: Record<string, any>
      search: string
      sortBy: string
      direction: string
    }
    'users/create': Record<string, never>
    'users/edit': {
      user: Record<string, any> | null
    }

    // Error pages
    'errors/not_found': {
      error: Record<string, any>
    }
    'errors/server_error': {
      error: Record<string, any>
    }
  }
}
