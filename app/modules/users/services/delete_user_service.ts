import { inject } from '@adonisjs/core'
import UserManagementPolicyService from '#modules/users/services/user_management_policy_service'
import UsersRepository from '#modules/users/repositories/users_repository'

@inject()
export default class DeleteUserService {
  constructor(
    private userRepository: UsersRepository,
    private userManagementPolicy: UserManagementPolicyService
  ) {}

  async run(userId: number, actorId: number): Promise<void> {
    await this.userManagementPolicy.assertCanManage(actorId, userId)
    await this.userRepository.softDelete('id', userId)
  }
}
