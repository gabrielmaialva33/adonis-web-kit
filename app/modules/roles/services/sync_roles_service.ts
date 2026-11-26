import { inject } from '@adonisjs/core'

import ForbiddenException from '#exceptions/forbidden_exception'
import RolesRepository from '#modules/roles/repositories/roles_repository'
import IRole from '#modules/roles/interfaces/role_interface'
import UserManagementPolicyService from '#modules/users/services/user_management_policy_service'
import NotFoundException from '#exceptions/not_found_exception'
import PermissionCacheService from '#modules/permissions/services/permission_cache_service'
import UsersRepository from '#modules/users/repositories/users_repository'

type AttachRolesRequest = {
  actorId: number
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
    private permissionCacheService: PermissionCacheService,
    private userManagementPolicy: UserManagementPolicyService,
    private rolesRepository: RolesRepository
  ) {}

  async run({ actorId, userId, roleIds }: AttachRolesRequest) {
    const actor = await this.usersRepository.findByIdWithRoles(actorId)
    if (!actor) throw new ForbiddenException('An authenticated actor is required')
    const roles = await this.rolesRepository.findByIds(roleIds)
    if (roles.length !== new Set(roleIds).size) throw new NotFoundException('Role not found')
    const actorRoles = actor.roles.map((role) => role.slug)
    if (!actorRoles.includes(IRole.Slugs.ROOT)) {
      if (
        roles.some(
          (role) => !actorRoles.some((slug) => IRole.ROLE_HIERARCHY[slug]?.includes(role.slug))
        )
      ) {
        throw new ForbiddenException('Cannot delegate an equal or higher role')
      }
      await this.userManagementPolicy.assertCanManage(actorId, userId)
    }
    const user = await this.usersRepository.findBy('id', userId)
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    await this.usersRepository.attachRoles(user, roleIds)
    await this.permissionCacheService.invalidateUserCache(userId)
  }
}
