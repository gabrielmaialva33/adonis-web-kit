/**
 * Constantes de rotas da aplicação
 */

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  LOGOUT: '/logout',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  HOME: '/',
  
  // Users
  USERS: {
    INDEX: '/users',
    CREATE: '/users/create',
    EDIT: (id: number | string) => `/users/${id}/edit`,
  },
  
  // Files
  FILES: {
    INDEX: '/files',
  },
  
  // UI Demo
  UI_DEMO: '/ui-demo',
} as const

export const API_ROUTES = {
  // Auth
  SIGN_IN: '/api/v1/sessions/sign-in',
  SIGN_UP: '/api/v1/sessions/sign-up',
  
  // Users
  USERS: {
    INDEX: '/api/v1/users',
    SHOW: (id: number | string) => `/api/v1/users/${id}`,
    CREATE: '/api/v1/users',
    UPDATE: (id: number | string) => `/api/v1/users/${id}`,
    DELETE: (id: number | string) => `/api/v1/users/${id}`,
    ME: '/api/v1/users/me',
  },
  
  // Roles
  ROLES: {
    INDEX: '/api/v1/roles',
    SHOW: (id: number | string) => `/api/v1/roles/${id}`,
  },
  
  // Permissions
  PERMISSIONS: {
    INDEX: '/api/v1/permissions',
  },
  
  // Files
  FILES: {
    UPLOAD: '/api/v1/files/upload',
    DOWNLOAD: (id: number | string) => `/api/v1/files/${id}/download`,
  },
} as const
