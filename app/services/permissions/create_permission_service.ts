import { inject } from '@adonisjs/core'

import PermissionRepository from '#repositories/permission_repository'
import Permission from '#models/permission'
import IPermission from '#interfaces/permission_interface'

@inject()
export default class CreatePermissionService {
  constructor(private permissionRepository: PermissionRepository) {}

  async handle(data: IPermission.PermissionData): Promise<Permission> {
    // Check if a permission with the same resource and action already exists
    const existingPermission = await this.permissionRepository.findByResourceAction(
      data.resource,
      data.action
    )

    if (existingPermission) {
      // Update existing permission
      existingPermission.merge({
        name: data.name || `${data.resource}.${data.action}`,
        description: data.description,
      })
      await existingPermission.save()
      return existingPermission
    }

    // Create new permission
    return await this.permissionRepository.create({
      name: data.name || `${data.resource}.${data.action}`,
      description: data.description,
      resource: data.resource,
      action: data.action,
    })
  }
}
