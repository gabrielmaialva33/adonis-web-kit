import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'

import RefreshToken from '#modules/auth/models/refresh_token'
import User from '#modules/users/models/user'

test.group('Delete own account', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should anonymize the user and revoke every active credential', async ({
    client,
    assert,
  }) => {
    const user = await User.create({
      full_name: 'Delete Me',
      email: 'delete-me@example.com',
      username: 'delete-me',
      password: 'password123',
    })

    const signIn = await client.post('/api/v1/sessions/sign-in').json({
      uid: user.email,
      password: 'password123',
    })
    signIn.assertStatus(200)
    const accessToken = signIn.body().auth.access_token as string
    const refreshToken = signIn.body().auth.refresh_token as string

    const response = await client.delete('/api/v1/me').bearerToken(accessToken).json({
      current_password: 'password123',
      confirmation: 'DELETE',
    })

    response.assertStatus(204)

    assert.isNull(await User.find(user.id))
    const rawUser = await db.from('users').where('id', user.id).firstOrFail()
    assert.isTrue(rawUser.is_deleted)
    assert.equal(rawUser.full_name, 'Deleted User')
    assert.match(rawUser.email, /^deleted\+/)
    assert.notEqual(rawUser.email, 'delete-me@example.com')
    assert.match(rawUser.username, /^deleted_/)

    const storedRefresh = await RefreshToken.query().where('user_id', user.id).firstOrFail()
    assert.isNotNull(storedRefresh.revoked_at)

    const access = await client.get('/api/v1/me').bearerToken(accessToken)
    access.assertStatus(401)

    const refresh = await client.post('/api/v1/sessions/refresh').json({
      refresh_token: refreshToken,
    })
    refresh.assertStatus(401)
  })

  test('should reject an invalid password or confirmation without deleting the account', async ({
    client,
    assert,
  }) => {
    const user = await User.create({
      full_name: 'Keep Me',
      email: 'keep-me@example.com',
      username: 'keep-me',
      password: 'password123',
    })

    for (const payload of [
      { current_password: 'wrong-password', confirmation: 'DELETE' },
      { current_password: 'password123', confirmation: 'KEEP' },
    ]) {
      const response = await client.delete('/api/v1/me').loginAs(user).json(payload)
      response.assertStatus(400)
    }

    const persisted = await User.find(user.id)
    assert.isNotNull(persisted)
    assert.equal(persisted!.email, user.email)
  })
})
