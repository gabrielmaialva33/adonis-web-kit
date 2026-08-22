import type LucidRepositoryInterface from '#shared/lucid/lucid_repository_interface'
import type Tenant from '#modules/tenants/models/tenant'

namespace ITenant {
  export interface Repository extends LucidRepositoryInterface<typeof Tenant> {
    countActiveForUser(userId: number): Promise<number>
  }
}

export default ITenant
