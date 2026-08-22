import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import jwt from 'jsonwebtoken'

import User from '#modules/users/models/user'
import Role from '#modules/roles/models/role'

import PermissionService from '#modules/permissions/services/permission_service'
import IRole from '#modules/roles/interfaces/role_interface'
import env from '#start/env'

test.group('Sessions sign up', (group) => {
  group.each.setup(() => {
    mail.restore()
    mail.fake()
    return testUtils.db().withGlobalTransaction()
  })

  group.each.teardown(() => {
    mail.restore()
  })

  test('should create a new user with valid data', async ({ client, assert }) => {
    const userData = {
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      username: 'janedoe',
      password: 'password123',
      password_confirmation: 'password123',
    }

    const response = await client.post('/api/v1/sessions/sign-up').json(userData)

    response.assertStatus(201)
    response.assertBodyContains({
      auth: {
        access_token: response.body().auth?.access_token,
        refresh_token: response.body().auth?.refresh_token,
      },
      email: userData.email,
      username: userData.username,
      full_name: userData.full_name,
      email_verification_sent: true,
    })

    assert.isDefined(response.body().auth?.access_token)
    assert.isDefined(response.body().auth?.refresh_token)

    const user = await User.findBy('email', userData.email)
    assert.isNotNull(user)

    const workspaces = await user!.related('tenants').query()
    assert.lengthOf(workspaces, 1)
    assert.equal(workspaces[0].$extras.pivot_role, 'owner')

    const payload = jwt.verify(
      response.body().auth.access_token,
      env.get('ACCESS_TOKEN_SECRET', env.get('APP_KEY'))
    ) as { tenantId?: number }
    assert.equal(payload.tenantId, workspaces[0].id)
  })

  test('should keep a persisted registration successful when email delivery fails', async ({
    client,
    assert,
    cleanup,
  }) => {
    const mutableMail = mail as unknown as {
      send: typeof mail.send
    }
    const originalSend = mutableMail.send
    mutableMail.send = (() => Promise.reject(new Error('SMTP unavailable'))) as typeof mail.send
    cleanup(() => {
      mutableMail.send = originalSend
    })

    const response = await client.post('/api/v1/sessions/sign-up').json({
      full_name: 'Delivery Failure',
      email: 'delivery-failure@example.com',
      username: 'delivery-failure',
      password: 'password123',
      password_confirmation: 'password123',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      email: 'delivery-failure@example.com',
      email_verification_sent: false,
    })
    assert.isNotNull(await User.findBy('email', 'delivery-failure@example.com'))
  })

  test('should fail with duplicate email', async ({ client }) => {
    await User.create({
      full_name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'hashedpassword',
    })

    const response = await client
      .post('/api/v1/sessions/sign-up')
      .header('Accept', 'application/json')
      .json({
        full_name: 'Jane Doe',
        email: 'john@example.com',
        username: 'janedoe',
        password: 'password123',
        password_confirmation: 'password123',
      })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        {
          field: 'email',
          rule: 'database.unique',
        },
      ],
    })
  })

  test('should fail with duplicate username', async ({ client }) => {
    await User.create({
      full_name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      password: 'hashedpassword',
    })

    const response = await client
      .post('/api/v1/sessions/sign-up')
      .header('Accept', 'application/json')
      .json({
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        username: 'johndoe',
        password: 'password123',
        password_confirmation: 'password123',
      })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        {
          field: 'username',
          rule: 'database.unique',
        },
      ],
    })
  })

  test('should validate required fields', async ({ client }) => {
    const response = await client
      .post('/api/v1/sessions/sign-up')
      .header('Accept', 'application/json')
      .json({})

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        {
          field: 'full_name',
          rule: 'required',
          message: 'The full_name field must be defined',
        },
        {
          field: 'email',
          rule: 'required',
          message: 'The email field must be defined',
        },
        {
          field: 'password',
          rule: 'required',
          message: 'The password field must be defined',
        },
      ],
    })
  })

  test('should validate email format', async ({ client }) => {
    const response = await client
      .post('/api/v1/sessions/sign-up')
      .header('Accept', 'application/json')
      .json({
        full_name: 'Jane Doe',
        email: 'invalid-email',
        username: 'janedoe',
        password: 'password123',
        password_confirmation: 'password123',
      })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        {
          field: 'email',
          rule: 'email',
        },
      ],
    })
  })

  test('should validate password minimum length', async ({ client }) => {
    const response = await client
      .post('/api/v1/sessions/sign-up')
      .header('Accept', 'application/json')
      .json({
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        username: 'janedoe',
        password: '12345',
        password_confirmation: '12345',
      })

    response.assertStatus(422)
    response.assertBodyContains({
      errors: [
        {
          field: 'password',
          rule: 'minLength',
        },
      ],
    })
  })

  test('should assign a least-privilege default permission set', async ({ client, assert }) => {
    const response = await client.post('/api/v1/sessions/sign-up').json({
      full_name: 'Least Privilege',
      email: 'least-privilege@example.com',
      username: 'least-privilege',
      password: 'password123',
      password_confirmation: 'password123',
    })

    response.assertStatus(201)
    const user = await User.findByOrFail('email', 'least-privilege@example.com')
    const permissionService = await app.container.make(PermissionService)
    const permissions = await permissionService.getEffectivePermissionNames(user.id)

    assert.includeMembers(permissions, [
      'dashboard.read',
      'files.create',
      'files.read',
      'files.list',
      'files.delete.own',
      'tenants.create',
      'tenants.read',
      'tenants.list',
    ])
    assert.notInclude(permissions, 'users.list')
    assert.notInclude(permissions, 'users.read')
    assert.notInclude(permissions, 'users.update')
    assert.notInclude(permissions, 'users.delete')
    assert.notInclude(permissions, 'roles.list')
    assert.notInclude(permissions, 'permissions.list')
  })

  test('should assign default user role', async ({ client, assert }) => {
    // Create the 'user' role first
    await Role.firstOrCreate(
      { slug: IRole.Slugs.USER },
      {
        name: 'User',
        slug: IRole.Slugs.USER,
        description: 'Regular user role',
      }
    )

    const userData = {
      full_name: 'Jane Doe',
      email: 'janeuser@example.com',
      username: 'janeuser',
      password: 'password123',
      password_confirmation: 'password123',
    }

    const response = await client.post('/api/v1/sessions/sign-up').json(userData)

    response.assertStatus(201)

    const user = await User.findBy('email', userData.email)
    assert.isNotNull(user)

    const userRoles = await db
      .from('user_roles')
      .where('user_id', user!.id)
      .join('roles', 'roles.id', '=', 'user_roles.role_id')
      .select('roles.slug')

    assert.lengthOf(userRoles, 1)
    assert.equal(userRoles[0].slug, 'user')
  })
})
