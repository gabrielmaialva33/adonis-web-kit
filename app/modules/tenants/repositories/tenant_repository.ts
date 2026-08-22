import LucidRepository from '#shared/lucid/lucid_repository'
import Tenant from '#modules/tenants/models/tenant'
import type ITenant from '#modules/tenants/interfaces/tenant_interface'

export default class TenantRepository
  extends LucidRepository<typeof Tenant>
  implements ITenant.Repository
{
  constructor() {
    super(Tenant)
  }

  async countActiveForUser(userId: number): Promise<number> {
    const rows = await this.model
      .query()
      .where('is_active', true)
      .whereHas('users', (query) => query.where('users.id', userId))
      .count('* as total')

    return Number(rows[0].$extras.total)
  }
}
