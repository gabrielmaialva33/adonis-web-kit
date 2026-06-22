import { defineConfig } from '@adonisjs/auth'
import { tokensGuard, tokensUserProvider } from '@adonisjs/auth/access_tokens'
import type { Authenticators, InferAuthenticators, InferAuthEvents } from '@adonisjs/auth/types'
import { basicAuthGuard, basicAuthUserProvider } from '@adonisjs/auth/basic_auth'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'

import { jwtGuard } from '#shared/jwt/define_config'
import { type JwtGuardUser } from '#shared/jwt/types'

const authConfig = defineConfig({
  default: 'jwt',
  guards: {
    api: tokensGuard({
      provider: tokensUserProvider({
        tokens: 'accessTokens',
        model: () => import('#modules/users/models/user'),
      }),
    }),
    web: sessionGuard({
      useRememberMeTokens: false,
      provider: sessionUserProvider({
        model: () => import('#modules/users/models/user'),
      }),
    }),
    basicAuth: basicAuthGuard({
      provider: basicAuthUserProvider({
        model: () => import('#modules/users/models/user'),
      }),
    }),
    jwt: jwtGuard({
      tokenExpiresIn: '1h',
      useCookies: true,
      provider: sessionUserProvider({
        model: () => import('#modules/users/models/user'),
      }),
      content: <User>(user: JwtGuardUser<User>) => ({ userId: user.getId() }),
    }),
  },
})

export default authConfig

/**
 * Inferring types from the configured auth
 * guards.
 */
declare module '@adonisjs/auth/types' {
  export interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
declare module '@adonisjs/core/types' {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}
