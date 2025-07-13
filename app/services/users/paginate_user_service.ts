import { inject } from '@adonisjs/core'
import UsersRepository from '#repositories/users_repository'
import { PaginateOptions } from '#shared/lucid/lucid_repository_interface'
import User from '#models/user'

interface PaginateUsersOptions extends PaginateOptions<typeof User> {
  search?: string
}

@inject()
export default class PaginateUserService {
  constructor(private userRepository: UsersRepository) {}

  async run(options: PaginateUsersOptions) {
    const { search, ...paginateOptions } = options

    if (search) {
      paginateOptions.modifyQuery = (query) => {
        query.where((builder) => {
          builder.where('full_name', 'like', `%${search}%`).orWhere('email', 'like', `%${search}%`)
        })
      }
    }

    return this.userRepository.paginate(paginateOptions)
  }
}
