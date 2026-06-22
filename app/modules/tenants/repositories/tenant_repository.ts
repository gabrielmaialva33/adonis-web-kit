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
}
