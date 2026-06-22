import LucidRepository from '#shared/lucid/lucid_repository'
import AuditLog from '#modules/audits/models/audit_log'
import type IAudit from '#modules/audits/interfaces/audit_interface'

export default class AuditRepository
  extends LucidRepository<typeof AuditLog>
  implements IAudit.Repository
{
  constructor() {
    super(AuditLog)
  }

  /**
   * Fetch audit logs for a user with optional filters, returning the paged logs
   * (with the related user preloaded) and the total count of matching rows.
   */
  async findUserLogs(
    userId: number,
    filters: IAudit.UserLogFilters
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const query = this.model.query().where('user_id', userId).orderBy('created_at', 'desc')

    if (filters.resource) {
      query.where('resource', filters.resource)
    }

    if (filters.action) {
      query.where('action', filters.action)
    }

    if (filters.result) {
      query.where('result', filters.result)
    }

    if (filters.startDate && filters.endDate) {
      query.whereBetween('created_at', [filters.startDate, filters.endDate])
    }

    const totalQuery = query.clone()
    const total = await totalQuery.count('* as total')

    if (filters.limit) {
      query.limit(filters.limit)
    }

    if (filters.offset) {
      query.offset(filters.offset)
    }

    const logs = await query.preload('user')

    return {
      logs,
      total: total[0].$extras.total,
    }
  }

  /**
   * Group denied results by user/ip since a given date and keep only the groups
   * with at least `minAttempts` occurrences.
   */
  async findRepeatedFailedAttempts(since: Date, minAttempts: number): Promise<AuditLog[]> {
    return this.model
      .query()
      .where('result', 'denied')
      .where('created_at', '>=', since)
      .groupBy('user_id', 'ip_address')
      .select('user_id', 'ip_address')
      .count('* as attempts')
      .having('attempts', '>=', minAttempts)
  }

  /**
   * Aggregate activity grouped by ip address for the given suspicious ips since
   * a date.
   */
  async findSuspiciousIpActivity(ipAddresses: string[], since: Date): Promise<AuditLog[]> {
    return this.model
      .query()
      .whereIn('ip_address', ipAddresses)
      .where('created_at', '>=', since)
      .groupBy('ip_address')
      .select('ip_address')
      .count('* as activity')
  }

  /**
   * Build the aggregated audit report grouped by user/resource/action/day over a
   * date range.
   */
  async generateGroupedReport(options: IAudit.ReportOptions): Promise<AuditLog[]> {
    const { startDate, endDate, userId, resource, groupBy = 'day' } = options

    const query = this.model.query().whereBetween('created_at', [startDate, endDate])

    if (userId) {
      query.where('user_id', userId)
    }

    if (resource) {
      query.where('resource', resource)
    }

    switch (groupBy) {
      case 'user':
        return query
          .groupBy('user_id')
          .select('user_id')
          .count('* as total')
          .countDistinct('resource as resources_accessed')
          .preload('user')

      case 'resource':
        return query
          .groupBy('resource')
          .select('resource')
          .count('* as total')
          .countDistinct('user_id as unique_users')

      case 'action':
        return query
          .groupBy('action')
          .select('action')
          .count('* as total')
          .countDistinct('user_id as unique_users')

      case 'day':
      default:
        return query
          .groupByRaw('DATE(created_at)')
          .select('created_at')
          .count('* as total')
          .countDistinct('user_id as unique_users')
          .orderBy('created_at')
    }
  }

  /**
   * Delete every log created before the cutoff date and return how many rows
   * were removed.
   */
  async deleteOlderThan(cutoffDate: Date): Promise<number> {
    const deletedCount = await this.model.query().where('created_at', '<', cutoffDate).delete()

    return deletedCount[0]
  }
}
