// @vitest-environment node
/* eslint-disable @adonisjs/no-backend-import-in-frontend -- Node-only deployment tests, never bundled for the browser. */
import { describe, expect, it } from 'vitest'
import { setupSyntheticGcsCredentials } from '#tests/helpers/synthetic_gcs_credentials'
import { parseGcsCredentials } from '#shared/services/gcs_credentials'

describe('backend test GCS credentials', () => {
  it('supplies valid synthetic credentials when no process override exists', () => {
    const environment: NodeJS.ProcessEnv = {}
    setupSyntheticGcsCredentials(environment)

    const credentials = parseGcsCredentials(environment.GCS_KEY)
    expect(credentials).toMatchObject({
      type: 'service_account',
      project_id: 'synthetic-test-project',
      client_email: 'synthetic@synthetic-test-project.iam.gserviceaccount.com',
    })
    expect(credentials?.private_key).toMatch(/^-----BEGIN PRIVATE KEY-----/)
  })

  it('preserves credentials explicitly supplied by the caller', () => {
    const environment: NodeJS.ProcessEnv = {}
    setupSyntheticGcsCredentials(environment)
    const explicitlySupplied = environment.GCS_KEY
    expect(explicitlySupplied).toBeDefined()

    setupSyntheticGcsCredentials(environment)
    expect(environment.GCS_KEY).toBe(explicitlySupplied)
    expect(parseGcsCredentials(environment.GCS_KEY)).toBeDefined()
  })

  it.each(['explicit-invalid-value', ''])(
    'preserves invalid explicit credentials %j for startup rejection',
    (value) => {
      const environment: NodeJS.ProcessEnv = { GCS_KEY: value }
      setupSyntheticGcsCredentials(environment)

      expect(environment.GCS_KEY).toBe(value)
      expect(() => parseGcsCredentials(environment.GCS_KEY)).toThrow(/GCS_KEY.*JSON/)
    }
  )
})
