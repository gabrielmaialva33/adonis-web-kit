import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import UpdateProfileService from '#modules/web/services/update_profile_service'
import { updateProfileValidator } from '#modules/web/validators/settings_validator'

export default class InertiaSettingsController {
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    return inertia.render('settings/index', {
      profile: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        username: user.username,
      },
    })
  }

  async updateProfile({ request, response, session, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const payload = await request.validateUsing(updateProfileValidator, {
      meta: { userId: user.id },
    })

    const updateProfile = await app.container.make(UpdateProfileService)
    await updateProfile.run(user.id, payload)

    session.flash('success', 'Profile updated successfully.')

    return response.redirect().toPath('/settings')
  }
}
