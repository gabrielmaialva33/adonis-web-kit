import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import jwt from 'jsonwebtoken'

import RefreshToken from '#modules/auth/models/refresh_token'
import User from '#modules/users/models/user'
import { JWT_AUDIENCE, JWT_ISSUER } from '#shared/jwt/constants'
import env from '#start/env'

test.group('Session refresh tokens', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function signIn(client: ApiClient) {
    const user = await User.create({
      full_name: 'Refresh User',
      email: 'refresh@example.com',
      username: 'refresh-user',
      password: 'password123',
    })

    const response = await client.post('/api/v1/sessions/sign-in').json({
      uid: user.email,
      password: 'password123',
    })
    response.assertStatus(200)

    return {
      user,
      accessToken: response.body().auth.access_token as string,
      refreshToken: response.body().auth.refresh_token as string,
    }
  }

  test('should issue an access JWT and an opaque hashed refresh token', async ({
    client,
    assert,
  }) => {
    const { user, accessToken, refreshToken } = await signIn(client)

    const payload = jwt.verify(accessToken, env.get('ACCESS_TOKEN_SECRET', env.get('APP_KEY')), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as jwt.JwtPayload & { token_use: string; userId: number }

    assert.equal(payload.token_use, 'access')
    assert.equal(payload.userId, user.id)
    assert.isString(payload.jti)
    assert.isNull(jwt.decode(refreshToken))

    const stored = await RefreshToken.query().where('user_id', user.id).firstOrFail()
    assert.lengthOf(stored.token_hash, 64)
    assert.notEqual(stored.token_hash, refreshToken)
    assert.isNull(stored.revoked_at)
  })

  test('should reject an opaque refresh token as bearer authentication', async ({ client }) => {
    const { refreshToken } = await signIn(client)

    const response = await client.get('/api/v1/me').bearerToken(refreshToken)
    response.assertStatus(401)
  })

  test('should rotate refresh tokens and reject replay of the previous token', async ({
    client,
    assert,
  }) => {
    const { user, refreshToken } = await signIn(client)

    const response = await client.post('/api/v1/sessions/refresh').json({
      refresh_token: refreshToken,
    })
    response.assertStatus(200)

    const rotatedAccessToken = response.body().auth.access_token as string
    const rotatedRefreshToken = response.body().auth.refresh_token as string
    assert.notEqual(rotatedRefreshToken, refreshToken)

    const accessResponse = await client.get('/api/v1/me').bearerToken(rotatedAccessToken)
    accessResponse.assertStatus(200)
    assert.equal(accessResponse.body().id, user.id)

    const replay = await client.post('/api/v1/sessions/refresh').json({
      refresh_token: refreshToken,
    })
    replay.assertStatus(401)

    const current = await client.post('/api/v1/sessions/refresh').json({
      refresh_token: rotatedRefreshToken,
    })
    current.assertStatus(200)

    const records = await RefreshToken.query().where('user_id', user.id).orderBy('id', 'asc')
    assert.lengthOf(records, 3)
    assert.isNotNull(records[0].revoked_at)
    assert.isNotNull(records[1].revoked_at)
    assert.isNull(records[2].revoked_at)
    assert.equal(records[1].rotated_from_id, records[0].id)
    assert.equal(records[2].rotated_from_id, records[1].id)
  })

  test('should revoke a refresh token on API logout', async ({ client }) => {
    const { refreshToken } = await signIn(client)

    const logout = await client.post('/api/v1/sessions/logout').json({
      refresh_token: refreshToken,
    })
    logout.assertStatus(204)

    const refresh = await client.post('/api/v1/sessions/refresh').json({
      refresh_token: refreshToken,
    })
    refresh.assertStatus(401)
  })
})
