import type { HttpContext } from '@adonisjs/core/http'
import jwt from 'jsonwebtoken'

import env from '#start/env'
import ForbiddenException from '#exceptions/forbidden_exception'
import BadRequestException from '#exceptions/bad_request_exception'

/**
 * Inertia (web) tenant controller.
 *
 * Handles switching the active tenant for a browser session. The JWT guard
 * stores its token in the `token` httpOnly cookie carrying only `{ userId }`.
 * To switch tenants we re-mint a token that ALSO carries `tenantId` so the
 * `tenant_middleware` resolves the requested tenant on subsequent requests.
 *
 * We sign the token here (instead of `auth.use('jwt').generate`) because the
 * configured guard `content` callback only emits `{ userId }`; replicating the
 * sign lets us inject `tenantId` while keeping the exact shape/secret the guard
 * verifies against (it only requires `userId` to be present).
 */
export default class InertiaTenantController {
  async switch({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const tenantIdInput: unknown = request.input('tenant_id')
    const tenantId = Number(tenantIdInput)

    if (!Number.isInteger(tenantId)) {
      throw new BadRequestException('tenant_id is required and must be an integer')
    }

    const tenant = await user.related('tenants').query().where('tenants.id', tenantId).first()
    if (!tenant) {
      throw new ForbiddenException('You do not belong to this tenant')
    }

    const token = jwt.sign({ userId: user.id, tenantId: tenant.id }, env.get('APP_KEY'), {
      expiresIn: '1h',
    })

    response.cookie('token', token, { httpOnly: true })

    return response.redirect().back()
  }
}
