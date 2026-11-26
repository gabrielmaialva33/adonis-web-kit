import { inject } from '@adonisjs/core'
import Permission from '#modules/permissions/models/permission'
import PermissionInheritanceService from '#modules/permissions/services/permission_inheritance_service'
import UsersRepository from '#modules/users/repositories/users_repository'

/** The same grant/expiry/inheritance rules apply to cold reads and cache warmup. */
@inject()
export default class EffectivePermissionsService {
  constructor(
    private usersRepository: UsersRepository,
    private inheritanceService: PermissionInheritanceService
  ) {}

  async forUser(userId: number): Promise<Permission[]> {
    const user = await this.usersRepository.findByIdWithActivePermissions(userId)
    if (!user) return []
    const permissions = new Map<number, Permission>()
    for (const permission of user.permissions) permissions.set(permission.id, permission)
    for (const role of user.roles) {
      for (const permission of await this.inheritanceService.getEffectivePermissions(role.slug)) {
        // A permanent role grant supersedes an expiring direct grant of the same permission.
        permissions.set(permission.id, permission)
      }
    }
    return [...permissions.values()]
  }
}
