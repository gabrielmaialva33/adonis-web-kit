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

    const modifyQuery = (query: any) => {
      if (search) {
        query.where((builder: any) => {
          builder.where('full_name', 'like', `%${search}%`).orWhere('email', 'like', `%${search}%`)
        })
      }
    }

    paginateOptions.modifyQuery = paginateOptions.modifyQuery
      ? (query: any) => {
          paginateOptions.modifyQuery!(query)
          modifyQuery(query)
        }
      : modifyQuery

    paginateOptions.scopes = (scopes) => scopes.includeRoles()

    return this.userRepository.paginate(paginateOptions)
  }
}
