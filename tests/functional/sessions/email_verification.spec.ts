import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import { DateTime } from 'luxon'

import EmailVerificationTokenService from '#modules/auth/services/email_verification_token_service'
import VerifyEmailNotification from '#modules/auth/services/verify_email_notification'
import User from '#modules/users/models/user'

test.group('Email verification', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should email a raw token while storing only its HMAC', async ({
    client,
    assert,
    cleanup,
  }) => {
    mail.restore()
    const { mails } = mail.fake()
    cleanup(() => mail.restore())

    const response = await client.post('/api/v1/sessions/sign-up').json({
      full_name: 'Test User',
      email: 'testverify@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    })

    response.assertStatus(201)
    assert.notProperty(response.body(), 'metadata')
    assert.isFalse(response.body().email_verified)
    assert.isNull(response.body().email_verified_at)

    mails.assertSentCount(VerifyEmailNotification, 1)
    const sent = mails.sent()[0] as VerifyEmailNotification
    const rawToken = sent.getVerificationToken()

    const user = await User.findByOrFail('email', 'testverify@example.com')
    assert.isFalse(user.metadata.email_verified)
    assert.lengthOf(user.metadata.email_verification_token_hash!, 64)
    assert.notEqual(user.metadata.email_verification_token_hash, rawToken)
    assert.exists(user.metadata.email_verification_sent_at)
  })

  test('should verify email with the raw token matching the stored HMAC', async ({
    client,
    assert,
  }) => {
    const tokenService = await app.container.make(EmailVerificationTokenService)
    const { token, tokenHash } = tokenService.generate()
    const user = await User.create({
      full_name: 'Verify Test',
      email: 'verifytest@example.com',
      password: 'password123',
      metadata: {
        email_verified: false,
        email_verified_at: null,
        email_verification_sent_at: DateTime.now().toISO(),
        email_verification_token_hash: tokenHash,
      },
    })

    const response = await client.get(`/api/v1/verify-email?token=${token}`)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Email verified successfully',
      email_verified: true,
    })

    await user.refresh()
    assert.isTrue(user.metadata.email_verified)
    assert.isNull(user.metadata.email_verification_token_hash)
    assert.isNull(user.metadata.email_verification_sent_at)
    assert.exists(user.metadata.email_verified_at)
  })

  test('should fail with invalid token', async ({ client }) => {
    const response = await client.get('/api/v1/verify-email?token=invalid-token')

    response.assertStatus(404)
    response.assertBodyContains({ message: 'Invalid verification token' })
  })

  test('should fail if email is already verified', async ({ client }) => {
    const tokenService = await app.container.make(EmailVerificationTokenService)
    const { token, tokenHash } = tokenService.generate()

    await User.create({
      full_name: 'Already Verified',
      email: 'alreadyverified@example.com',
      password: 'password123',
      metadata: {
        email_verified: true,
        email_verification_token_hash: tokenHash,
        email_verified_at: DateTime.now().toISO(),
        email_verification_sent_at: DateTime.now().toISO(),
      },
    })

    const response = await client.get(`/api/v1/verify-email?token=${token}`)

    response.assertStatus(400)
    response.assertBodyContains({ message: 'Email already verified' })
  })

  test('should fail with an expired token', async ({ client }) => {
    const tokenService = await app.container.make(EmailVerificationTokenService)
    const { token, tokenHash } = tokenService.generate()

    await User.create({
      full_name: 'Expired Token',
      email: 'expiredtoken@example.com',
      password: 'password123',
      metadata: {
        email_verified: false,
        email_verification_token_hash: tokenHash,
        email_verification_sent_at: DateTime.now().minus({ days: 2 }).toISO(),
        email_verified_at: null,
      },
    })

    const response = await client.get(`/api/v1/verify-email?token=${token}`)

    response.assertStatus(400)
    response.assertBodyContains({
      message: 'Verification token has expired. Please request a new one.',
    })
  })

  test('should resend verification email and rotate its token', async ({
    client,
    assert,
    cleanup,
  }) => {
    mail.restore()
    const { mails } = mail.fake()
    cleanup(() => mail.restore())

    const tokenService = await app.container.make(EmailVerificationTokenService)
    const previous = tokenService.generate()
    const user = await User.create({
      full_name: 'Resend Test',
      email: 'resendtest@example.com',
      password: 'password123',
      metadata: {
        email_verified: false,
        email_verification_token_hash: previous.tokenHash,
        email_verification_sent_at: DateTime.now().toISO(),
        email_verified_at: null,
      },
    })

    const signInResponse = await client.post('/api/v1/sessions/sign-in').json({
      uid: 'resendtest@example.com',
      password: 'password123',
    })
    signInResponse.assertStatus(200)

    const response = await client
      .post('/api/v1/resend-verification-email')
      .bearerToken(signInResponse.body().auth.access_token)

    response.assertStatus(200)
    response.assertBodyContains({ message: 'Verification email sent successfully' })
    mails.assertSentCount(VerifyEmailNotification, 1)

    const sent = mails.sent()[0] as VerifyEmailNotification
    const rawToken = sent.getVerificationToken()

    await user.refresh()
    assert.notEqual(user.metadata.email_verification_token_hash, previous.tokenHash)
    assert.equal(user.metadata.email_verification_token_hash, tokenService.hash(rawToken))
    assert.notEqual(user.metadata.email_verification_token_hash, rawToken)
    assert.exists(user.metadata.email_verification_sent_at)
  })

  test('should not resend if already verified', async ({ client }) => {
    await User.create({
      full_name: 'Already Verified Resend',
      email: 'verifiedresend@example.com',
      password: 'password123',
      metadata: {
        email_verified: true,
        email_verification_token_hash: null,
        email_verified_at: DateTime.now().toISO(),
        email_verification_sent_at: null,
      },
    })

    const signInResponse = await client.post('/api/v1/sessions/sign-in').json({
      uid: 'verifiedresend@example.com',
      password: 'password123',
    })
    signInResponse.assertStatus(200)

    const response = await client
      .post('/api/v1/resend-verification-email')
      .bearerToken(signInResponse.body().auth.access_token)

    response.assertStatus(400)
    response.assertBodyContains({ message: 'Email already verified' })
  })

  test('should require authentication to resend verification', async ({ client }) => {
    const response = await client.post('/api/v1/resend-verification-email')
    response.assertStatus(401)
  })
})
