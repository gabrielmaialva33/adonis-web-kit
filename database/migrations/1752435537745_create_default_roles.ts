import { BaseSchema } from '@adonisjs/lucid/schema'
import app from '@adonisjs/core/services/app'

import IRole from '#modules/roles/interfaces/role_interface'
import CreateDefaultRolesService from '#modules/roles/services/create_default_roles_service'

export default class extends BaseSchema {
  async up() {
    const service = await app.container.make(CreateDefaultRolesService)
    const trx = await this.db.transaction()
    await service.run(trx)
    await trx.commit()
  }

  async down() {
    await this.db.from('roles').whereIn('slug', Object.values(IRole.Slugs)).delete()
  }
}
