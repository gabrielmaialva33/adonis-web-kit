import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'

import IRole from '#modules/roles/interfaces/role_interface'
import Role from '#modules/roles/models/role'
import User from '#modules/users/models/user'
import { JWT_COOKIE_NAME } from '#shared/jwt/constants'

test.group('Web authentication', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function attachDefaultRole(user: User) {
    const role = await Role.findByOrFail('slug', IRole.Slugs.USER)
    await user.related('roles').attach([role.id])
  }

  test('should register and immediately authenticate the browser session', async ({
    client,
    assert,
    cleanup,
  }) => {
    mail.restore()
    mail.fake()
    cleanup(() => mail.restore())

    const response = await client.post('/register').withCsrfToken().redirects(0).json({
      full_name: 'Web Register',
      email: 'web-register@example.com',
      username: 'web-register',
      password: 'password123',
      password_confirmation: 'password123',
    })

    response.assertStatus(302)
    assert.equal(response.header('location'), '/dashboard')

    const tokenCookie = response.cookie(JWT_COOKIE_NAME)
    assert.exists(tokenCookie)
    assert.isNotEmpty(tokenCookie!.value)
    assert.isTrue(tokenCookie!.httpOnly)
    assert.equal(tokenCookie!.path, '/')

    const user = await User.findByOrFail('email', 'web-register@example.com')
    await user.load('roles')
    assert.include(
      user.roles.map((role) => role.slug),
      IRole.Slugs.USER
    )

    const dashboard = await client.get('/dashboard').cookie(JWT_COOKIE_NAME, tokenCookie!.value)
    dashboard.assertStatus(200)
  })

  test('should set an HTTP-only cookie on login and clear it on logout', async ({
    client,
    assert,
  }) => {
    const user = await User.create({
      full_name: 'Web Login',
      email: 'web-login@example.com',
      username: 'web-login',
      password: 'password123',
    })
    await attachDefaultRole(user)

    const login = await client
      .post('/login')
      .withCsrfToken()
      .redirects(0)
      .json({ uid: user.email, password: 'password123' })

    login.assertStatus(302)
    assert.equal(login.header('location'), '/dashboard')

    const tokenCookie = login.cookie(JWT_COOKIE_NAME)
    assert.exists(tokenCookie)
    assert.isNotEmpty(tokenCookie!.value)
    assert.isTrue(tokenCookie!.httpOnly)

    const logout = await client
      .post('/logout')
      .withCsrfToken()
      .cookie(JWT_COOKIE_NAME, tokenCookie!.value)
      .redirects(0)

    logout.assertStatus(302)
    assert.equal(logout.header('location'), '/')

    const clearedCookie = logout.cookie(JWT_COOKIE_NAME)
    assert.exists(clearedCookie)
    assert.equal(clearedCookie!.value, '')
    assert.equal(clearedCookie!.path, '/')

    const dashboard = await client
      .get('/dashboard')
      .cookie(JWT_COOKIE_NAME, clearedCookie!.value)
      .redirects(0)

    dashboard.assertStatus(401)
  })
})
