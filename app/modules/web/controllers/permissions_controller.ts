import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import ListAllPermissionsService from '#modules/web/services/list_all_permissions_service'

export default class InertiaPermissionsController {
  async index({ inertia }: HttpContext) {
    const listPermissions = await app.container.make(ListAllPermissionsService)
    const permissions = await listPermissions.run()

    return inertia.render('permissions/index', { permissions })
  }
}
