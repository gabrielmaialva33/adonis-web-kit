import { inject } from '@adonisjs/core'

import NotFoundException from '#exceptions/not_found_exception'
import PermissionCacheService from '#modules/permissions/services/permission_cache_service'
import UsersRepository from '#modules/users/repositories/users_repository'

type AttachRolesRequest = {
  userId: number
  roleIds: number[]
}

/**
 * Attaches roles without replacing the user's existing assignments. The legacy
 * class name is kept to avoid churn in callers, but the endpoint semantics are
 * now truly additive.
 */
@inject()
export default class SyncRolesService {
  constructor(
    private usersRepository: UsersRepository,
    private permissionCacheService: PermissionCacheService
  ) {}

  async run({ userId, roleIds }: AttachRolesRequest) {
    const user = await this.usersRepository.findBy('id', userId)
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    await user.related('roles').sync(roleIds, false)
    await this.permissionCacheService.invalidateUserCache(userId)
  }
}
