import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const TenantsController = () => import('#modules/tenants/controllers/tenants_controller')

router
  .group(() => {
    router.get('/me', [TenantsController, 'me']).as('tenants.me')
    router.post('/switch', [TenantsController, 'switch']).as('tenants.switch')
  })
  .use(middleware.auth())
  .prefix('/api/v1/tenants')
