import { DateTime } from 'luxon'

import User from '#modules/users/models/user'
import Role from '#modules/roles/models/role'
import Tenant from '#modules/tenants/models/tenant'
import File from '#modules/files/models/file'

export type DashboardSignupPoint = {
  month: string
  users: number
}

export type DashboardRecentUser = {
  id: number
  full_name: string
  email: string
  created_at: string | null
  roles: string[]
}

export type DashboardStats = {
  totals: {
    users: number
    tenants: number
    files: number
    roles: number
  }
  signups: DashboardSignupPoint[]
  recentUsers: DashboardRecentUser[]
}

export default class GetDashboardStatsService {
  /**
   * Aggregates the numbers shown on the admin dashboard. Counts are real model
   * counts; the signups series is computed over the last 6 months in JS so it
   * stays portable across PostgreSQL (prod) and SQLite (tests).
   */
  async run(): Promise<DashboardStats> {
    const [users, tenants, files, roles] = await Promise.all([
      User.query().count('* as total'),
      Tenant.query().count('* as total'),
      File.query().count('* as total'),
      Role.query().count('* as total'),
    ])

    const signups = await this.#buildSignupSeries()
    const recentUsers = await this.#buildRecentUsers()

    return {
      totals: {
        users: this.#count(users),
        tenants: this.#count(tenants),
        files: this.#count(files),
        roles: this.#count(roles),
      },
      signups,
      recentUsers,
    }
  }

  #count(rows: { $extras: Record<string, unknown> }[]): number {
    return Number(rows[0]?.$extras.total ?? 0)
  }

  async #buildSignupSeries(): Promise<DashboardSignupPoint[]> {
    const start = DateTime.now().startOf('month').minus({ months: 5 })

    const recent = await User.query()
      .where('created_at', '>=', start.toSQL({ includeOffset: false })!)
      .select('created_at')

    const buckets = new Map<string, number>()
    for (let i = 0; i < 6; i++) {
      const month = start.plus({ months: i })
      buckets.set(month.toFormat('yyyy-MM'), 0)
    }

    for (const user of recent) {
      if (!user.created_at) continue
      const key = user.created_at.toFormat('yyyy-MM')
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + 1)
      }
    }

    return Array.from(buckets.entries()).map(([key, count]) => ({
      month: DateTime.fromFormat(key, 'yyyy-MM').toFormat('LLL'),
      users: count,
    }))
  }

  async #buildRecentUsers(): Promise<DashboardRecentUser[]> {
    const users = await User.query().preload('roles').orderBy('created_at', 'desc').limit(5)

    return users.map((user) => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      created_at: user.created_at ? user.created_at.toISO() : null,
      roles: user.roles.map((role) => role.name),
    }))
  }
}
