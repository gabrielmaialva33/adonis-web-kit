import { healthChecks } from '#start/health'
import type { HttpContext } from '@adonisjs/core/http'

export default class HealthChecksController {
  async handle({ response }: HttpContext) {
    const report = await healthChecks.run()

    /**
     * Report every check, not just the database one: a 503 whose payload only
     * ever mentions the database is undiagnosable when something else is what
     * actually went down.
     */
    const healthResponse = {
      healthy: report.isHealthy,
      services: {
        database: {
          healthy: report.checks.some(
            (check) => check.name.includes('Database') && check.status === 'ok'
          ),
        },
      },
      checks: report.checks.map((check) => ({
        name: check.name,
        status: check.status,
        message: check.message,
      })),
    }

    if (report.isHealthy) {
      return response.ok(healthResponse)
    }

    return response.serviceUnavailable(healthResponse)
  }
}
