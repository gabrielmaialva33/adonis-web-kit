import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import AuthEventService from '#modules/auth/services/auth_event_service'
import JwtAuthTokensService, {
  type GenerateAuthTokensResponse,
} from '#modules/auth/services/jwt_auth_tokens_service'
import User from '#modules/users/models/user'
import UsersRepository from '#modules/users/repositories/users_repository'
import IRole from '#modules/roles/interfaces/role_interface'

export type SignInRequest = {
  uid: string
  password: string
  ctx: HttpContext
}

export type SignInOptions = {
  issueApiTokens?: boolean
}

export type SignInResult = {
  user: User
  auth?: GenerateAuthTokensResponse
  activeTenantId?: number
}

@inject()
export default class SignInService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtAuthTokensService: JwtAuthTokensService
  ) {}

  async run(
    { uid, password, ctx }: SignInRequest,
    options: SignInOptions = {}
  ): Promise<SignInResult> {
    AuthEventService.emitLoginAttempted(uid, ctx)

    try {
      const user = await this.usersRepository.verifyCredentials(uid, password)
      await user.load('roles')

      const tenant = await user
        .related('tenants')
        .query()
        .where('tenants.is_active', true)
        .orderBy('tenants.id', 'asc')
        .first()

      const auth =
        options.issueApiTokens === false
          ? undefined
          : await this.jwtAuthTokensService.run({ userId: user.id, tenantId: tenant?.id })

      const isAdmin = user.roles.some((role) =>
        [IRole.Slugs.ADMIN, IRole.Slugs.ROOT].includes(role.slug)
      )
      AuthEventService.emitLoginSucceeded(user, 'password', isAdmin, ctx)

      return {
        user,
        auth,
        activeTenantId: tenant?.id,
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Invalid credentials'
      AuthEventService.emitLoginFailed(uid, reason || 'Invalid credentials', ctx)
      throw error
    }
  }
}
