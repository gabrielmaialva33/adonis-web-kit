// @vitest-environment node
import { generateKeyPairSync } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { services } from '@adonisjs/drive'

const environment = vi.hoisted(() => ({ key: undefined as string | undefined }))
vi.mock('#start/env', () => ({
  default: {
    get: (name: string, fallback?: string) => {
      if (name === 'GCS_KEY') return environment.key
      if (name === 'DRIVE_DISK') return 'gcs'
      if (name === 'GCS_BUCKET') return 'synthetic-uploads'
      return fallback
    },
  },
}))
vi.mock('@adonisjs/core/services/app', () => ({
  default: { makePath: () => '/synthetic/storage' },
}))

// Generated locally for validation only; never authenticated or sent to an SDK.
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const serviceAccount = {
  type: 'service_account',
  project_id: 'synthetic-project',
  client_email: 'synthetic@synthetic-project.iam.gserviceaccount.com',
  private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  environment.key = undefined
})

async function resolveOptions() {
  const gcs = vi.spyOn(services, 'gcs')
  const { default: config } = await import('#config/drive')
  const resolved = await config.resolver({ tmpPath: () => '/synthetic/tmp' } as never)
  expect(resolved.config.default).toBe('gcs')
  // Resolve the real config but never invoke a disk factory: no Storage instance,
  // ambient credential discovery, bucket calls, or SDK HTTP can occur.
  return gcs.mock.calls[0][0]
}

describe('GCS configuration', () => {
  it('parses service-account JSON before configuring the GCS driver', async () => {
    environment.key = JSON.stringify(serviceAccount)
    const options = await resolveOptions()
    expect(options).toMatchObject({
      bucket: 'synthetic-uploads',
      visibility: 'private',
      credentials: serviceAccount,
    })
    expect(typeof ('credentials' in options && options.credentials)).toBe('object')
  })

  it('leaves credentials undefined for explicitly supported ADC when GCS_KEY is absent', async () => {
    const options = await resolveOptions()
    expect('credentials' in options ? options.credentials : undefined).toBeUndefined()
  })

  it.each([
    ['malformed JSON', '{"private_key":"SENSITIVE_SYNTHETIC_VALUE"', /GCS_KEY.*JSON/],
    ['empty string', '', /GCS_KEY.*JSON/],
    ['null', 'null', /GCS_KEY.*object/],
    ['array', '[]', /GCS_KEY.*object/],
    ['string', '"SENSITIVE_SYNTHETIC_VALUE"', /GCS_KEY.*object/],
    ['number', '42', /GCS_KEY.*object/],
    ['boolean', 'true', /GCS_KEY.*object/],
    [
      'missing type',
      JSON.stringify({ ...serviceAccount, type: undefined }),
      /GCS_KEY.*service_account/,
    ],
    [
      'external credentials',
      JSON.stringify({ ...serviceAccount, type: 'external_account' }),
      /GCS_KEY.*service_account/,
    ],
    [
      'user credentials',
      JSON.stringify({ ...serviceAccount, type: 'authorized_user' }),
      /GCS_KEY.*service_account/,
    ],
    ...(['project_id', 'client_email', 'private_key'] as const).flatMap((field) => [
      [
        `missing ${field}`,
        JSON.stringify({ ...serviceAccount, [field]: undefined }),
        new RegExp(`GCS_KEY.*${field}`),
      ],
      [
        `empty ${field}`,
        JSON.stringify({ ...serviceAccount, [field]: '  ' }),
        new RegExp(`GCS_KEY.*${field}`),
      ],
      [
        `non-string ${field}`,
        JSON.stringify({ ...serviceAccount, [field]: 42 }),
        new RegExp(`GCS_KEY.*${field}`),
      ],
    ]),
    [
      'invalid private key',
      JSON.stringify({ ...serviceAccount, private_key: 'SENSITIVE_SYNTHETIC_VALUE' }),
      /GCS_KEY.*private_key/,
    ],
    [
      'non-RSA key',
      JSON.stringify({
        ...serviceAccount,
        private_key: generateKeyPairSync('ed25519')
          .privateKey.export({ type: 'pkcs8', format: 'pem' })
          .toString(),
      }),
      /GCS_KEY.*private_key.*RSA/,
    ],
  ])('rejects %s at startup without disclosing supplied secrets', async (_name, input, message) => {
    environment.key = input as string
    const error = await import('#config/drive').then(
      () => undefined,
      (reason: unknown) => reason
    )
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toMatch(message as RegExp)
    expect((error as Error).message).not.toContain('SENSITIVE_SYNTHETIC_VALUE')
    expect((error as Error).cause).toBeUndefined()
  })

  it('does not forward extra credential properties that can redirect authentication', async () => {
    environment.key = JSON.stringify({
      ...serviceAccount,
      token_uri: 'https://untrusted.invalid/token',
      universe_domain: 'untrusted.invalid',
      credential_source: { file: '/synthetic/secret' },
    })
    const options = await resolveOptions()
    expect('credentials' in options && options.credentials).toEqual(serviceAccount)
  })
})
