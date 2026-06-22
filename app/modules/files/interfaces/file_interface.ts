import type LucidRepositoryInterface from '#shared/lucid/lucid_repository_interface'
import type File from '#modules/files/models/file'

namespace IFile {
  export interface Repository extends LucidRepositoryInterface<typeof File> {}
}

export default IFile
