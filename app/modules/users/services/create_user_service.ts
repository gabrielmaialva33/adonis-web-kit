import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'

import IRole from '#modules/roles/interfaces/role_interface'
import RolesRepository from '#modules/roles/repositories/roles_repository'
import CreateTenantService from '#modules/tenants/services/create_tenant_service'
import type IUser from '#modules/users/interfaces/user_interface'
import UsersRepository from '#modules/users/repositories/users_repository'

export type CreateUserOptions = {
  createPersonalWorkspace?: boolean
}

@inject()
export default class CreateUserService {
  constructor(
    private usersRepository: UsersRepository,
    private rolesRepository: RolesRepository,
    private createTenantService: CreateTenantService
  ) {}

  async run(payload: IUser.CreatePayload, options: CreateUserOptions = {}) {
    return db.transaction(async (client) => {
      const user = await this.usersRepository.create(payload, { client })
      const defaultRole = await this.rolesRepository.findBy('slug', IRole.Slugs.USER, { client })

      if (defaultRole) {
        await user.related('roles').attach([defaultRole.id], client)
      }

      if (options.createPersonalWorkspace) {
        await this.createTenantService.run(
          user.id,
          {
            name: `${user.full_name}'s Workspace`,
            slug: `workspace-${user.id}`,
          },
          client
        )
      }

      return user
    })
  }
}
