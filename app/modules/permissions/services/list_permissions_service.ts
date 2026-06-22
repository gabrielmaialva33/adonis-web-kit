import { inject } from '@adonisjs/core'

import PermissionRepository from '#modules/permissions/repositories/permission_repository'

@inject()
export default class ListPermissionsService {
  constructor(private permissionRepository: PermissionRepository) {}

  async handle(page: number = 1, perPage: number = 10, resource?: string, action?: string) {
    return this.permissionRepository.paginateFiltered(page, perPage, resource, action)
  }
}
