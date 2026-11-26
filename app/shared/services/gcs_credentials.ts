import { createPrivateKey } from 'node:crypto'

interface ServiceAccountCredentials {
  type: 'service_account'
  project_id: string
  client_email: string
  private_key: string
}

/** Parse inline service-account JSON, or let the SDK use ADC when absent. */
export function parseGcsCredentials(
  value: string | undefined
): ServiceAccountCredentials | undefined {
  if (value === undefined) return undefined

  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    // JSON/OpenSSL errors can include input. Never attach them as a cause.
    throw new Error('Invalid GCS_KEY: expected valid service-account JSON')
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid GCS_KEY: expected a service-account JSON object')
  }
  if (!('type' in parsed) || parsed.type !== 'service_account') {
    throw new Error('Invalid GCS_KEY: type must be service_account')
  }
  const credentials = parsed

  function requiredString(field: string): string {
    const fieldValue: unknown = Reflect.get(credentials, field)
    if (typeof fieldValue !== 'string' || !fieldValue.trim()) {
      throw new Error(`Invalid GCS_KEY: ${field} must be a non-empty string`)
    }
    return fieldValue
  }

  const projectId = requiredString('project_id')
  const clientEmail = requiredString('client_email')
  const privateKey = requiredString('private_key')
  try {
    if (createPrivateKey(privateKey).asymmetricKeyType !== 'rsa') {
      throw new Error('Unsupported key type')
    }
  } catch {
    throw new Error('Invalid GCS_KEY: private_key must be a valid RSA private key')
  }

  // Do not forward credential_source, token_uri, or other authentication options.
  return {
    type: 'service_account',
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  }
}
