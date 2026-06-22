import { inject } from '@adonisjs/core'

import RolesRepository from '#modules/roles/repositories/roles_repository'

export type WebRolePermission = {
  id: number
  name: string
  resource: string
  action: string
  context: string
}

export type WebRole = {
  id: number
  name: string
  slug: string
  description: string | null
  users_count: number
  permissions: WebRolePermission[]
}

/**
 * Inertia (web) read model for the Roles page.
 *
 * Loads every role with its permissions preloaded and a real user count, then
 * maps to a flat, serialisable shape the React page can render directly. Pure
 * read path: it reuses the existing Role model relationships and does not
 * duplicate any business logic from the roles module.
 */
@inject()
export default class ListRolesWithPermissionsService {
  constructor(private rolesRepository: RolesRepository) {}

  async run(): Promise<WebRole[]> {
    const roles = await this.rolesRepository.list({
      modifyQuery: (query) => query.preload('permissions').withCount('users'),
      sortBy: 'name',
      direction: 'asc',
    })

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      users_count: Number(role.$extras.users_count ?? 0),
      permissions: role.permissions.map((permission) => ({
        id: permission.id,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        context: permission.context,
      })),
    }))
  }
}
