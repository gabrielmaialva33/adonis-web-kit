import { inject } from '@adonisjs/core'
import drive from '@adonisjs/drive/services/main'

import NotFoundException from '#exceptions/not_found_exception'
import FileRepository from '#modules/files/repositories/file_repository'

@inject()
export default class DeleteFileService {
  constructor(private fileRepository: FileRepository) {}

  async run(fileId: number, tenantId: number): Promise<void> {
    const file = await this.fileRepository.findByIdForTenant(fileId, tenantId)
    if (!file) {
      throw new NotFoundException('File not found in the active workspace')
    }

    const disk = drive.use()
    await disk.delete(file.file_name)
    await file.delete()
  }
}
