import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

import User from '#modules/users/models/user'

test.group('Profile validation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function createProfileUser() {
    return User.create({
      full_name: 'Profile Owner',
      email: 'profile-owner@example.com',
      username: 'profile-owner',
      password: 'password123',
    })
  }

  test('rejects a normalized username collision with JSON validation errors', async ({
    client,
    assert,
  }) => {
    const user = await createProfileUser()
    await User.create({
      full_name: 'Existing User',
      email: 'existing-profile@example.com',
      username: 'existingbob',
      password: 'password123',
    })

    const response = await client
      .post('/settings/profile')
      .withCsrfToken()
      .loginAs(user)
      .header('Accept', 'application/json')
      .redirects(0)
      .json({ full_name: 'Changed Name', username: '  EXISTINGBOB  ' })

    response.assertStatus(422)
    response.assertBodyContains({ errors: [{ field: 'username', rule: 'database.unique' }] })
    await user.refresh()
    assert.equal(user.username, 'profile-owner')
    assert.equal(user.full_name, 'Profile Owner')
  })

  for (const { field, payload, rule } of [
    {
      field: 'username',
      payload: { full_name: 'Changed Name', username: 'u'.repeat(81) },
      rule: 'maxLength',
    },
    {
      field: 'full_name',
      payload: { full_name: 'n'.repeat(256), username: 'changed-owner' },
      rule: 'maxLength',
    },
    {
      field: 'username',
      payload: { full_name: 'Changed Name', username: '  ab  ' },
      rule: 'minLength',
    },
  ]) {
    test(`rejects invalid ${field} with ${rule} before persistence`, async ({ client, assert }) => {
      const user = await createProfileUser()
      const response = await client
        .post('/settings/profile')
        .withCsrfToken()
        .loginAs(user)
        .header('Accept', 'application/json')
        .redirects(0)
        .json(payload)

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field, rule }] })
      await user.refresh()
      assert.equal(user.username, 'profile-owner')
      assert.equal(user.full_name, 'Profile Owner')
    })
  }

  test('accepts the current username with changed case and surrounding whitespace', async ({
    client,
    assert,
  }) => {
    const user = await createProfileUser()
    const response = await client
      .post('/settings/profile')
      .withCsrfToken()
      .loginAs(user)
      .redirects(0)
      .json({ full_name: '  Updated Owner  ', username: '  PROFILE-OWNER  ' })

    response.assertStatus(302)
    response.assertHeader('location', '/settings')
    response.assertFlashMessage('success', 'Profile updated successfully.')
    await user.refresh()
    assert.equal(user.username, 'profile-owner')
    assert.equal(user.full_name, 'Updated Owner')
  })

  test('accepts and normalizes values at the database size limits', async ({ client, assert }) => {
    const user = await createProfileUser()
    const response = await client
      .post('/settings/profile')
      .withCsrfToken()
      .loginAs(user)
      .redirects(0)
      .json({ full_name: `  ${'n'.repeat(255)}  `, username: `  ${'U'.repeat(80)}  ` })

    response.assertStatus(302)
    response.assertHeader('location', '/settings')
    await user.refresh()
    assert.equal(user.username, 'u'.repeat(80))
    assert.equal(user.full_name, 'n'.repeat(255))
  })

  test('redirects Inertia validation failures back with field errors', async ({
    client,
    assert,
  }) => {
    const user = await createProfileUser()
    await User.create({
      full_name: 'Existing User',
      email: 'existing-profile@example.com',
      username: 'existingbob',
      password: 'password123',
    })

    const response = await client
      .post('/settings/profile')
      .withCsrfToken()
      .loginAs(user)
      .header('Accept', 'text/html, application/xhtml+xml')
      .header('X-Inertia', 'true')
      .header('Referer', '/settings')
      .redirects(0)
      .json({ full_name: 'Changed Name', username: ' EXISTINGBOB ' })

    response.assertStatus(302)
    response.assertHeader('location', '/settings')
    const errors = response.flashMessages().errors
    if (!Array.isArray(errors)) {
      throw new Error('Expected flashed validation errors to be an array')
    }
    assert.includeDeepMembers(errors, [
      {
        field: 'username',
        rule: 'database.unique',
        message: 'The username has already been taken',
      },
    ])
    await user.refresh()
    assert.equal(user.username, 'profile-owner')
  })
})
