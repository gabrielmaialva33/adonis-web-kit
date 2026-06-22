import LucidRepository from '#shared/lucid/lucid_repository'
import IRole from '#modules/roles/interfaces/role_interface'
import Role from '#modules/roles/models/role'

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
}
