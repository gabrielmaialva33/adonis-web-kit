import { BaseSchema } from '@adonisjs/lucid/schema'

const defaultRoles = [
  {
    name: 'Root',
    slug: 'root',
    description: 'Unrestricted platform owner with every available permission.',
  },
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Platform administrator without unrestricted permission-management access.',
  },
  {
    name: 'Editor',
    slug: 'editor',
    description: 'Content-oriented role that inherits the standard user capabilities.',
  },
  {
    name: 'User',
    slug: 'user',
    description: 'Default authenticated application user.',
  },
  {
    name: 'Guest',
    slug: 'guest',
    description: 'Neutral role for applications that explicitly enable guest capabilities.',
  },
] as const

export default class extends BaseSchema {
  async up() {
    await this.db.table('roles').multiInsert(defaultRoles.map((role) => ({ ...role })))
  }

  async down() {
    await this.db
      .from('roles')
      .whereIn(
        'slug',
        defaultRoles.map((role) => role.slug)
      )
      .delete()
  }
}
