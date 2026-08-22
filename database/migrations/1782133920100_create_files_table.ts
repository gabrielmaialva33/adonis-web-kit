import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'files'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('owner_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('tenant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')

      table.string('client_name').notNullable()
      table.string('file_name').notNullable().unique()
      table.integer('file_size').unsigned().notNullable()
      table.string('file_type').notNullable()
      table.string('file_category').notNullable()
      table.string('url').notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['owner_id'], 'idx_files_owner_id')
      table.index(['tenant_id', 'created_at'], 'idx_files_tenant_created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
