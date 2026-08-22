import jwt from 'jsonwebtoken'
import type { Secret, SignOptions } from 'jsonwebtoken'

export default class JwtService {
  async sign(payload: object, secret: Secret, options: SignOptions): Promise<string> {
    return jwt.sign(payload, secret, options)
  }
}
