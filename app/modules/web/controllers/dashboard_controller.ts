import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import GetDashboardStatsService from '#modules/web/services/get_dashboard_stats_service'

export default class InertiaDashboardController {
  async index({ inertia, auth, tenant }: HttpContext) {
    const user = auth.getUserOrFail()
    const getDashboardStats = await app.container.make(GetDashboardStatsService)
    const stats = await getDashboardStats.run({
      userId: user.id,
      tenantId: tenant?.id,
    })

    return inertia.render('dashboard', { stats })
  }
}
