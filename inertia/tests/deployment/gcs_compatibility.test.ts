// @vitest-environment node
import { PassThrough } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, Storage } from '@google-cloud/storage'
import { Disk } from '@adonisjs/drive'
import { GCSDriver } from '@adonisjs/drive/drivers/gcs'
import { http, HttpResponse } from 'msw'
import { server } from '~/tests/mocks/server'

// No ambient credentials: synthetic credentials and a catch-all network guard
// also protect against a future SDK change bypassing the transport stub.
beforeEach(() => {
  server.use(http.all('*', () => HttpResponse.error()))
})
afterEach(() => vi.restoreAllMocks())

function fixture() {
  const storage = new Storage({
    projectId: 'synthetic-deployment-test',
    credentials: {
      client_email: 'synthetic@example.invalid',
      private_key: 'synthetic-invalid-key',
    },
  })
  const request = vi.spyOn(storage, 'request')
  const disk = new Disk(
    new GCSDriver({ storage, bucket: 'synthetic-uploads', visibility: 'private' })
  )
  return { disk, request }
}

function sdkError(code: number, message: string) {
  return new ApiError({
    code,
    message,
    response: {
      statusCode: code,
      headers: {},
      body: JSON.stringify({ error: { code, message } }),
      request: Object.assign(new PassThrough(), { agent: false as const, headers: {} }),
    },
  })
}

describe('GCS SDK compatibility', () => {
  it('maps an SDK 404 into a missing file', async () => {
    const { disk, request } = fixture()
    request.mockImplementation((_options, callback) => {
      callback!(sdkError(404, 'Synthetic missing object'))
    })
    await expect(disk.exists('missing.txt')).resolves.toBe(false)
  })

  it('preserves permission errors instead of reporting files missing', async () => {
    const { disk, request } = fixture()
    request.mockImplementation((_options, callback) => {
      callback!(sdkError(403, 'Synthetic denied object'))
    })
    await expect(disk.exists('private.txt')).rejects.toMatchObject({
      code: 'E_CANNOT_CHECK_FILE_EXISTENCE',
      cause: { code: 403 },
    })
  })

  it('maps SDK metadata into Flydrive metadata', async () => {
    const { disk, request } = fixture()
    request.mockImplementation((_options, callback) => {
      callback!(null, {
        size: '7',
        updated: '2026-01-01T00:00:00.000Z',
        contentType: 'text/plain',
        etag: 'synthetic-etag',
      })
    })
    await expect(disk.getMetaData('hello.txt')).resolves.toMatchObject({
      contentLength: 7,
      contentType: 'text/plain',
      lastModified: new Date('2026-01-01T00:00:00.000Z'),
    })
  })
})
