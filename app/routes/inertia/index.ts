/*
|--------------------------------------------------------------------------
| Inertia Routes
|--------------------------------------------------------------------------
|
| Routes for Inertia.js pages that render React components
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const InertiaAuthController = () => import('#controllers/inertia/auth_controller')
const InertiaDashboardController = () => import('#controllers/inertia/dashboard_controller')
const InertiaUsersController = () => import('#controllers/inertia/users_controller')
const InertiaFilesController = () => import('#controllers/inertia/files_controller')

// Public routes
router.get('/login', [InertiaAuthController, 'showLogin']).as('login')
router.get('/register', [InertiaAuthController, 'showRegister']).as('register')

// Root route redirects to dashboard if authenticated, otherwise to login
router
  .get('/', async ({ auth, response, inertia }) => {
    try {
      await auth.use('jwt').authenticate()
      return response.redirect('/dashboard')
    } catch {
      return inertia.render('home')
    }
  })
  .as('home')

// Authenticated routes
router
  .group(() => {
    // Dashboard
    router.get('/dashboard', [InertiaDashboardController, 'index']).as('dashboard')

    // Users - with permission check
    router
      .get('/users', [InertiaUsersController, 'index'])
      .as('users.index')
      .use(
        middleware.permission({
          permissions: 'users.list',
        })
      )

    // Files - with permission check
    router
      .get('/files', [InertiaFilesController, 'index'])
      .as('files.index')
      .use(
        middleware.permission({
          permissions: 'files.list',
        })
      )

    // Logout
    router
      .post('/logout', async ({ response }) => {
        // JWT is stateless, so we just redirect
        // The client should remove the token
        return response.redirect('/')
      })
      .as('logout')
  })
  .middleware([middleware.auth({ guards: ['jwt'] })])
