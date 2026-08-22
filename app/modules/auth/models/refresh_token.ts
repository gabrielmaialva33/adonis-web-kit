import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import User from '#modules/users/models/user'
import Tenant from '#modules/tenants/models/tenant'

export default class RefreshToken extends BaseModel {
  static table = 'auth_refresh_tokens'
  static namingStrategy = new SnakeCaseNamingStrategy()

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare user_id: number

  @column()
  declare tenant_id: number | null

  @column({ serializeAs: null })
  declare token_hash: string

  @column.dateTime()
  declare expires_at: DateTime

  @column.dateTime()
  declare revoked_at: DateTime | null

  @column()
  declare rotated_from_id: number | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime

  @belongsTo(() => User, { foreignKey: 'user_id' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Tenant, { foreignKey: 'tenant_id' })
  declare tenant: BelongsTo<typeof Tenant>
}
