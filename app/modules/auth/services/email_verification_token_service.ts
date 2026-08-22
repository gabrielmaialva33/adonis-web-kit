import { createHmac, randomBytes } from 'node:crypto'

import env from '#start/env'

const EMAIL_VERIFICATION_TOKEN_BYTES = 32

export default class EmailVerificationTokenService {
  generate(): { token: string; tokenHash: string } {
    const token = randomBytes(EMAIL_VERIFICATION_TOKEN_BYTES).toString('base64url')
    return { token, tokenHash: this.hash(token) }
  }

  hash(token: string): string {
    return createHmac('sha256', env.get('EMAIL_VERIFICATION_SECRET', env.get('APP_KEY')))
      .update(token)
      .digest('hex')
  }
}
