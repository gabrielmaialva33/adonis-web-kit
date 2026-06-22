import { inject } from '@adonisjs/core'
import { TransactionClientContract } from '@adonisjs/lucid/types/database'

import CreateDefaultPermissionsService from '#modules/permissions/services/create_default_permissions_service'
import SyncRolePermissionsService from '#modules/permissions/services/sync_role_permissions_service'
import RolesRepository from '#modules/roles/repositories/roles_repository'
import PermissionRepository from '#modules/permissions/repositories/permission_repository'

import IRole from '#modules/roles/interfaces/role_interface'

@inject()
export default class AssignDefaultPermissionsService {
  constructor(
    private createDefaultPermissionsService: CreateDefaultPermissionsService,
    private syncRolePermissionsService: SyncRolePermissionsService,
    private rolesRepository: RolesRepository,
    private permissionRepository: PermissionRepository
  ) {}

  async run(trx?: TransactionClientContract): Promise<void> {
    // First, create all default permissions
    await this.createDefaultPermissionsService.run(trx)

    // Then assign permissions to roles
    await this.assignPermissionsToRoles(trx)
  }

  private async assignPermissionsToRoles(trx?: TransactionClientContract): Promise<void> {
    // ROOT - All permissions
    await this.assignRootPermissions(trx)

    // ADMIN - All except permission management
    await this.assignAdminPermissions(trx)

    // USER - Basic permissions
    await this.assignUserPermissions(trx)

    // GUEST - Read only
    await this.assignGuestPermissions(trx)
  }

  private async assignRootPermissions(trx?: TransactionClientContract): Promise<void> {
    const rootRole = await this.rolesRepository.findBy('slug', IRole.Slugs.ROOT, { client: trx })
    if (rootRole) {
      const permissionIds = await this.permissionRepository.findAllIds(trx)
      await this.syncRolePermissionsService.handle(rootRole.id, permissionIds, trx)
    }
  }

  private async assignAdminPermissions(trx?: TransactionClientContract): Promise<void> {
    const adminRole = await this.rolesRepository.findBy('slug', IRole.Slugs.ADMIN, { client: trx })
    if (adminRole) {
      const permissionIds = await this.permissionRepository.findAdminPermissionIds(trx)
      await this.syncRolePermissionsService.handle(adminRole.id, permissionIds, trx)
    }
  }

  private async assignUserPermissions(trx?: TransactionClientContract): Promise<void> {
    const userRole = await this.rolesRepository.findBy('slug', IRole.Slugs.USER, { client: trx })
    if (userRole) {
      const permissionIds = await this.permissionRepository.findUserPermissionIds(trx)
      await this.syncRolePermissionsService.handle(userRole.id, permissionIds, trx)
    }
  }

  private async assignGuestPermissions(trx?: TransactionClientContract): Promise<void> {
    const guestRole = await this.rolesRepository.findBy('slug', IRole.Slugs.GUEST, { client: trx })
    if (guestRole) {
      const permissionIds = await this.permissionRepository.findGuestPermissionIds(trx)
      await this.syncRolePermissionsService.handle(guestRole.id, permissionIds, trx)
    }
  }
}
