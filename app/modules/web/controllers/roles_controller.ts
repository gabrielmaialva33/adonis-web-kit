import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import ListRolesWithPermissionsService from '#modules/web/services/list_roles_with_permissions_service'

export default class InertiaRolesController {
  async index({ inertia }: HttpContext) {
    const listRoles = await app.container.make(ListRolesWithPermissionsService)
    const roles = await listRoles.run()

    return inertia.render('roles/index', { roles })
  }
}
