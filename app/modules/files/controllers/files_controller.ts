import { type HttpContext } from '@adonisjs/core/http'

import app from '@adonisjs/core/services/app'
import DeleteFileService from '#modules/files/services/delete_file_service'
import ListFilesService from '#modules/files/services/list_files_service'
import UploadFileService from '#modules/files/services/upload_file_service'

export default class FilesController {
  async list({ request, response, tenant }: HttpContext) {
    const service = await app.container.make(ListFilesService)
    const files = await service.run({
      tenantId: tenant!.id,
      page: Number(request.input('page', 1)),
      perPage: Number(request.input('per_page', 20)),
    })

    return response.ok(files)
  }

  async upload({ request, response }: HttpContext) {
    const file = request.file('file', {
      size: '10mb',
      extnames: [
        'jpeg',
        'jpg',
        'png',
        'pdf',
        'doc',
        'docx',
        'txt',
        'csv',
        'xls',
        'xlsx',
        'mp3',
        'mp4',
        'zip',
      ],
    })
    if (!file) {
      return response.unprocessableEntity({
        errors: [
          {
            field: 'file',
            rule: 'required',
            message: 'The file field is required',
          },
        ],
      })
    }

    if (!file.isValid) {
      const errors: { field: string; rule: string; message: string }[] = []
      if (file.errors && file.errors.length > 0) {
        file.errors.forEach((error) => {
          if (error.type === 'size') {
            errors.push({
              field: 'file',
              rule: 'file.size',
              message: `File size should be less than ${file.sizeLimit}`,
            })
          }
          if (error.type === 'extname') {
            const allowedExts = [
              'jpeg',
              'jpg',
              'png',
              'pdf',
              'doc',
              'docx',
              'txt',
              'csv',
              'xls',
              'xlsx',
              'mp3',
              'mp4',
              'zip',
            ]
            errors.push({
              field: 'file',
              rule: 'file.extname',
              message: `Invalid file extension. Allowed: ${allowedExts.join(', ')}`,
            })
          }
        })
      }
      return response.unprocessableEntity({ errors })
    }

    const service = await app.container.make(UploadFileService)
    const data = await service.run(file)

    return response.created(data)
  }

  async delete({ params, response, tenant }: HttpContext) {
    const service = await app.container.make(DeleteFileService)
    await service.run(Number(params.id), tenant!.id)

    return response.noContent()
  }
}
