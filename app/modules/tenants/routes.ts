import router from '@adonisjs/core/services/router'

import IPermission from '#modules/permissions/interfaces/permission_interface'
import { middleware } from '#start/kernel'

const TenantsController = () => import('#modules/tenants/controllers/tenants_controller')

router
  .group(() => {
    router
      .post('/', [TenantsController, 'create'])
      .as('tenants.create')
      .use(
        middleware.permission({
          permissions: `${IPermission.Resources.TENANTS}.${IPermission.Actions.CREATE}`,
        })
      )
    router.get('/me', [TenantsController, 'me']).as('tenants.me')
    router.post('/switch', [TenantsController, 'switch']).as('tenants.switch')
  })
  .use(middleware.auth())
  .prefix('/api/v1/tenants')
