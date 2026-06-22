import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Tenant from '#modules/tenants/models/tenant'
import User from '#modules/users/models/user'

export default class extends BaseSeeder {
  // Dev only: keeps the test database clean (the test setup also runs seeders,
  // and a persistent default tenant would leak across global-transaction tests).
  static environment = ['development']

  async run() {
    const tenant = await Tenant.firstOrCreate(
      { slug: 'default' },
      { name: 'Default', slug: 'default', is_active: true }
    )

    // Attach every seeded user to the default tenant. The first user becomes the
    // owner; the rest are members. attach() is a no-op for already-linked users.
    const users = await User.all()
    if (users.length === 0) {
      return
    }

    const existing = await tenant.related('users').query().select('users.id')
    const linkedIds = new Set(existing.map((u) => u.id))

    const [first, ...rest] = users

    if (!linkedIds.has(first.id)) {
      await tenant.related('users').attach({ [first.id]: { role: 'owner' } })
    }

    for (const user of rest) {
      if (!linkedIds.has(user.id)) {
        await tenant.related('users').attach({ [user.id]: { role: 'member' } })
      }
    }
  }
}
