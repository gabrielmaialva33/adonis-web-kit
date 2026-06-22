import LucidRepository from '#shared/lucid/lucid_repository'
import File from '#modules/files/models/file'
import type IFile from '#modules/files/interfaces/file_interface'

export default class FileRepository
  extends LucidRepository<typeof File>
  implements IFile.Repository
{
  constructor() {
    super(File)
  }
}
