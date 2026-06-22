import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#modules/audits/models/audit_log'
import AuditRepository from '#modules/audits/repositories/audit_repository'

export interface AuditLogData {
  userId?: number
  sessionId?: string
  resource: string
  action: string
  context?: string
  resourceId?: number
  result: 'granted' | 'denied'
  reason?: string
  metadata?: Record<string, any>
}

@inject()
export default class AuditService {
  constructor(private auditRepository: AuditRepository) {}

  /**
   * Log permission check result
   */
  async logPermissionCheck(data: AuditLogData, ctx?: HttpContext): Promise<AuditLog> {
    const auditData: Partial<AuditLog> = {
      user_id: data.userId || null,
      session_id: data.sessionId || null,
      resource: data.resource,
      action: data.action,
      context: data.context || null,
      resource_id: data.resourceId || null,
      result: data.result,
      reason: data.reason || null,
      metadata: data.metadata || null,
    }

    // Add request context if available
    if (ctx) {
      auditData.ip_address = ctx.request.ip()
      auditData.user_agent = ctx.request.header('User-Agent') || null
      auditData.method = ctx.request.method()
      auditData.url = ctx.request.url()
      auditData.response_code = ctx.response.getStatus()

      // Capture relevant request data (excluding sensitive info)
      auditData.request_data = this.sanitizeRequestData(ctx.request.all())
    }

    return await this.auditRepository.create(auditData)
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(
    userId: number,
    options: {
      limit?: number
      offset?: number
      resource?: string
      action?: string
      result?: 'granted' | 'denied'
      startDate?: Date
      endDate?: Date
    } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    return this.auditRepository.findUserLogs(userId, options)
  }

  /**
   * Get security alerts based on audit logs
   */
  async getSecurityAlerts(
    options: {
      hours?: number
      maxFailedAttempts?: number
      suspiciousIps?: string[]
    } = {}
  ): Promise<any[]> {
    const { hours = 24, maxFailedAttempts = 5, suspiciousIps = [] } = options
    const alerts: any[] = []

    // Check for repeated failed attempts
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    const failedAttempts = await this.auditRepository.findRepeatedFailedAttempts(
      since,
      maxFailedAttempts
    )

    failedAttempts.forEach((attempt) => {
      alerts.push({
        type: 'repeated_failed_attempts',
        severity: 'high',
        userId: attempt.user_id,
        ipAddress: attempt.ip_address,
        attempts: attempt.$extras.attempts,
        description: `${attempt.$extras.attempts} failed permission attempts in ${hours} hours`,
      })
    })

    // Check for suspicious IPs
    if (suspiciousIps.length > 0) {
      const suspiciousActivity = await this.auditRepository.findSuspiciousIpActivity(
        suspiciousIps,
        since
      )

      suspiciousActivity.forEach((activity) => {
        alerts.push({
          type: 'suspicious_ip_activity',
          severity: 'medium',
          ipAddress: activity.ip_address,
          activity: activity.$extras.activity,
          description: `Activity detected from suspicious IP: ${activity.ip_address}`,
        })
      })
    }

    return alerts
  }

  /**
   * Generate audit report
   */
  async generateReport(options: {
    startDate: Date
    endDate: Date
    userId?: number
    resource?: string
    groupBy?: 'user' | 'resource' | 'action' | 'day'
  }): Promise<any> {
    return this.auditRepository.generateGroupedReport(options)
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)

    return this.auditRepository.deleteOlderThan(cutoffDate)
  }

  /**
   * Sanitize request data to remove sensitive information
   */
  private sanitizeRequestData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie']
    const sanitized: Record<string, any> = {}

    Object.keys(data).forEach((key) => {
      const lowerKey = key.toLowerCase()
      const isSensitive = sensitiveFields.some((field) => lowerKey.includes(field))

      if (isSensitive) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = data[key]
      }
    })

    return sanitized
  }
}
