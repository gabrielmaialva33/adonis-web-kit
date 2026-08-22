import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import DeleteFileService from '#modules/files/services/delete_file_service'
import ListFilesService from '#modules/files/services/list_files_service'

export default class InertiaFilesController {
  async index({ inertia, request, tenant }: HttpContext) {
    const service = await app.container.make(ListFilesService)
    const files = await service.run({
      tenantId: tenant!.id,
      page: Number(request.input('page', 1)),
      perPage: Number(request.input('per_page', 20)),
    })

    return inertia.render('files/index', { files })
  }

  async destroy({ params, response, tenant, session }: HttpContext) {
    const service = await app.container.make(DeleteFileService)
    await service.run(Number(params.id), tenant!.id)
    session.flash('success', 'File deleted successfully.')

    return response.redirect().back()
  }
}
