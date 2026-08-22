import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

import AuthEventService from '#modules/auth/services/auth_event_service'
import JwtAuthTokensService, {
  type GenerateAuthTokensResponse,
} from '#modules/auth/services/jwt_auth_tokens_service'
import SendVerificationEmailService from '#modules/auth/services/send_verification_email_service'
import type IUser from '#modules/users/interfaces/user_interface'
import User from '#modules/users/models/user'
import CreateUserService from '#modules/users/services/create_user_service'
import IRole from '#modules/roles/interfaces/role_interface'
import env from '#start/env'

export type SignUpOptions = {
  issueApiTokens?: boolean
}

export type SignUpResult = {
  user: User
  auth?: GenerateAuthTokensResponse
  activeTenantId?: number
  emailVerificationSent: boolean
}

@inject()
export default class SignUpService {
  constructor(
    private createUserService: CreateUserService,
    private jwtAuthTokensService: JwtAuthTokensService,
    private sendVerificationEmailService: SendVerificationEmailService
  ) {}

  async run(payload: IUser.CreatePayload, options: SignUpOptions = {}): Promise<SignUpResult> {
    const ctx = HttpContext.getOrFail()
    const createPersonalWorkspace =
      env.get('REGISTRATION_WORKSPACE_MODE', 'personal') === 'personal'
    const user = await this.createUserService.run(payload, { createPersonalWorkspace })
    await user.load('roles')

    const activeTenant = await user
      .related('tenants')
      .query()
      .where('tenants.is_active', true)
      .orderBy('tenants.id', 'asc')
      .first()

    const emailVerificationSent = await this.sendVerificationEmailService.handle(user)
    AuthEventService.emitUserRegistered(user, 'sign-up', false, ctx)

    const auth =
      options.issueApiTokens === false
        ? undefined
        : await this.jwtAuthTokensService.run({
            userId: user.id,
            tenantId: activeTenant?.id,
          })

    if (auth) {
      const isAdmin = user.roles.some((role) =>
        [IRole.Slugs.ADMIN, IRole.Slugs.ROOT].includes(role.slug)
      )
      AuthEventService.emitLoginSucceeded(user, 'password', isAdmin, ctx)
    }

    return { user, auth, activeTenantId: activeTenant?.id, emailVerificationSent }
  }
}
