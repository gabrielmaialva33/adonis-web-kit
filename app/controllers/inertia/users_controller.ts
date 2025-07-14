import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class InertiaUsersController {
  async index({ inertia, request }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 10)

    const users = await User.query().orderBy('created_at', 'desc').paginate(page, perPage)

    return inertia.render('users/index', {
      users: users.serialize(),
    })
  }
}
