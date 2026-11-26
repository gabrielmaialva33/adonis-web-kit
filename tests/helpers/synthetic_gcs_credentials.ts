import { generateKeyPairSync } from 'node:crypto'

/** Supply credentials used only by the backend test runner, before dotenv loads. */
export function setupSyntheticGcsCredentials(environment: NodeJS.ProcessEnv = process.env): void {
  // Explicit overrides, including invalid ones, must retain normal validation.
  if (environment.GCS_KEY !== undefined) return

  // This ephemeral key belongs to no cloud account and is never persisted to disk.
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  environment.GCS_KEY = JSON.stringify({
    type: 'service_account',
    project_id: 'synthetic-test-project',
    client_email: 'synthetic@synthetic-test-project.iam.gserviceaccount.com',
    private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  })
}
