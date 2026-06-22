import { DateTime } from 'luxon'
import { BaseModel, column, scope, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'

/**
 * Base model for tenant-scoped entities WITH soft delete.
 *
 * Adapted from the eduguard gabarito (which used a UUID id + `school_id` in a
 * 1:N model) to this project's N:N tenancy: integer increment `id` and a
 * nullable `tenant_id` foreign key. Membership is resolved via the
 * `user_tenants` pivot, not stored on the user.
 *
 * Provides: tenant_id column, soft-delete `deletedAt`, `notDeleted` /
 * `withTenant(tenantId)` scopes and a `softDelete()` helper.
 */
export default class TenantBaseModel extends BaseModel {
  static namingStrategy = new SnakeCaseNamingStrategy()

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenant_id: number | null

  @column.dateTime()
  declare deletedAt: DateTime | null

  static notDeleted = scope((query) => {
    query.whereNull('deleted_at')
  })

  static withTenant = scope((query, tenantId: number) => {
    query.where('tenant_id', tenantId).whereNull('deleted_at')
  })

  async softDelete() {
    this.deletedAt = DateTime.now()
    await this.save()
  }
}
