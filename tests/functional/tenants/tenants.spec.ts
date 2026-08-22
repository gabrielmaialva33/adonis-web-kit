import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import jwt from 'jsonwebtoken'

import IRole from '#modules/roles/interfaces/role_interface'
import Role from '#modules/roles/models/role'
import Tenant from '#modules/tenants/models/tenant'
import User from '#modules/users/models/user'
import env from '#start/env'

test.group('Tenants', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('POST / creates an owned workspace and returns tenant-scoped tokens', async ({
    client,
    assert,
  }) => {
    const user = await User.create({
      full_name: 'Workspace Creator',
      email: 'workspace-creator@example.com',
      username: 'workspace-creator',
      password: 'password123',
    })
    const userRole = await Role.findByOrFail('slug', IRole.Slugs.USER)
    await user.related('roles').attach([userRole.id])

    const response = await client
      .post('/api/v1/tenants')
      .json({ name: 'Creator Workspace' })
      .loginAs(user)

    response.assertStatus(201)
    assert.equal(response.body().tenant.name, 'Creator Workspace')
    assert.equal(response.body().tenant.role, 'owner')

    const tenant = await Tenant.findOrFail(response.body().tenant.id)
    const members = await tenant.related('users').query()
    assert.lengthOf(members, 1)
    assert.equal(members[0].id, user.id)
    assert.equal(members[0].$extras.pivot_role, 'owner')

    const payload = jwt.verify(
      response.body().auth.access_token,
      env.get('ACCESS_TOKEN_SECRET', env.get('APP_KEY'))
    ) as { tenantId?: number }
    assert.equal(payload.tenantId, tenant.id)
  })

  test('GET /me lists tenants the user belongs to with pivot role', async ({ client, assert }) => {
    const user = await User.create({
      full_name: 'Owner User',
      email: 'owner@example.com',
      username: 'owner',
      password: 'password123',
    })

    const tenantA = await Tenant.create({ name: 'Alpha', slug: 'alpha', is_active: true })
    const tenantB = await Tenant.create({ name: 'Beta', slug: 'beta', is_active: true })
    await user.related('tenants').attach({
      [tenantA.id]: { role: 'owner' },
      [tenantB.id]: { role: 'member' },
    })

    const response = await client.get('/api/v1/tenants/me').loginAs(user)

    response.assertStatus(200)
    const body = response.body() as { data: Array<{ id: number; slug: string; role: string }> }
    assert.lengthOf(body.data, 2)

    const alpha = body.data.find((t) => t.slug === 'alpha')
    const beta = body.data.find((t) => t.slug === 'beta')
    assert.equal(alpha?.role, 'owner')
    assert.equal(beta?.role, 'member')
  })

  test('POST /switch mints tokens carrying the requested tenant', async ({ client, assert }) => {
    const user = await User.create({
      full_name: 'Switcher',
      email: 'switch@example.com',
      username: 'switcher',
      password: 'password123',
    })

    const tenantA = await Tenant.create({ name: 'Alpha', slug: 'alpha', is_active: true })
    const tenantB = await Tenant.create({ name: 'Beta', slug: 'beta', is_active: true })
    await user.related('tenants').attach({
      [tenantA.id]: { role: 'owner' },
      [tenantB.id]: { role: 'member' },
    })

    const response = await client
      .post('/api/v1/tenants/switch')
      .json({ tenant_id: tenantB.id })
      .loginAs(user)

    response.assertStatus(200)
    const body = response.body() as {
      tenant: { id: number; role: string }
      auth: { access_token: string; refresh_token: string }
    }
    assert.equal(body.tenant.id, tenantB.id)
    assert.equal(body.tenant.role, 'member')

    const payload = jwt.verify(
      body.auth.access_token,
      env.get('ACCESS_TOKEN_SECRET', env.get('APP_KEY'))
    ) as { tenantId?: number }
    assert.equal(payload.tenantId, tenantB.id)
  })

  test('POST /switch rejects a tenant the user does not belong to', async ({ client }) => {
    const user = await User.create({
      full_name: 'No Access',
      email: 'noaccess@example.com',
      username: 'noaccess',
      password: 'password123',
    })

    const foreign = await Tenant.create({ name: 'Foreign', slug: 'foreign', is_active: true })

    const response = await client
      .post('/api/v1/tenants/switch')
      .header('Accept', 'application/json')
      .json({ tenant_id: foreign.id })
      .loginAs(user)

    response.assertStatus(403)
  })

  test('POST /switch rejects an inactive tenant even when the user is a member', async ({
    client,
  }) => {
    const user = await User.create({
      full_name: 'Inactive Member',
      email: 'inactive-member@example.com',
      username: 'inactive-member',
      password: 'password123',
    })
    const inactive = await Tenant.create({
      name: 'Inactive',
      slug: 'inactive-switch',
      is_active: false,
    })
    await user.related('tenants').attach({ [inactive.id]: { role: 'owner' } })

    const response = await client
      .post('/api/v1/tenants/switch')
      .json({ tenant_id: inactive.id })
      .loginAs(user)

    response.assertStatus(403)
  })

  test('POST /switch validates tenant_id as a positive integer', async ({ client }) => {
    const user = await User.create({
      full_name: 'Invalid Switch',
      email: 'invalid-switch@example.com',
      username: 'invalid-switch',
      password: 'password123',
    })

    for (const tenantId of ['abc', 0, -1]) {
      const response = await client
        .post('/api/v1/tenants/switch')
        .json({ tenant_id: tenantId })
        .loginAs(user)

      response.assertStatus(400)
    }
  })

  test('GET /me requires authentication', async ({ client }) => {
    const response = await client.get('/api/v1/tenants/me')
    response.assertStatus(401)
  })
})
