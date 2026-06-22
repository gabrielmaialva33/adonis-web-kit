import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

import UsersRepository from '#modules/users/repositories/users_repository'
import RolesRepository from '#modules/roles/repositories/roles_repository'
import TenantRepository from '#modules/tenants/repositories/tenant_repository'
import FileRepository from '#modules/files/repositories/file_repository'

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

@inject()
export default class GetDashboardStatsService {
  constructor(
    private usersRepository: UsersRepository,
    private rolesRepository: RolesRepository,
    private tenantRepository: TenantRepository,
    private fileRepository: FileRepository
  ) {}

  /**
   * Aggregates the numbers shown on the admin dashboard. Counts are real model
   * counts; the signups series is computed over the last 6 months in JS so it
   * stays portable across PostgreSQL (prod) and SQLite (tests).
   */
  async run(): Promise<DashboardStats> {
    const [users, tenants, files, roles] = await Promise.all([
      this.usersRepository.count(),
      this.tenantRepository.count(),
      this.fileRepository.count(),
      this.rolesRepository.count(),
    ])

    const signups = await this.#buildSignupSeries()
    const recentUsers = await this.#buildRecentUsers()

    return {
      totals: {
        users,
        tenants,
        files,
        roles,
      },
      signups,
      recentUsers,
    }
  }

  async #buildSignupSeries(): Promise<DashboardSignupPoint[]> {
    const start = DateTime.now().startOf('month').minus({ months: 5 })

    const recent = await this.usersRepository.findCreatedSince(
      start.toSQL({ includeOffset: false })!
    )

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
    const users = await this.usersRepository.listRecentWithRoles(5)

    return users.map((user) => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      created_at: user.created_at ? user.created_at.toISO() : null,
      roles: user.roles.map((role) => role.name),
    }))
  }
}
