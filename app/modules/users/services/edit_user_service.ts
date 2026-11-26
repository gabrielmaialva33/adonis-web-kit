import { inject } from '@adonisjs/core'
import UsersRepository from '#modules/users/repositories/users_repository'
import IUser from '#modules/users/interfaces/user_interface'
import UserManagementPolicyService from '#modules/users/services/user_management_policy_service'
import User from '#modules/users/models/user'

@inject()
export default class EditUserService {
  constructor(
    private userRepository: UsersRepository,
    private policy: UserManagementPolicyService
  ) {}

  async run(userId: number, payload: IUser.EditPayload, actorId: number): Promise<User | null> {
    await this.policy.assertCanManage(actorId, userId)
    return this.userRepository.update('id', userId, payload)
  }
}
