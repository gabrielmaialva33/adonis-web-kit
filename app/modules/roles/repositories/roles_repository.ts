import LucidRepository from '#shared/lucid/lucid_repository'
import IRole from '#modules/roles/interfaces/role_interface'
import Role from '#modules/roles/models/role'
import { type TransactionClientContract } from '@adonisjs/lucid/types/database'

export default class RolesRepository
  extends LucidRepository<typeof Role>
  implements IRole.Repository
{
  constructor() {
    super(Role)
  }

  isAdmin(roles: Role[]): boolean {
    const { ROOT, ADMIN } = IRole.Slugs

    return roles.some((role) => [ROOT, ADMIN].includes(role.slug))
  }

  /**
   * Find a role by slug.
   */
  async findBySlug(slug: string): Promise<Role | null> {
    return this.model.query().where('slug', slug).first()
  }

  /**
   * Find a role by slug with its permissions preloaded.
   */
  async findBySlugWithPermissions(slug: string): Promise<Role | null> {
    return this.model.query().where('slug', slug).preload('permissions').first()
  }

  /**
   * Replace the role permissions with the given ids (sync removes old and adds
   * new). Runs inside the provided transaction when present.
   */
  async syncPermissions(
    role: Role,
    permissionIds: number[],
    trx?: TransactionClientContract
  ): Promise<void> {
    await role.related('permissions').sync(permissionIds, undefined, trx)
  }

  /**
   * Attach permissions to the role without removing existing ones.
   */
  async attachPermissions(
    role: Role,
    permissionIds: number[],
    trx?: TransactionClientContract
  ): Promise<void> {
    await role.related('permissions').sync(permissionIds, false, trx)
  }

  /**
   * Detach the given permissions from the role.
   */
  async detachPermissions(
    role: Role,
    permissionIds: number[],
    trx?: TransactionClientContract
  ): Promise<void> {
    await role.related('permissions').detach(permissionIds, trx)
  }
}
