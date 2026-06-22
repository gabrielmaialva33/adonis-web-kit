import { inject } from '@adonisjs/core'
import UsersRepository from '#modules/users/repositories/users_repository'
import IUser from '#modules/users/interfaces/user_interface'

@inject()
export default class CreateUserService {
  constructor(private userRepository: UsersRepository) {}

  async run(payload: IUser.CreatePayload) {
    return this.userRepository.create(payload)
  }
}
