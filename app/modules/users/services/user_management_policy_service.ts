import { inject } from '@adonisjs/core'
import ForbiddenException from '#exceptions/forbidden_exception'
import NotFoundException from '#exceptions/not_found_exception'
import UsersRepository from '#modules/users/repositories/users_repository'
import IRole from '#modules/roles/interfaces/role_interface'

/** Authorization uses current persisted roles, never client-supplied or cached roles. */
@inject()
export default class UserManagementPolicyService {
  constructor(private usersRepository: UsersRepository) {}

  async assertCanManagePermissions(actorId: number): Promise<void> {
    const actor = await this.usersRepository.findByIdWithRoles(actorId)
    if (!actor?.roles.some((role) => role.slug === IRole.Slugs.ROOT)) {
      throw new ForbiddenException('Only ROOT may change permission assignments')
    }
  }

  async assertCanManage(actorId: number, targetId: number): Promise<void> {
    const actor = await this.usersRepository.findByIdWithRoles(actorId)
    if (!actor) throw new ForbiddenException('An authenticated actor is required')
    const target = await this.usersRepository.findByIdWithRoles(targetId)
    if (!target) throw new NotFoundException('User not found')

    const actorRoles = actor.roles.map((role) => role.slug)
    if (actorRoles.includes(IRole.Slugs.ROOT)) return

    const protectedRoles = target.roles.filter((role) =>
      [IRole.Slugs.ROOT, IRole.Slugs.ADMIN].includes(role.slug)
    )
    for (const role of protectedRoles) {
      if (!actorRoles.some((slug) => IRole.ROLE_HIERARCHY[slug]?.includes(role.slug))) {
        throw new ForbiddenException(
          'Cannot manage an account with an equal or higher privileged role'
        )
      }
    }
  }
}
