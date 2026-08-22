import { inject } from '@adonisjs/core'

import NotFoundException from '#exceptions/not_found_exception'
import PermissionService from '#modules/permissions/services/permission_service'
import UsersRepository from '#modules/users/repositories/users_repository'

@inject()
export default class CheckUserPermissionService {
  constructor(
    private permissionService: PermissionService,
    private usersRepository: UsersRepository
  ) {}

  async handle(
    userId: number,
    permissionNames: string | string[],
    requireAll: boolean = false
  ): Promise<boolean> {
    await this.ensureUserExists(userId)

    return this.permissionService.checkUserPermission({
      user_id: userId,
      permission: permissionNames,
      requireAll,
    })
  }

  async getUserPermissions(userId: number): Promise<string[]> {
    await this.ensureUserExists(userId)
    return this.permissionService.getEffectivePermissionNames(userId)
  }

  private async ensureUserExists(userId: number): Promise<void> {
    const user = await this.usersRepository.findBy('id', userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
  }
}
