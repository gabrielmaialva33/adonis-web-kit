import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'

import { attachRoleValidator } from '#modules/roles/validators/roles_validator'

import ListRolesService from '#modules/roles/services/list_roles_service'
import SyncRolesService from '#modules/roles/services/sync_roles_service'

@inject()
export default class RolesController {
  async list({ request, response }: HttpContext) {
    const service = await app.container.make(ListRolesService)
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 10)

    const roles = await service.run({ page, perPage })
    return response.json(roles)
  }

  async attach({ request, response }: HttpContext) {
    try {
      const { user_id: userId, role_ids: roleIds } = await attachRoleValidator.validate(
        request.all()
      )

      // Check if user exists
      const user = await db.from('users').where('id', userId).first()
      if (!user) {
        return response.notFound({ message: 'User not found' })
      }

      // Check if all roles exist
      const roles = await db.from('roles').whereIn('id', roleIds)
      if (roles.length !== roleIds.length) {
        return response.notFound({ message: 'Role not found' })
      }

      const syncRolesService = await app.container.make(SyncRolesService)
      await syncRolesService.run({ userId, roleIds })

      return response.json({
        message: 'Role attached successfully',
      })
    } catch (error) {
      if (error && typeof error === 'object' && 'messages' in error) {
        return response.unprocessableEntity({ errors: error.messages })
      }
      throw error
    }
  }
}
