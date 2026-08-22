import { inject } from '@adonisjs/core'
import UsersRepository from '#modules/users/repositories/users_repository'
import IUser from '#modules/users/interfaces/user_interface'
import User from '#modules/users/models/user'

@inject()
export default class EditUserService {
  constructor(private userRepository: UsersRepository) {}

  async run(userId: number, payload: IUser.EditPayload): Promise<User | null> {
    return this.userRepository.update('id', userId, payload)
  }
}
