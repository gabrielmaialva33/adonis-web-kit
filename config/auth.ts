import { defineConfig } from '@adonisjs/auth'
import { tokensGuard, tokensUserProvider } from '@adonisjs/auth/access_tokens'
import type { Authenticators, InferAuthenticators, InferAuthEvents } from '@adonisjs/auth/types'
import { basicAuthGuard, basicAuthUserProvider } from '@adonisjs/auth/basic_auth'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'

import { jwtGuard } from '#shared/jwt/define_config'
import {
  JWT_AUDIENCE,
  JWT_COOKIE_NAME,
  JWT_ISSUER,
  WEB_ACCESS_TOKEN_EXPIRES_IN,
} from '#shared/jwt/constants'
import type { JwtGuardUser } from '#shared/jwt/types'
import env from '#start/env'

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
      secret: env.get('ACCESS_TOKEN_SECRET', env.get('APP_KEY')),
      tokenExpiresIn: WEB_ACCESS_TOKEN_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      useCookies: true,
      cookieName: JWT_COOKIE_NAME,
      provider: sessionUserProvider({
        model: () => import('#modules/users/models/user'),
      }),
      content: <User>(_user: JwtGuardUser<User>) => ({}),
    }),
  },
})

export default authConfig

declare module '@adonisjs/auth/types' {
  export interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}

declare module '@adonisjs/core/types' {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}
