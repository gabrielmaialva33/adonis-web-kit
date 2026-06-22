import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

import RolesRepository from '#modules/roles/repositories/roles_repository'
import NotFoundException from '#exceptions/not_found_exception'
import { TransactionClientContract } from '@adonisjs/lucid/types/database'

@inject()
export default class SyncRolePermissionsService {
  constructor(private rolesRepository: RolesRepository) {}

  async handle(
    roleId: number,
    permissionIds: number[],
    trx?: TransactionClientContract
  ): Promise<void> {
    try {
      const { i18n } = HttpContext.getOrFail()
      const role = await this.rolesRepository.findBy('id', roleId, { client: trx })
      if (!role) {
        throw new NotFoundException(
          i18n.t('errors.not_found', {
            resource: i18n.t('models.role'),
          })
        )
      }

      // Sync permissions (this removes old permissions and adds new ones)
      await this.rolesRepository.syncPermissions(role, permissionIds, trx)
    } catch (error) {
      // If HttpContext is not available (e.g., in migrations), fallback logic
      const role = await this.rolesRepository.findBy('id', roleId, { client: trx })
      if (!role) {
        throw new NotFoundException('Role not found')
      }
      await this.rolesRepository.syncPermissions(role, permissionIds, trx)
    }
  }

  async attachPermissions(
    roleId: number,
    permissionIds: number[],
    trx?: TransactionClientContract
  ): Promise<void> {
    try {
      const { i18n } = HttpContext.getOrFail()
      const role = await this.rolesRepository.findBy('id', roleId, { client: trx })
      if (!role) {
        throw new NotFoundException(
          i18n.t('errors.not_found', {
            resource: i18n.t('models.role'),
          })
        )
      }

      // Attach only adds new permissions without removing existing ones
      await this.rolesRepository.attachPermissions(role, permissionIds, trx)
    } catch (error) {
      // If HttpContext is not available (e.g., in migrations), fallback logic
      const role = await this.rolesRepository.findBy('id', roleId, { client: trx })
      if (!role) {
        throw new NotFoundException('Role not found')
      }
      await this.rolesRepository.attachPermissions(role, permissionIds, trx)
    }
  }

  async detachPermissions(
    roleId: number,
    permissionIds: number[],
    trx?: TransactionClientContract
  ): Promise<void> {
    try {
      const { i18n } = HttpContext.getOrFail()
      const role = await this.rolesRepository.findBy('id', roleId, { client: trx })
      if (!role) {
        throw new NotFoundException(
          i18n.t('errors.not_found', {
            resource: i18n.t('models.role'),
          })
        )
      }

      // Detach removes only the specified permissions
      await this.rolesRepository.detachPermissions(role, permissionIds, trx)
    } catch (error) {
      // If HttpContext is not available (e.g., in migrations), fallback logic
      const role = await this.rolesRepository.findBy('id', roleId, { client: trx })
      if (!role) {
        throw new NotFoundException('Role not found')
      }
      await this.rolesRepository.detachPermissions(role, permissionIds, trx)
    }
  }
}
