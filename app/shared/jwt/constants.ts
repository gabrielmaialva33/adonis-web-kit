import type { SignOptions } from 'jsonwebtoken'

import env from '#start/env'

const defaultIdentifier = env
  .get('APP_NAME', 'Adonis Web Kit')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

export const JWT_ISSUER = env.get('JWT_ISSUER', defaultIdentifier)
export const JWT_AUDIENCE = env.get('JWT_AUDIENCE', defaultIdentifier)
export const JWT_COOKIE_NAME = env.get('JWT_COOKIE_NAME', 'token')

export const API_ACCESS_TOKEN_EXPIRES_IN: SignOptions['expiresIn'] = '15m'
export const WEB_ACCESS_TOKEN_EXPIRES_IN: SignOptions['expiresIn'] = '1h'

export const REFRESH_TOKEN_TTL_DAYS = 3
export const REFRESH_TOKEN_BYTES = 48
