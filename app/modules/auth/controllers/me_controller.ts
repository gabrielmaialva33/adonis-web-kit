import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import GetUserService from '#modules/users/services/get_user_service'
import GetUserPermissionsService from '#modules/users/services/get_user_permissions_service'
import GetUserRolesService from '#modules/users/services/get_user_roles_service'
import DeleteOwnAccountService from '#modules/users/services/delete_own_account_service'
import { deleteOwnAccountValidator } from '#modules/users/validators/account_validator'

@inject()
export default class MeController {
  constructor(private deleteOwnAccountService: DeleteOwnAccountService) {}
  /**
   * Get current user profile
   */
  async profile({ auth, response }: HttpContext) {
    const user = auth.user!
    const service = await app.container.make(GetUserService)

    const userWithRoles = await service.run(user.id)
    return response.json(userWithRoles)
  }

  /**
   * Get current user permissions
   */
  async permissions({ auth, response }: HttpContext) {
    const user = auth.user!
    const service = await app.container.make(GetUserPermissionsService)

    const permissions = await service.run(user.id)
    return response.json(permissions)
  }

  /**
   * Get current user roles
   */
  async roles({ auth, response }: HttpContext) {
    const user = auth.user!
    const service = await app.container.make(GetUserRolesService)

    const roles = await service.run(user.id)
    return response.json(roles)
  }

  async delete({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { current_password: currentPassword, confirmation } =
      await request.validateUsing(deleteOwnAccountValidator)

    await this.deleteOwnAccountService.run(user.id, { currentPassword, confirmation })

    return response.noContent()
  }
}
