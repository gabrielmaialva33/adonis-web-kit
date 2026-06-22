import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

import UsersRepository from '#modules/users/repositories/users_repository'
import RolesRepository from '#modules/roles/repositories/roles_repository'

import JwtAuthTokensService from '#modules/auth/services/jwt_auth_tokens_service'
import AuthEventService from '#modules/auth/services/auth_event_service'

import NotFoundException from '#exceptions/not_found_exception'

type SignInRequest = {
  uid: string
  password: string
}

@inject()
export default class AdminSignInService {
  constructor(
    private usersRepository: UsersRepository,
    private rolesRepository: RolesRepository,
    private jwtAuthTokensService: JwtAuthTokensService
  ) {}

  async run({ uid, password }: SignInRequest) {
    const ctx = HttpContext.getOrFail()
    const { i18n } = ctx

    // Emit login attempted event
    AuthEventService.emitLoginAttempted(uid, ctx)

    try {
      const user = await this.usersRepository.verifyCredentials(uid, password)

      await user.load('roles')

      const isAdmin = this.rolesRepository.isAdmin(user.roles)

      if (!isAdmin) {
        // Emit login failed event for non-admin attempting admin login
        AuthEventService.emitLoginFailed(uid, 'Not an admin user', ctx)
        throw new NotFoundException(i18n.t('errors.permission_denied'))
      }

      // Active tenant = the user's first tenant (N:N via user_tenants).
      const tenant = await user.related('tenants').query().first()

      const auth = await this.jwtAuthTokensService.run({ userId: user.id, tenantId: tenant?.id })
      const userJson = user.toJSON()

      // Emit login succeeded event
      AuthEventService.emitLoginSucceeded(user, 'password', true, ctx)

      return { ...userJson, auth }
    } catch (error) {
      // Emit login failed event if not already emitted
      const reason = error instanceof Error ? error.message : 'Invalid credentials'
      if (reason !== i18n.t('errors.permission_denied')) {
        AuthEventService.emitLoginFailed(uid, reason || 'Invalid credentials', ctx)
      }
      throw error
    }
  }
}
