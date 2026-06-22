import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import JwtAuthTokensService, {
  GenerateAuthTokensResponse,
} from '#modules/auth/services/jwt_auth_tokens_service'
import UsersRepository from '#modules/users/repositories/users_repository'
import AuthEventService from '#modules/auth/services/auth_event_service'
import User from '#modules/users/models/user'

type SignInRequest = {
  uid: string
  password: string
  ctx: HttpContext
}

type SignInResponse = User & {
  auth: GenerateAuthTokensResponse
}

@inject()
export default class SignInService {
  constructor(
    private usersRepository: UsersRepository,
    private jwtAuthTokensService: JwtAuthTokensService
  ) {}

  async run({ uid, password, ctx }: SignInRequest): Promise<SignInResponse> {
    // Emit login attempted event
    AuthEventService.emitLoginAttempted(uid, ctx)

    try {
      const user = await this.usersRepository.verifyCredentials(uid, password)
      await user.load('roles')

      const auth = await this.jwtAuthTokensService.run({ userId: user.id })
      const userJson = user.toJSON()

      // Check if the user is admin
      const isAdmin = user.roles.some((role) => role.name === 'ADMIN' || role.name === 'ROOT')

      // Emit login succeeded event
      AuthEventService.emitLoginSucceeded(user, 'password', isAdmin, ctx)

      return { ...userJson, auth } as SignInResponse
    } catch (error) {
      // Emit login failed event
      const reason = error instanceof Error ? error.message : 'Invalid credentials'
      AuthEventService.emitLoginFailed(uid, reason || 'Invalid credentials', ctx)
      throw error
    }
  }
}
