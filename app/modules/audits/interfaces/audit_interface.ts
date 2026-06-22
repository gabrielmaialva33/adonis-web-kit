import type LucidRepositoryInterface from '#shared/lucid/lucid_repository_interface'
import type AuditLog from '#modules/audits/models/audit_log'

namespace IAudit {
  export interface Repository extends LucidRepositoryInterface<typeof AuditLog> {
    findUserLogs(
      userId: number,
      filters: UserLogFilters
    ): Promise<{ logs: AuditLog[]; total: number }>

    findRepeatedFailedAttempts(since: Date, minAttempts: number): Promise<AuditLog[]>

    findSuspiciousIpActivity(ipAddresses: string[], since: Date): Promise<AuditLog[]>

    generateGroupedReport(options: ReportOptions): Promise<AuditLog[]>

    deleteOlderThan(cutoffDate: Date): Promise<number>
  }

  export interface UserLogFilters {
    limit?: number
    offset?: number
    resource?: string
    action?: string
    result?: 'granted' | 'denied'
    startDate?: Date
    endDate?: Date
  }

  export interface ReportOptions {
    startDate: Date
    endDate: Date
    userId?: number
    resource?: string
    groupBy?: 'user' | 'resource' | 'action' | 'day'
  }
}

export default IAudit
