import { inject } from '@adonisjs/core'

import PermissionRepository from '#modules/permissions/repositories/permission_repository'

export type WebPermission = {
  id: number
  name: string
  resource: string
  action: string
  context: string
  description: string | null
}

/**
 * Inertia (web) read model for the Permissions page.
 *
 * Returns every permission ordered by resource/action so the React page can
 * group them by resource. Read-only path reusing the existing Permission model.
 */
@inject()
export default class ListAllPermissionsService {
  constructor(private permissionRepository: PermissionRepository) {}

  async run(): Promise<WebPermission[]> {
    const permissions = await this.permissionRepository.listOrderedByResource()

    return permissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      context: permission.context,
      description: permission.description,
    }))
  }
}
