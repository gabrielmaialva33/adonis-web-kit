import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

import NotFoundException from '#exceptions/not_found_exception'
import PermissionCacheService from '#modules/permissions/services/permission_cache_service'
import type IUser from '#modules/users/interfaces/user_interface'
import User from '#modules/users/models/user'
import UsersRepository from '#modules/users/repositories/users_repository'

interface UserPermissionData {
  permission_id: number
  granted?: boolean
  expires_at?: string | null
}

@inject()
export default class SyncUserPermissionsService {
  constructor(
    private usersRepository: UsersRepository,
    private permissionCacheService: PermissionCacheService
  ) {}

  async handle(userId: number, permissions: UserPermissionData[]): Promise<void> {
    const user = await this.findUserOrFail(userId)
    const syncData: IUser.PermissionPivotMap = {}

    for (const permission of permissions) {
      syncData[permission.permission_id] = {
        granted: permission.granted ?? true,
        expires_at: permission.expires_at
          ? this.parseExpiration(permission.expires_at).toSQL()
          : null,
      }
    }

    await this.usersRepository.syncPermissions(user, syncData)
    await this.permissionCacheService.invalidateUserCache(userId)
  }

  async attachPermission(
    userId: number,
    permissionId: number,
    granted: boolean = true,
    expiresAt?: string | null
  ): Promise<void> {
    const user = await this.findUserOrFail(userId)
    const pivotData: IUser.PermissionPivotData = {
      granted,
      expires_at: expiresAt ? this.parseExpiration(expiresAt).toSQL() : null,
    }

    const existing = await this.usersRepository.findPermissionPivot(user, permissionId)
    if (existing) {
      await this.usersRepository.updatePermissionPivot(user, permissionId, pivotData)
    } else {
      await this.usersRepository.attachPermission(user, permissionId, pivotData)
    }

    await this.permissionCacheService.invalidateUserCache(userId)
  }

  async revokePermission(userId: number, permissionId: number): Promise<void> {
    const user = await this.findUserOrFail(userId)
    await this.usersRepository.detachPermissions(user, [permissionId])
    await this.permissionCacheService.invalidateUserCache(userId)
  }

  private async findUserOrFail(userId: number): Promise<User> {
    const user = await this.usersRepository.findBy('id', userId)
    if (user) {
      return user
    }

    const { i18n } = HttpContext.getOrFail()
    throw new NotFoundException(
      i18n.t('errors.not_found', {
        resource: i18n.t('models.user'),
      })
    )
  }

  private parseExpiration(value: string): DateTime {
    const expiresAt = DateTime.fromISO(value)
    if (!expiresAt.isValid) {
      throw new TypeError('expires_at must be a valid ISO date')
    }
    return expiresAt
  }
}
