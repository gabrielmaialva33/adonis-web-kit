import type { SignOptions } from 'jsonwebtoken'

export const JWT_ISSUER = 'adonis-web-kit'
export const JWT_AUDIENCE = 'adonis-web-kit'
export const JWT_COOKIE_NAME = 'token'

export const API_ACCESS_TOKEN_EXPIRES_IN: SignOptions['expiresIn'] = '15m'
export const WEB_ACCESS_TOKEN_EXPIRES_IN: SignOptions['expiresIn'] = '1h'

export const REFRESH_TOKEN_TTL_DAYS = 3
export const REFRESH_TOKEN_BYTES = 48
