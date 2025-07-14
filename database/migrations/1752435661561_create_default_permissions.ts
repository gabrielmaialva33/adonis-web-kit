import { BaseSchema } from '@adonisjs/lucid/schema'
import app from '@adonisjs/core/services/app'

import AssignDefaultPermissionsService from '#services/permissions/assign_default_permissions_service'

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
    // Remove all permission associations
    this.db.raw('TRUNCATE TABLE role_permissions CASCADE')
    this.db.raw('TRUNCATE TABLE user_permissions CASCADE')
    this.db.raw('TRUNCATE TABLE permissions CASCADE')
  }
}
