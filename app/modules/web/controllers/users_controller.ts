import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import CreateUserService from '#modules/users/services/create_user_service'
import EditUserService from '#modules/users/services/edit_user_service'
import DeleteUserService from '#modules/users/services/delete_user_service'
import GetUserService from '#modules/users/services/get_user_service'
import PaginateUserService from '#modules/users/services/paginate_user_service'

import { createUserValidator, editUserValidator } from '#modules/users/validators/users_validator'

export default class InertiaUsersController {
  async index({ inertia, request }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 10)
    const search = request.input('search')
    const sortBy = request.input('sort_by', 'created_at')
    const direction = request.input('order', 'desc')

    const paginateUserService = await app.container.make(PaginateUserService)
    const users = await paginateUserService.run({
      page,
      perPage,
      search,
      sortBy,
      direction,
    })

    return inertia.render('users/index', {
      users: users.toJSON(),
      search: search || '',
      sortBy,
      direction,
    })
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('users/create', {})
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createUserValidator)
    const createUserService = await app.container.make(CreateUserService)
    await createUserService.run(payload)

    return response.redirect().toPath('/users')
  }

  async edit({ inertia, params }: HttpContext) {
    const getUserService = await app.container.make(GetUserService)
    const user = await getUserService.run(params.id)

    return inertia.render('users/edit', { user })
  }

  async update({ request, response, params }: HttpContext) {
    const payload = await request.validateUsing(editUserValidator, {
      meta: {
        userId: params.id,
      },
    })
    const editUserService = await app.container.make(EditUserService)
    await editUserService.run(params.id, payload)

    return response.redirect().toPath('/users')
  }

  async destroy({ response, params }: HttpContext) {
    const deleteUserService = await app.container.make(DeleteUserService)
    await deleteUserService.run(params.id)

    return response.redirect().toPath('/users')
  }
}
