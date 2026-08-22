import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import AuthEventService from '#modules/auth/services/auth_event_service'
import DeleteOwnAccountService from '#modules/users/services/delete_own_account_service'
import { deleteOwnAccountValidator } from '#modules/users/validators/account_validator'
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

  async deleteAccount(ctx: HttpContext) {
    const { auth, request, response, session } = ctx
    const user = auth.getUserOrFail()

    try {
      const { current_password: currentPassword, confirmation } =
        await request.validateUsing(deleteOwnAccountValidator)
      const deleteOwnAccount = await app.container.make(DeleteOwnAccountService)

      await deleteOwnAccount.run(user.id, { currentPassword, confirmation })
      auth.use('jwt').clearCookie()
      AuthEventService.emitLogout(user, ctx)

      return response.redirect().toPath('/')
    } catch (error) {
      if (error && typeof error === 'object' && 'messages' in error) {
        throw error
      }

      session.flash('errors', {
        general: error instanceof Error ? error.message : 'Unable to delete account',
      })
      return response.redirect().back()
    }
  }
}
