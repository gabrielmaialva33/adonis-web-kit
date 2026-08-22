import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'

import File from '#modules/files/models/file'
import Tenant from '#modules/tenants/models/tenant'
import User from '#modules/users/models/user'
import GetDashboardStatsService from '#modules/web/services/get_dashboard_stats_service'

test.group('Dashboard workspace scoping', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should aggregate only data from the active tenant', async ({ assert }) => {
    const owner = await User.create({
      full_name: 'Workspace Owner',
      email: 'workspace-owner@example.com',
      username: 'workspace-owner',
      password: 'password123',
    })
    const alphaMember = await User.create({
      full_name: 'Alpha Member',
      email: 'alpha-member@example.com',
      username: 'alpha-member',
      password: 'password123',
    })
    const betaMember = await User.create({
      full_name: 'Beta Member',
      email: 'beta-member@example.com',
      username: 'beta-member',
      password: 'password123',
    })

    const alpha = await Tenant.create({ name: 'Alpha', slug: 'alpha-dashboard', is_active: true })
    const beta = await Tenant.create({ name: 'Beta', slug: 'beta-dashboard', is_active: true })
    const inactive = await Tenant.create({
      name: 'Inactive',
      slug: 'inactive-dashboard',
      is_active: false,
    })

    await owner.related('tenants').attach({
      [alpha.id]: { role: 'owner' },
      [beta.id]: { role: 'owner' },
      [inactive.id]: { role: 'member' },
    })
    await alphaMember.related('tenants').attach({ [alpha.id]: { role: 'member' } })
    await betaMember.related('tenants').attach({ [beta.id]: { role: 'member' } })

    await File.createMany([
      {
        owner_id: owner.id,
        tenant_id: alpha.id,
        client_name: 'alpha-one',
        file_name: 'uploads/alpha-one.txt',
        file_size: 10,
        file_type: 'text/plain',
        file_category: 'file',
        url: '/uploads/alpha-one.txt',
      },
      {
        owner_id: alphaMember.id,
        tenant_id: alpha.id,
        client_name: 'alpha-two',
        file_name: 'uploads/alpha-two.txt',
        file_size: 20,
        file_type: 'text/plain',
        file_category: 'file',
        url: '/uploads/alpha-two.txt',
      },
      {
        owner_id: betaMember.id,
        tenant_id: beta.id,
        client_name: 'beta-one',
        file_name: 'uploads/beta-one.txt',
        file_size: 30,
        file_type: 'text/plain',
        file_category: 'file',
        url: '/uploads/beta-one.txt',
      },
    ])

    const service = await app.container.make(GetDashboardStatsService)
    const stats = await service.run({ userId: owner.id, tenantId: alpha.id })

    assert.equal(stats.totals.users, 2)
    assert.equal(stats.totals.tenants, 2)
    assert.equal(stats.totals.files, 2)
    assert.isAbove(stats.totals.roles, 0)
    assert.equal(
      stats.signups.reduce((total, point) => total + point.users, 0),
      2
    )
    assert.includeMembers(
      stats.recentUsers.map((user) => user.email),
      ['workspace-owner@example.com', 'alpha-member@example.com']
    )
    assert.notInclude(
      stats.recentUsers.map((user) => user.email),
      'beta-member@example.com'
    )
  })

  test('should return empty tenant-scoped data when there is no active tenant', async ({
    assert,
  }) => {
    const user = await User.create({
      full_name: 'No Workspace',
      email: 'no-workspace@example.com',
      username: 'no-workspace',
      password: 'password123',
    })

    const service = await app.container.make(GetDashboardStatsService)
    const stats = await service.run({ userId: user.id })

    assert.equal(stats.totals.users, 0)
    assert.equal(stats.totals.tenants, 0)
    assert.equal(stats.totals.files, 0)
    assert.deepEqual(stats.recentUsers, [])
    assert.isTrue(stats.signups.every((point) => point.users === 0))
  })
})
