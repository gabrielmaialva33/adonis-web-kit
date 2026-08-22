import factory from '@adonisjs/lucid/factories'
import type { FactoryContextContract } from '@adonisjs/lucid/types/factory'
import hash from '@adonisjs/core/services/hash'

import IRole from '#modules/roles/interfaces/role_interface'
import Role from '#modules/roles/models/role'
import User from '#modules/users/models/user'

export const UserFactory = factory
  .define(User, async ({ faker }: FactoryContextContract) => ({
    full_name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: await hash.make(faker.internet.password()),
  }))
  .after('create', async (_builder, user, context) => {
    const query = Role.query()
    if (context.$trx) {
      query.useTransaction(context.$trx)
    }

    const defaultRole = await query.where('slug', IRole.Slugs.USER).first()
    if (defaultRole) {
      await user.related('roles').attach([defaultRole.id], context.$trx)
    }
  })
  .build()
