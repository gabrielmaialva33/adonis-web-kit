import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'

import IRole from '#modules/roles/interfaces/role_interface'
import RolesRepository from '#modules/roles/repositories/roles_repository'
import type IUser from '#modules/users/interfaces/user_interface'
import UsersRepository from '#modules/users/repositories/users_repository'

@inject()
export default class CreateUserService {
  constructor(
    private usersRepository: UsersRepository,
    private rolesRepository: RolesRepository
  ) {}

  async run(payload: IUser.CreatePayload) {
    return db.transaction(async (client) => {
      const user = await this.usersRepository.create(payload, { client })
      const defaultRole = await this.rolesRepository.findBy('slug', IRole.Slugs.USER, { client })

      if (defaultRole) {
        await user.related('roles').attach([defaultRole.id], client)
      }

      return user
    })
  }
}
