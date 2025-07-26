/**
 * Constantes de permissões RBAC
 */

export const PERMISSIONS = {
  // Users
  USERS: {
    LIST: 'users.list',
    CREATE: 'users.create',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
    VIEW: 'users.view',
  },
  
  // Roles
  ROLES: {
    LIST: 'roles.list',
    CREATE: 'roles.create',
    UPDATE: 'roles.update',
    DELETE: 'roles.delete',
    ASSIGN: 'roles.assign',
  },
  
  // Permissions
  PERMISSIONS: {
    LIST: 'permissions.list',
    CREATE: 'permissions.create',
    UPDATE: 'permissions.update',
    DELETE: 'permissions.delete',
    ASSIGN: 'permissions.assign',
  },
  
  // Files
  FILES: {
    LIST: 'files.list',
    UPLOAD: 'files.upload',
    DOWNLOAD: 'files.download',
    DELETE: 'files.delete',
  },
  
  // Admin
  ADMIN: {
    ACCESS: 'admin.access',
    DASHBOARD: 'admin.dashboard',
  },
} as const

export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  USER: 'user',
} as const
