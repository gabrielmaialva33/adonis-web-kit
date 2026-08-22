import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name', 255).notNullable().unique()
      table.string('description', 500).nullable()
      table.string('resource', 100).notNullable()
      table.string('action', 50).notNullable()
      table.string('context', 50).notNullable().defaultTo('any')

      table.unique(['resource', 'action', 'context'], 'permissions_resource_action_context_unique')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
