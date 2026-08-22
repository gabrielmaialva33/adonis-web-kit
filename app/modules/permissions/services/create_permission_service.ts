import { inject } from '@adonisjs/core'

import Permission from '#modules/permissions/models/permission'
import PermissionRepository from '#modules/permissions/repositories/permission_repository'
import PermissionCacheService from '#modules/permissions/services/permission_cache_service'
import IPermission from '#modules/permissions/interfaces/permission_interface'

@inject()
export default class CreatePermissionService {
  constructor(
    private permissionRepository: PermissionRepository,
    private permissionCacheService: PermissionCacheService
  ) {}

  async handle(data: IPermission.PermissionData): Promise<Permission> {
    const context = data.context ?? IPermission.Contexts.ANY
    const defaultName =
      context === IPermission.Contexts.ANY
        ? `${data.resource}.${data.action}`
        : `${data.resource}.${data.action}.${context}`

    const existingPermission = await this.permissionRepository.findByResourceAction(
      data.resource,
      data.action,
      context
    )

    if (existingPermission) {
      existingPermission.merge({
        name: data.name || defaultName,
        description: data.description,
        context,
      })
      await existingPermission.save()
      await this.permissionCacheService.clearAllCache()
      return existingPermission
    }

    const permission = await this.permissionRepository.create({
      name: data.name || defaultName,
      description: data.description,
      resource: data.resource,
      action: data.action,
      context,
    })
    await this.permissionCacheService.clearAllCache()
    return permission
  }
}
