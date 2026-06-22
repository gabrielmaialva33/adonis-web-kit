import { inject } from '@adonisjs/core'

import UsersRepository from '#modules/users/repositories/users_repository'
import type User from '#modules/users/models/user'

export type UpdateProfilePayload = {
  full_name: string
  username: string
}

/**
 * Updates the authenticated user's own profile.
 *
 * Scoped by the user id resolved from the session in the controller, so it can
 * never touch another user. Reuses the shared UsersRepository for the write.
 */
@inject()
export default class UpdateProfileService {
  constructor(private usersRepository: UsersRepository) {}

  async run(userId: number, payload: UpdateProfilePayload): Promise<User | null> {
    return this.usersRepository.update('id', userId, payload)
  }
}
