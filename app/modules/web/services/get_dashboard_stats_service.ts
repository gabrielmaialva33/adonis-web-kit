import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

import FileRepository from '#modules/files/repositories/file_repository'
import RolesRepository from '#modules/roles/repositories/roles_repository'
import TenantRepository from '#modules/tenants/repositories/tenant_repository'
import UsersRepository from '#modules/users/repositories/users_repository'

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

export type DashboardStatsOptions = {
  userId: number
  tenantId?: number
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
   * Workspace data is scoped to the active tenant. The roles count remains
   * global by design because this kit currently uses platform-wide RBAC; tenant
   * membership roles are informational and do not alter permission grants.
   */
  async run({ userId, tenantId }: DashboardStatsOptions): Promise<DashboardStats> {
    // Keep these queries sequential. Test suites often run inside a single
    // global transaction, and pg@9 will reject concurrent queries on one client.
    const users = tenantId ? await this.usersRepository.countForTenant(tenantId) : 0
    const tenants = await this.tenantRepository.countActiveForUser(userId)
    const files = tenantId ? await this.fileRepository.countForTenant(tenantId) : 0
    const roles = await this.rolesRepository.count()
    const signups = await this.buildSignupSeries(tenantId)
    const recentUsers = await this.buildRecentUsers(tenantId)

    return {
      totals: { users, tenants, files, roles },
      signups,
      recentUsers,
    }
  }

  private async buildSignupSeries(tenantId?: number): Promise<DashboardSignupPoint[]> {
    const start = DateTime.now().startOf('month').minus({ months: 5 })
    const buckets = new Map<string, number>()

    for (let index = 0; index < 6; index++) {
      const month = start.plus({ months: index })
      buckets.set(month.toFormat('yyyy-MM'), 0)
    }

    if (tenantId) {
      const recent = await this.usersRepository.findCreatedSinceForTenant(
        start.toSQL({ includeOffset: false })!,
        tenantId
      )

      for (const user of recent) {
        if (!user.created_at) continue
        const key = user.created_at.toFormat('yyyy-MM')
        if (buckets.has(key)) {
          buckets.set(key, (buckets.get(key) ?? 0) + 1)
        }
      }
    }

    return Array.from(buckets.entries()).map(([key, count]) => ({
      month: DateTime.fromFormat(key, 'yyyy-MM').toFormat('LLL'),
      users: count,
    }))
  }

  private async buildRecentUsers(tenantId?: number): Promise<DashboardRecentUser[]> {
    if (!tenantId) {
      return []
    }

    const users = await this.usersRepository.listRecentWithRolesForTenant(5, tenantId)

    return users.map((user) => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      created_at: user.created_at ? user.created_at.toISO() : null,
      roles: user.roles.map((role) => role.name),
    }))
  }
}
