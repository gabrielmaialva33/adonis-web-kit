import type LucidRepositoryInterface from '#shared/lucid/lucid_repository_interface'
import type Tenant from '#modules/tenants/models/tenant'

namespace ITenant {
  export interface Repository extends LucidRepositoryInterface<typeof Tenant> {}
}

export default ITenant
