import type LucidRepositoryInterface from '#shared/lucid/lucid_repository_interface'
import type { PaginateResult } from '#shared/lucid/lucid_repository_interface'
import type File from '#modules/files/models/file'

namespace IFile {
  export interface Repository extends LucidRepositoryInterface<typeof File> {
    countForTenant(tenantId: number): Promise<number>
    paginateForTenant(
      tenantId: number,
      page: number,
      perPage: number
    ): Promise<PaginateResult<typeof File>>
    findByIdForTenant(fileId: number, tenantId: number): Promise<File | null>
    hasActiveMembership(userId: number, tenantId: number): Promise<boolean>
  }
}

export default IFile
