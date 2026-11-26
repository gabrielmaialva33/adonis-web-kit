import LucidRepository from '#shared/lucid/lucid_repository'
import File from '#modules/files/models/file'
import Tenant from '#modules/tenants/models/tenant'
import type IFile from '#modules/files/interfaces/file_interface'

export default class FileRepository
  extends LucidRepository<typeof File>
  implements IFile.Repository
{
  constructor() {
    super(File)
  }

  async countForTenant(tenantId: number): Promise<number> {
    const rows = await this.model.query().where('tenant_id', tenantId).count('* as total')
    return Number(rows[0].$extras.total)
  }

  async paginateForTenant(tenantId: number, page: number, perPage: number) {
    return this.model
      .query()
      .where('tenant_id', tenantId)
      .preload('owner')
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)
  }

  async findByIdForTenant(fileId: number, tenantId: number): Promise<File | null> {
    return this.model.query().where('id', fileId).where('tenant_id', tenantId).first()
  }

  async hasActiveMembership(userId: number, tenantId: number): Promise<boolean> {
    const tenant = await Tenant.query()
      .where('id', tenantId)
      .where('is_active', true)
      .whereHas('users', (users) => users.where('users.id', userId))
      .first()
    return tenant !== null
  }
}
