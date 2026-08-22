import { randomUUID } from 'node:crypto'

import { errors, symbols } from '@adonisjs/auth'
import { type AuthClientResponse, type GuardContract } from '@adonisjs/auth/types'
import type { HttpContext } from '@adonisjs/core/http'
import jwt from 'jsonwebtoken'

import { JWT_COOKIE_NAME } from '#shared/jwt/constants'
import type {
  AccessTokenPayload,
  JwtGuardOptions,
  JwtGuardUser,
  JwtUserProviderContract,
} from '#shared/jwt/types'

export class JwtGuard<
  UserProvider extends JwtUserProviderContract<unknown>,
> implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
  declare [symbols.GUARD_KNOWN_EVENTS]: {}

  driverName: 'jwt' = 'jwt'
  authenticationAttempted = false
  isAuthenticated = false
  user?: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  tokenPayload?: AccessTokenPayload

  #ctx: HttpContext
  #userProvider: UserProvider
  #options: JwtGuardOptions<UserProvider[typeof symbols.PROVIDER_REAL_USER]>

  constructor(
    ctx: HttpContext,
    userProvider: UserProvider,
    options: JwtGuardOptions<UserProvider[typeof symbols.PROVIDER_REAL_USER]>
  ) {
    this.#ctx = ctx
    this.#userProvider = userProvider
    this.#options = options
  }

  /**
   * Creates an access token. Extra claims are intentionally limited to caller
   * supplied application context (for example the active tenant); security
   * claims are always overwritten by the guard.
   */
  async generate(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER],
    extraClaims: Record<string, unknown> = {}
  ) {
    const providerUser = await this.#userProvider.createUserForGuard(user)
    const token = this.#sign(providerUser, extraClaims)

    if (this.#options.useCookies) {
      this.#ctx.response.cookie(this.#options.cookieName ?? JWT_COOKIE_NAME, token, {
        path: this.#options.cookieOptions?.path ?? '/',
        httpOnly: this.#options.cookieOptions?.httpOnly ?? true,
        secure: this.#options.cookieOptions?.secure ?? false,
        sameSite: this.#options.cookieOptions?.sameSite ?? 'lax',
      })
    }

    return {
      type: 'bearer' as const,
      token,
      expiresIn: this.#options.expiresIn,
    }
  }

  clearCookie() {
    this.#ctx.response.clearCookie(this.#options.cookieName ?? JWT_COOKIE_NAME, {
      path: this.#options.cookieOptions?.path ?? '/',
    })
  }

  async authenticate(): Promise<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
    if (this.authenticationAttempted) {
      return this.getUserOrFail()
    }

    this.authenticationAttempted = true
    const token = this.#getToken()

    if (!token) {
      return this.#throwUnauthorized()
    }

    let payload: AccessTokenPayload
    try {
      const verified = jwt.verify(token, this.#options.secret, {
        issuer: this.#options.issuer,
        audience: this.#options.audience,
      })

      if (
        typeof verified === 'string' ||
        verified.token_use !== 'access' ||
        !('userId' in verified) ||
        (typeof verified.userId !== 'string' && typeof verified.userId !== 'number')
      ) {
        return this.#throwUnauthorized()
      }

      payload = verified as unknown as AccessTokenPayload
    } catch {
      return this.#throwUnauthorized()
    }

    const providerUser = await this.#userProvider.findById(payload.userId)
    if (!providerUser) {
      return this.#throwUnauthorized()
    }

    this.tokenPayload = payload
    this.isAuthenticated = true
    this.user = providerUser.getOriginal()

    return this.getUserOrFail()
  }

  async check(): Promise<boolean> {
    try {
      await this.authenticate()
      return true
    } catch {
      return false
    }
  }

  getUserOrFail(): UserProvider[typeof symbols.PROVIDER_REAL_USER] {
    if (!this.user) {
      return this.#throwUnauthorized()
    }

    return this.user
  }

  async authenticateAsClient(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  ): Promise<AuthClientResponse> {
    const providerUser = await this.#userProvider.createUserForGuard(user)
    const token = this.#sign(providerUser)

    return {
      headers: {
        authorization: `Bearer ${token}`,
      },
    }
  }

  #sign(
    providerUser: JwtGuardUser<UserProvider[typeof symbols.PROVIDER_REAL_USER]>,
    extraClaims: Record<string, unknown> = {}
  ) {
    const rawId = providerUser.getId()
    const userId = typeof rawId === 'number' || typeof rawId === 'string' ? rawId : rawId.toString()
    const customContent = this.#options.content?.(providerUser) ?? {}

    return jwt.sign(
      {
        ...customContent,
        ...extraClaims,
        sub: String(userId),
        userId,
        token_use: 'access',
      },
      this.#options.secret,
      {
        expiresIn: this.#options.expiresIn,
        issuer: this.#options.issuer,
        audience: this.#options.audience,
        jwtid: randomUUID(),
      }
    )
  }

  #getToken(): string | undefined {
    const authorization = this.#ctx.request.header('authorization')
    if (authorization) {
      const match = /^Bearer\s+(.+)$/i.exec(authorization.trim())
      if (!match) {
        return undefined
      }
      return match[1]
    }

    if (!this.#options.useCookies) {
      return undefined
    }

    const cookie = this.#ctx.request.cookie(this.#options.cookieName ?? JWT_COOKIE_NAME)
    return typeof cookie === 'string' ? cookie : undefined
  }

  #throwUnauthorized(): never {
    const message = this.#ctx.i18n?.t('errors.unauthorized_access') || 'Unauthorized access'
    throw new errors.E_UNAUTHORIZED_ACCESS(message, {
      guardDriverName: this.driverName,
    })
  }
}
