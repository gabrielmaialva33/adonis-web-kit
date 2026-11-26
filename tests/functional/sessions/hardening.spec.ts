import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import limiter from '@adonisjs/limiter/services/main'
import mail from '@adonisjs/mail/services/main'
import User from '#modules/users/models/user'
import Role from '#modules/roles/models/role'
import Tenant from '#modules/tenants/models/tenant'
import PasswordResetTokenService from '#modules/auth/services/password_reset_token_service'
import PasswordResetNotification from '#modules/auth/services/password_reset_notification'
import { JWT_COOKIE_NAME } from '#shared/jwt/constants'

const password = 'password123'

test.group('Authentication hardening', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(async () => {
    await limiter.clear()
    mail.fake()
  })
  group.each.teardown(() => mail.restore())

  async function account() {
    const user = await User.create({
      full_name: 'Account',
      email: 'hardening@example.com',
      password,
    })
    const role = await Role.findByOrFail('slug', 'user')
    await user.related('roles').attach([role.id])
    const tenant = await Tenant.create({ name: 'Account workspace', slug: 'hardening' })
    await user.related('tenants').attach([tenant.id])
    return { user, tenant }
  }

  test('password reset rejects prior access JWT, cookie and tenant token issuance', async ({
    client,
  }) => {
    const { user, tenant } = await account()
    const signIn = await client.post('/api/v1/sessions/sign-in').json({ uid: user.email, password })
    signIn.assertStatus(200)
    const access = signIn.body().auth.access_token
    const login = await client
      .post('/login')
      .withCsrfToken()
      .redirects(0)
      .json({ uid: user.email, password })
    const cookie = login.cookie(JWT_COOKIE_NAME)!.value
    const service = await app.container.make(PasswordResetTokenService)
    const { token } = await service.issue(user.id)
    await service.consume(token, 'replacement-password')
    const response1 = await client.get('/api/v1/me').bearerToken(access)
    response1.assertStatus(401)
    const response2 = await client.get('/api/v1/me').cookie(JWT_COOKIE_NAME, cookie)
    response2.assertStatus(401)
    const response3 = await client
      .post('/api/v1/tenants/switch')
      .bearerToken(access)
      .json({ tenant_id: tenant.id })
    response3.assertStatus(401)
  })

  test('password changes invalidate previous refresh tokens as well as access tokens', async ({
    client,
  }) => {
    const { user } = await account()
    const login = await client.post('/api/v1/sessions/sign-in').json({ uid: user.email, password })
    login.assertStatus(200)
    user.password = 'changed-by-administrator'
    await user.save()
    const response4 = await client.get('/api/v1/me').bearerToken(login.body().auth.access_token)
    response4.assertStatus(401)
    const response5 = await client
      .post('/api/v1/sessions/refresh')
      .json({ refresh_token: login.body().auth.refresh_token })
    response5.assertStatus(401)
  })

  test('API cookie mutations require CSRF while bearer requests remain usable', async ({
    client,
  }) => {
    const { user } = await account()
    const login = await client
      .post('/login')
      .withCsrfToken()
      .redirects(0)
      .json({ uid: user.email, password })
    const cookie = login.cookie(JWT_COOKIE_NAME)!.value
    const denied = await client
      .post('/api/v1/tenants')
      .header('Accept', 'application/json')
      .cookie(JWT_COOKIE_NAME, cookie)
      .json({ name: 'Forbidden CSRF' })
    denied.assertStatus(403)
    const allowed = await client
      .post('/api/v1/tenants')
      .header('Accept', 'application/json')
      .cookie(JWT_COOKIE_NAME, cookie)
      .withCsrfToken()
      .json({ name: 'Allowed CSRF' })
    allowed.assertStatus(201)
    const response6 = await client
      .post('/api/v1/tenants')
      .loginAs(user)
      .json({ name: 'Bearer workspace' })
    response6.assertStatus(201)
  })

  test('whitespace variants share the authentication attempt budget', async ({ client }) => {
    for (let i = 0; i < 5; i++) {
      const response7 = await client
        .post('/api/v1/sessions/sign-in')
        .json({ uid: `${' '.repeat(i)}nobody@example.com`, password })
      response7.assertStatus(400)
    }
    const response8 = await client
      .post('/api/v1/sessions/sign-in')
      .json({ uid: '     nobody@example.com', password })
    response8.assertStatus(429)
  })

  test('web and API login share the authentication attempt budget', async ({ client }) => {
    for (let i = 0; i < 5; i++) {
      const response9 = await client
        .post('/login')
        .withCsrfToken()
        .redirects(0)
        .json({ uid: 'web-budget@example.com', password })
      response9.assertStatus(302)
    }
    const response10 = await client
      .post('/api/v1/sessions/sign-in')
      .json({ uid: 'web-budget@example.com', password })
    response10.assertStatus(429)
  })

  test('web registration is throttled before expensive account creation', async ({ client }) => {
    for (let i = 0; i < 5; i++) {
      await client
        .post('/register')
        .withCsrfToken()
        .redirects(0)
        .json({ email: 'register-budget@example.com' })
    }
    const response11 = await client
      .post('/register')
      .withCsrfToken()
      .redirects(0)
      .json({ email: 'register-budget@example.com' })
    response11.assertStatus(429)
  })

  test('verification resend has a per-account cooldown', async ({ client }) => {
    const { user } = await account()
    const response12 = await client.post('/api/v1/resend-verification-email').loginAs(user)
    response12.assertStatus(200)
    const response13 = await client.post('/api/v1/resend-verification-email').loginAs(user)
    response13.assertStatus(429)
  })

  test('registration without usernames accepts equal email local parts', async ({
    client,
    assert,
  }) => {
    for (const email of ['same@first.example', 'same@second.example']) {
      const response14 = await client
        .post('/api/v1/sessions/sign-up')
        .header('Accept', 'application/json')
        .json({ full_name: 'Same Name', email, password, password_confirmation: password })
      response14.assertStatus(201)
    }
    const users = await User.query().whereIn('email', ['same@first.example', 'same@second.example'])
    assert.lengthOf(users, 2)
    assert.notEqual(users[0].username, users[1].username)
  })

  test('mixed-case registration can recover password and cannot duplicate canonical email', async ({
    client,
    assert,
  }) => {
    const { mails } = mail.fake()
    const signup = await client
      .post('/api/v1/sessions/sign-up')
      .header('Accept', 'application/json')
      .json({
        full_name: 'Mixed Case',
        email: 'Mixed@Example.com',
        password,
        password_confirmation: password,
      })
    signup.assertStatus(201)
    const user = await User.findOrFail(signup.body().id)
    assert.equal(user.email, 'mixed@example.com')
    const response15 = await client
      .post('/api/v1/sessions/forgot-password')
      .json({ email: 'MIXED@example.com' })
    response15.assertStatus(202)
    mails.assertSentCount(PasswordResetNotification, 1)
    const response16 = await client
      .post('/api/v1/sessions/sign-up')
      .header('Accept', 'application/json')
      .json({
        full_name: 'Duplicate',
        email: 'mixed@example.com',
        password,
        password_confirmation: password,
      })
    response16.assertStatus(422)
  })
})
