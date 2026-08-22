import { BaseSchema } from '@adonisjs/lucid/schema'
import app from '@adonisjs/core/services/app'

import AssignDefaultPermissionsService from '#modules/permissions/services/assign_default_permissions_service'
import { getDefaultPermissionNames } from '#modules/permissions/services/create_default_permissions_service'

export default class extends BaseSchema {
  async up() {
    const service = await app.container.make(AssignDefaultPermissionsService)
    const trx = await this.db.transaction()
    try {
      await service.run(trx)
      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async down() {
    await this.db.from('permissions').whereIn('name', getDefaultPermissionNames()).delete()
  }
}
