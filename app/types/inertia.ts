/**
 * Inertia page registry.
 *
 * Inertia v4 types `inertia.render(page, props)` against this interface. Each
 * key is a page component (relative to `inertia/pages`) and the value describes
 * the props passed from the controller. Pages without page-specific props use
 * an empty object.
 */
import type { FileListResult } from '#modules/files/services/list_files_service'
import type { DashboardStats } from '#modules/web/services/get_dashboard_stats_service'
import type { WebRole } from '#modules/web/services/list_roles_with_permissions_service'
import type { WebPermission } from '#modules/web/services/list_all_permissions_service'

type SettingsProfile = {
  id: number
  full_name: string
  email: string
  username: string | null
}

declare module '@adonisjs/inertia/types' {
  interface InertiaPages {
    // Auth
    'auth/login': Record<string, never>
    'auth/register': Record<string, never>
    'auth/forgot_password': Record<string, never>
    'auth/reset_password': { token: string }

    // Root / misc
    'home': Record<string, never>
    'ui_demo': Record<string, never>
    'data_grid_demo': Record<string, never>
    'dashboard': { stats: DashboardStats }

    // Files
    'files/index': { files: FileListResult }

    // Roles
    'roles/index': { roles: WebRole[] }

    // Permissions
    'permissions/index': { permissions: WebPermission[] }

    // Settings
    'settings/index': { profile: SettingsProfile }

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
