import { randomUUID } from 'node:crypto'

import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import type { MultipartFile } from '@adonisjs/core/types/bodyparser'
import drive from '@adonisjs/drive/services/main'

import BadRequestException from '#exceptions/bad_request_exception'
import FileRepository from '#modules/files/repositories/file_repository'
import env from '#start/env'

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])
const DOCUMENT_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'])
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'])

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  mp4: 'video/mp4',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  txt: 'text/plain',
  csv: 'text/csv',
  zip: 'application/zip',
}

@inject()
export default class UploadFileService {
  constructor(private fileRepository: FileRepository) {}

  async run(file: MultipartFile) {
    const ctx = HttpContext.getOrFail()
    const user = ctx.auth.use('jwt').getUserOrFail()
    const tenantId = ctx.tenant?.id

    if (!tenantId) {
      throw new BadRequestException('An active tenant is required for file uploads')
    }

    const extname = (file.extname ?? '').toLowerCase()
    const key = `uploads/${randomUUID()}${extname ? `.${extname}` : ''}`
    const disk = drive.use()

    await file.moveToDisk(key)

    try {
      const relativeUrl = await disk.getUrl(key)
      const finalUrl =
        env.get('DRIVE_DISK') === 'fs'
          ? `${ctx.request.protocol()}://${ctx.request.host()}${relativeUrl}`
          : relativeUrl

      const fileCategory = this.getCategory(extname)
      const fileType = this.getMimeType(file, extname)
      const clientName = file.clientName?.replace(/\.[^.]+$/, '') ?? ''

      await this.fileRepository.create({
        owner_id: user.id,
        tenant_id: tenantId,
        client_name: clientName,
        file_name: key,
        file_size: file.size ?? 0,
        file_type: fileType,
        file_category: fileCategory,
        url: finalUrl,
      })

      return {
        url: finalUrl,
        clientName,
        fileCategory,
        fileType,
        size: file.size,
        extname: file.extname,
      }
    } catch (error) {
      try {
        await disk.delete(key)
      } catch (cleanupError) {
        ctx.logger.error(
          { cleanupError, storageKey: key },
          'Failed to remove an orphaned upload after persistence error'
        )
      }

      throw error
    }
  }

  private getCategory(extname: string) {
    if (IMAGE_EXTENSIONS.has(extname)) return 'image'
    if (DOCUMENT_EXTENSIONS.has(extname)) return 'document'
    if (VIDEO_EXTENSIONS.has(extname)) return 'video'
    if (AUDIO_EXTENSIONS.has(extname)) return 'audio'
    return 'file'
  }

  private getMimeType(file: MultipartFile, extname: string) {
    const reportedType = file.type?.trim()
    if (reportedType && reportedType.includes('/')) {
      return reportedType
    }

    return MIME_TYPES[extname] ?? 'application/octet-stream'
  }
}
