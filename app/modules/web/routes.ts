import router from '@adonisjs/core/services/router'

import IPermission from '#modules/permissions/interfaces/permission_interface'
import env from '#start/env'
import { middleware } from '#start/kernel'
import { passwordResetRequestThrottle, passwordResetThrottle } from '#start/limiter'

const InertiaAuthController = () => import('#modules/web/controllers/auth_controller')
const InertiaDashboardController = () => import('#modules/web/controllers/dashboard_controller')
const InertiaUsersController = () => import('#modules/web/controllers/users_controller')
const InertiaFilesController = () => import('#modules/web/controllers/files_controller')
const InertiaTenantController = () => import('#modules/web/controllers/tenant_controller')
const InertiaRolesController = () => import('#modules/web/controllers/roles_controller')
const InertiaPermissionsController = () => import('#modules/web/controllers/permissions_controller')
const InertiaSettingsController = () => import('#modules/web/controllers/settings_controller')

const permission = (resource: IPermission.Resources, action: IPermission.Actions) =>
  `${resource}.${action}`

const demoPagesEnabled = env.get('DEMO_PAGES_ENABLED', env.get('NODE_ENV') === 'development')

router
  .get('/login', [InertiaAuthController, 'showLogin'])
  .as('login')
  .use(middleware.guest({ guards: ['jwt'] }))
router
  .post('/login', [InertiaAuthController, 'login'])
  .as('login.post')
  .use(middleware.guest({ guards: ['jwt'] }))
router
  .get('/register', [InertiaAuthController, 'showRegister'])
  .as('register')
  .use(middleware.guest({ guards: ['jwt'] }))
router
  .post('/register', [InertiaAuthController, 'register'])
  .as('register.post')
  .use(middleware.guest({ guards: ['jwt'] }))
router
  .get('/forgot-password', [InertiaAuthController, 'showForgotPassword'])
  .as('password.forgot')
  .use(middleware.guest({ guards: ['jwt'] }))
router
  .post('/forgot-password', [InertiaAuthController, 'forgotPassword'])
  .as('password.forgot.post')
  .use([middleware.guest({ guards: ['jwt'] }), passwordResetRequestThrottle])
router
  .get('/reset-password', [InertiaAuthController, 'showResetPassword'])
  .as('password.reset')
  .use(middleware.guest({ guards: ['jwt'] }))
router
  .post('/reset-password', [InertiaAuthController, 'resetPassword'])
  .as('password.reset.post')
  .use([middleware.guest({ guards: ['jwt'] }), passwordResetThrottle])

router
  .get('/', async ({ auth, response, inertia }) => {
    try {
      await auth.use('jwt').authenticate()
      return response.redirect('/dashboard')
    } catch {
      return inertia.render('home', {})
    }
  })
  .as('home')

router
  .group(() => {
    router
      .get('/dashboard', [InertiaDashboardController, 'index'])
      .as('dashboard')
      .use([
        middleware.tenant(),
        middleware.permission({
          permissions: permission(IPermission.Resources.DASHBOARD, IPermission.Actions.READ),
        }),
      ])

    if (demoPagesEnabled) {
      router.get('/ui-demo', async ({ inertia }) => inertia.render('ui_demo', {})).as('ui-demo')

      router
        .get('/data-grid-demo', async ({ inertia }) => inertia.render('data_grid_demo', {}))
        .as('data-grid-demo')
    }

    router
      .group(() => {
        router
          .get('/', [InertiaUsersController, 'index'])
          .as('users.index')
          .use(
            middleware.permission({
              permissions: permission(IPermission.Resources.USERS, IPermission.Actions.LIST),
            })
          )

        router
          .get('/create', [InertiaUsersController, 'create'])
          .as('users.create')
          .use(
            middleware.permission({
              permissions: permission(IPermission.Resources.USERS, IPermission.Actions.CREATE),
            })
          )

        router
          .post('/', [InertiaUsersController, 'store'])
          .as('users.store')
          .use(
            middleware.permission({
              permissions: permission(IPermission.Resources.USERS, IPermission.Actions.CREATE),
            })
          )

        router
          .get('/:id/edit', [InertiaUsersController, 'edit'])
          .where('id', /^[0-9]+$/)
          .as('users.edit')
          .use(
            middleware.permission({
              permissions: [
                permission(IPermission.Resources.USERS, IPermission.Actions.READ),
                permission(IPermission.Resources.USERS, IPermission.Actions.UPDATE),
              ],
              requireAll: true,
              resourceIdParam: 'id',
            })
          )

        router
          .put('/:id', [InertiaUsersController, 'update'])
          .where('id', /^[0-9]+$/)
          .as('users.update')
          .use(
            middleware.permission({
              permissions: permission(IPermission.Resources.USERS, IPermission.Actions.UPDATE),
              resourceIdParam: 'id',
            })
          )

        router
          .delete('/:id', [InertiaUsersController, 'destroy'])
          .where('id', /^[0-9]+$/)
          .as('users.destroy')
          .use(
            middleware.permission({
              permissions: permission(IPermission.Resources.USERS, IPermission.Actions.DELETE),
              resourceIdParam: 'id',
            })
          )
      })
      .prefix('/users')

    router
      .get('/files', [InertiaFilesController, 'index'])
      .as('files.index')
      .use([
        middleware.tenant({ required: true }),
        middleware.permission({
          permissions: permission(IPermission.Resources.FILES, IPermission.Actions.LIST),
        }),
      ])

    router
      .delete('/files/:id', [InertiaFilesController, 'destroy'])
      .where('id', /^[0-9]+$/)
      .as('files.destroy')
      .use([
        middleware.tenant({ required: true }),
        middleware.permission({
          permissions: [
            permission(IPermission.Resources.FILES, IPermission.Actions.DELETE),
            `${permission(IPermission.Resources.FILES, IPermission.Actions.DELETE)}.${IPermission.Contexts.OWN}`,
          ],
          resourceIdParam: 'id',
        }),
      ])

    router
      .get('/roles', [InertiaRolesController, 'index'])
      .as('roles.index')
      .use(
        middleware.permission({
          permissions: permission(IPermission.Resources.ROLES, IPermission.Actions.LIST),
        })
      )

    router
      .get('/permissions', [InertiaPermissionsController, 'index'])
      .as('permissions.index')
      .use(
        middleware.permission({
          permissions: permission(IPermission.Resources.PERMISSIONS, IPermission.Actions.LIST),
        })
      )

    router.get('/settings', [InertiaSettingsController, 'index']).as('settings.index')
    router
      .post('/settings/profile', [InertiaSettingsController, 'updateProfile'])
      .as('settings.profile.update')
    router
      .delete('/settings/account', [InertiaSettingsController, 'deleteAccount'])
      .as('settings.account.delete')
    router
      .post('/settings/workspaces', [InertiaTenantController, 'create'])
      .as('settings.workspaces.create')
      .use(
        middleware.permission({
          permissions: permission(IPermission.Resources.TENANTS, IPermission.Actions.CREATE),
        })
      )

    router.post('/tenant/switch', [InertiaTenantController, 'switch']).as('tenant.switch')
    router.post('/logout', [InertiaAuthController, 'logout']).as('logout')
  })
  .middleware([middleware.auth({ guards: ['jwt'] })])
