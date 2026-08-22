import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'

import PasswordResetToken from '#modules/auth/models/password_reset_token'
import RefreshToken from '#modules/auth/models/refresh_token'
import PasswordResetNotification from '#modules/auth/services/password_reset_notification'
import User from '#modules/users/models/user'

const account = {
  full_name: 'Password Reset User',
  email: 'password-reset@example.com',
  username: 'password-reset-user',
  password: 'password123',
}

test.group('Password reset', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => mail.restore())

  test('should issue a single-use opaque token and reset the password', async ({
    client,
    assert,
  }) => {
    mail.restore()
    const { mails } = mail.fake()
    const user = await User.create(account)

    const forgot = await client.post('/api/v1/sessions/forgot-password').json({
      email: user.email,
    })
    forgot.assertStatus(202)
    forgot.assertBodyContains({
      message: 'If an account exists for that email, a password reset link has been sent.',
    })

    mails.assertSentCount(PasswordResetNotification, 1)
    const notification = mails.sent()[0] as PasswordResetNotification
    const rawToken = notification.getResetToken()

    const stored = await PasswordResetToken.query().where('user_id', user.id).firstOrFail()
    assert.lengthOf(stored.token_hash, 64)
    assert.notEqual(stored.token_hash, rawToken)
    assert.isNull(stored.consumed_at)

    const reset = await client.post('/api/v1/sessions/reset-password').json({
      token: rawToken,
      password: 'new-password123',
      password_confirmation: 'new-password123',
    })
    reset.assertStatus(200)

    const oldLogin = await client.post('/api/v1/sessions/sign-in').json({
      uid: user.email,
      password: account.password,
    })
    oldLogin.assertStatus(400)

    const newLogin = await client.post('/api/v1/sessions/sign-in').json({
      uid: user.email,
      password: 'new-password123',
    })
    newLogin.assertStatus(200)

    const replay = await client.post('/api/v1/sessions/reset-password').json({
      token: rawToken,
      password: 'another-password123',
      password_confirmation: 'another-password123',
    })
    replay.assertStatus(400)
  })

  test('should revoke active refresh tokens after a successful reset', async ({
    client,
    assert,
  }) => {
    mail.restore()
    const { mails } = mail.fake()
    const user = await User.create({
      ...account,
      email: 'reset-revocation@example.com',
      username: 'reset-revocation',
    })

    const signIn = await client.post('/api/v1/sessions/sign-in').json({
      uid: user.email,
      password: account.password,
    })
    signIn.assertStatus(200)
    const refreshToken = signIn.body().auth.refresh_token as string

    await client.post('/api/v1/sessions/forgot-password').json({ email: user.email })
    const notification = mails.sent()[0] as PasswordResetNotification

    const reset = await client.post('/api/v1/sessions/reset-password').json({
      token: notification.getResetToken(),
      password: 'rotated-password123',
      password_confirmation: 'rotated-password123',
    })
    reset.assertStatus(200)

    const refresh = await client.post('/api/v1/sessions/refresh').json({
      refresh_token: refreshToken,
    })
    refresh.assertStatus(401)

    const storedRefresh = await RefreshToken.query().where('user_id', user.id).firstOrFail()
    assert.isNotNull(storedRefresh.revoked_at)
  })

  test('should invalidate previous reset links when a new one is requested', async ({ client }) => {
    mail.restore()
    const { mails } = mail.fake()
    const user = await User.create({
      ...account,
      email: 'reset-rotation@example.com',
      username: 'reset-rotation',
    })

    await client.post('/api/v1/sessions/forgot-password').json({ email: user.email })
    const first = (mails.sent()[0] as PasswordResetNotification).getResetToken()

    await client.post('/api/v1/sessions/forgot-password').json({ email: user.email })
    const second = (mails.sent()[1] as PasswordResetNotification).getResetToken()

    const stale = await client.post('/api/v1/sessions/reset-password').json({
      token: first,
      password: 'new-password123',
      password_confirmation: 'new-password123',
    })
    stale.assertStatus(400)

    const current = await client.post('/api/v1/sessions/reset-password').json({
      token: second,
      password: 'new-password123',
      password_confirmation: 'new-password123',
    })
    current.assertStatus(200)
  })

  test('should not reveal whether an email exists', async ({ client }) => {
    mail.restore()
    const { mails } = mail.fake()
    const response = await client.post('/api/v1/sessions/forgot-password').json({
      email: 'missing-account@example.com',
    })

    response.assertStatus(202)
    response.assertBodyContains({
      message: 'If an account exists for that email, a password reset link has been sent.',
    })
    mails.assertSentCount(PasswordResetNotification, 0)
  })
})
