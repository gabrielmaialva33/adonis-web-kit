import { extname } from 'node:path'

import { inject } from '@adonisjs/core'
import drive from '@adonisjs/drive/services/main'

import ForbiddenException from '#exceptions/forbidden_exception'
import NotFoundException from '#exceptions/not_found_exception'
import FileRepository from '#modules/files/repositories/file_repository'

@inject()
export default class DownloadFileService {
  constructor(private fileRepository: FileRepository) {}

  async run(fileId: number, tenantId: number, userId: number) {
    if (
      !Number.isSafeInteger(tenantId) ||
      tenantId <= 0 ||
      !Number.isSafeInteger(fileId) ||
      fileId <= 0
    ) {
      throw new NotFoundException('File not found')
    }

    if (!(await this.fileRepository.hasActiveMembership(userId, tenantId))) {
      throw new ForbiddenException('The requested workspace is inactive or inaccessible')
    }

    const file = await this.fileRepository.findByIdForTenant(fileId, tenantId)
    const disk = drive.use()
    if (!file || !(await disk.exists(file.file_name))) {
      throw new NotFoundException('File not found in the requested workspace')
    }

    return {
      stream: await disk.getStream(file.file_name),
      contentType: file.file_type,
      filename: `${file.client_name}${extname(file.file_name)}`,
    }
  }
}
