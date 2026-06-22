import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#modules/users/models/user'

export default class Tenant extends BaseModel {
  static table = 'tenants'
  static namingStrategy = new SnakeCaseNamingStrategy()

  /**
   * ------------------------------------------------------
   * Columns
   * ------------------------------------------------------
   */
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare is_active: boolean

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  /**
   * ------------------------------------------------------
   * Relationships
   * ------------------------------------------------------
   */
  @manyToMany(() => User, {
    pivotTable: 'user_tenants',
    pivotColumns: ['role'],
    pivotTimestamps: true,
  })
  declare users: ManyToMany<typeof User>
}
