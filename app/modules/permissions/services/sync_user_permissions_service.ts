import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import NotFoundException from '#exceptions/not_found_exception'
import UsersRepository from '#modules/users/repositories/users_repository'
import type IUser from '#modules/users/interfaces/user_interface'

interface UserPermissionData {
  permission_id: number
  granted?: boolean
  expires_at?: string | null
}

@inject()
export default class SyncUserPermissionsService {
  constructor(private usersRepository: UsersRepository) {}

  async handle(userId: number, permissions: UserPermissionData[]): Promise<void> {
    const { i18n } = HttpContext.getOrFail()
    const user = await this.usersRepository.findBy('id', userId)
    if (!user) {
      throw new NotFoundException(
        i18n.t('errors.not_found', {
          resource: i18n.t('models.user'),
        })
      )
    }

    // Prepare data for sync
    const syncData: IUser.PermissionPivotMap = {}

    permissions.forEach((perm) => {
      syncData[perm.permission_id] = {
        granted: perm.granted !== undefined ? perm.granted : true,
        expires_at: perm.expires_at ? DateTime.fromISO(perm.expires_at).toSQL() : null,
      }
    })

    // Sync permissions (this removes old permissions and adds new ones)
    await this.usersRepository.syncPermissions(user, syncData)
  }

  async attachPermission(
    userId: number,
    permissionId: number,
    granted: boolean = true,
    expiresAt?: string | null
  ): Promise<void> {
    const { i18n } = HttpContext.getOrFail()
    const user = await this.usersRepository.findBy('id', userId)
    if (!user) {
      throw new NotFoundException(
        i18n.t('errors.not_found', {
          resource: i18n.t('models.user'),
        })
      )
    }

    const pivotData: IUser.PermissionPivotData = {
      granted,
      expires_at: expiresAt ? DateTime.fromISO(expiresAt).toSQL() : null,
    }

    // Attach or update if already exists
    const existing = await this.usersRepository.findPermissionPivot(user, permissionId)

    if (existing) {
      await this.usersRepository.updatePermissionPivot(user, permissionId, pivotData)
    } else {
      await this.usersRepository.attachPermission(user, permissionId, pivotData)
    }
  }

  async revokePermission(userId: number, permissionId: number): Promise<void> {
    const { i18n } = HttpContext.getOrFail()
    const user = await this.usersRepository.findBy('id', userId)
    if (!user) {
      throw new NotFoundException(
        i18n.t('errors.not_found', {
          resource: i18n.t('models.user'),
        })
      )
    }

    await this.usersRepository.detachPermissions(user, [permissionId])
  }
}
