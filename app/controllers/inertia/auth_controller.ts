import type { HttpContext } from '@adonisjs/core/http'

export default class InertiaAuthController {
  async showLogin({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  async showRegister({ inertia }: HttpContext) {
    return inertia.render('auth/register')
  }
}
