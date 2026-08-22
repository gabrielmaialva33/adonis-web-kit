import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

import NotFoundException from '#exceptions/not_found_exception'
import PermissionCacheService from '#modules/permissions/services/permission_cache_service'
import Role from '#modules/roles/models/role'
import RolesRepository from '#modules/roles/repositories/roles_repository'

@inject()
export default class SyncRolePermissionsService {
  constructor(
    private rolesRepository: RolesRepository,
    private permissionCacheService: PermissionCacheService
  ) {}

  async handle(
    roleId: number,
    permissionIds: number[],
    trx?: TransactionClientContract
  ): Promise<void> {
    const role = await this.findRoleOrFail(roleId, trx)
    await this.rolesRepository.syncPermissions(role, permissionIds, trx)
    await this.invalidateAfterCommitBoundary(roleId, trx)
  }

  async attachPermissions(
    roleId: number,
    permissionIds: number[],
    trx?: TransactionClientContract
  ): Promise<void> {
    const role = await this.findRoleOrFail(roleId, trx)
    await this.rolesRepository.attachPermissions(role, permissionIds, trx)
    await this.invalidateAfterCommitBoundary(roleId, trx)
  }

  async detachPermissions(
    roleId: number,
    permissionIds: number[],
    trx?: TransactionClientContract
  ): Promise<void> {
    const role = await this.findRoleOrFail(roleId, trx)
    await this.rolesRepository.detachPermissions(role, permissionIds, trx)
    await this.invalidateAfterCommitBoundary(roleId, trx)
  }

  private async findRoleOrFail(roleId: number, trx?: TransactionClientContract): Promise<Role> {
    const role = await this.rolesRepository.findBy('id', roleId, { client: trx })
    if (role) {
      return role
    }

    let message = 'Role not found'
    try {
      const { i18n } = HttpContext.getOrFail()
      message = i18n.t('errors.not_found', { resource: i18n.t('models.role') })
    } catch {
      // Migrations and command-line tasks do not have an HTTP context.
    }

    throw new NotFoundException(message)
  }

  private async invalidateAfterCommitBoundary(
    roleId: number,
    trx?: TransactionClientContract
  ): Promise<void> {
    // Migration transactions have not committed yet and should not touch Redis.
    if (trx) {
      return
    }

    await Promise.all([
      this.permissionCacheService.invalidateRoleCache(roleId),
      this.permissionCacheService.invalidateAllUserCaches(),
    ])
  }
}
