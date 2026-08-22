import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_refresh_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('tenant_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('tenants')
        .onDelete('SET NULL')

      table.string('token_hash', 64).notNullable().unique()
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('revoked_at', { useTz: true }).nullable()
      table
        .integer('rotated_from_id')
        .unsigned()
        .nullable()
        .unique('auth_refresh_tokens_rotated_from_id_unique')
        .references('id')
        .inTable(this.tableName)
        .onDelete('SET NULL')

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['user_id', 'expires_at'], 'idx_auth_refresh_tokens_user_expiry')
      table.index(['revoked_at'], 'idx_auth_refresh_tokens_revoked_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
