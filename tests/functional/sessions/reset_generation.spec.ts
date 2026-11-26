import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import PasswordResetTokenService from '#modules/auth/services/password_reset_token_service'
import User from '#modules/users/models/user'
import Role from '#modules/roles/models/role'

const originalPassword = 'original-password123'
const changedPassword = 'admin-replacement-password123'

test.group('Password reset credential generation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function createAccount() {
    return User.create({
      full_name: 'Reset Generation',
      email: 'generation@example.com',
      password: originalPassword,
    })
  }

  for (const route of ['api', 'web'] as const) {
    test(`rejects an old reset link after ${route} administrative password change`, async ({
      client,
      assert,
    }) => {
      const user = await createAccount()
      const root = await User.create({
        full_name: 'Root',
        email: 'generation-root@example.com',
        password: originalPassword,
      })
      const role = await Role.findByOrFail('slug', 'root')
      await root.related('roles').attach([role.id])
      const resets = await app.container.make(PasswordResetTokenService)
      const old = await resets.issue(user.id)
      const update = client
        .put(route === 'api' ? `/api/v1/users/${user.id}` : `/users/${user.id}`)
        .loginAs(root)
        .withCsrfToken()
        .redirects(0)
        .header('Accept', 'application/json')
        .json({ password: changedPassword, password_confirmation: changedPassword })
      const response = await update
      response.assertStatus(route === 'api' ? 200 : 302)
      const reset = await client.post('/api/v1/sessions/reset-password').json({
        token: old.token,
        password: 'attacker-password123',
        password_confirmation: 'attacker-password123',
      })
      reset.assertStatus(400)
      const preserved = await User.verifyCredentials(user.email, changedPassword)
      assert.equal(preserved.id, user.id)
      // A newly issued link for the current generation still works.
      const current = await resets.issue(user.id)
      await resets.consume(current.token, 'newly-authorized-password123')
      const recovered = await User.verifyCredentials(user.email, 'newly-authorized-password123')
      assert.equal(recovered.id, user.id)
    })
  }

  test('rejects an old reset link after any model-based password change', async ({ assert }) => {
    const user = await createAccount()
    const resets = await app.container.make(PasswordResetTokenService)
    const old = await resets.issue(user.id)
    user.password = changedPassword
    await user.save()
    await assert.rejects(
      () => resets.consume(old.token, 'attacker-password123'),
      'Invalid or expired password reset token'
    )
    const preserved = await User.verifyCredentials(user.email, changedPassword)
    assert.equal(preserved.id, user.id)
  })

  test('a non-credential profile edit preserves a current reset link and reset is single-use', async ({
    assert,
  }) => {
    const user = await createAccount()
    const resets = await app.container.make(PasswordResetTokenService)
    const link = await resets.issue(user.id)
    user.full_name = 'Updated profile'
    await user.save()
    await resets.consume(link.token, changedPassword)
    const recovered = await User.verifyCredentials(user.email, changedPassword)
    assert.equal(recovered.id, user.id)
    await assert.rejects(
      () => resets.consume(link.token, originalPassword),
      'Invalid or expired password reset token'
    )
  })
})
