/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  APP_NAME: Env.schema.string.optional(),
  APP_URL: Env.schema.string.optional(),
  APP_SOURCE_URL: Env.schema.string.optional(),
  APP_KEY: Env.schema.string(),
  ACCESS_TOKEN_SECRET: Env.schema.string.optional(),
  REFRESH_TOKEN_SECRET: Env.schema.string.optional(),
  EMAIL_VERIFICATION_SECRET: Env.schema.string.optional(),
  PASSWORD_RESET_SECRET: Env.schema.string.optional(),
  PASSWORD_RESET_TTL_MINUTES: Env.schema.number.optional(),
  JWT_ISSUER: Env.schema.string.optional(),
  JWT_AUDIENCE: Env.schema.string.optional(),
  JWT_COOKIE_NAME: Env.schema.string.optional(),
  SESSION_COOKIE_NAME: Env.schema.string.optional(),
  REGISTRATION_WORKSPACE_MODE: Env.schema.enum.optional(['none', 'personal'] as const),
  DEMO_PAGES_ENABLED: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
  LIMITER_STORE: Env.schema.enum(['redis', 'database', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  DRIVE_DISK: Env.schema.enum(['fs', 's3', 'spaces', 'r2', 'gcs'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_CONNECTION: Env.schema.enum.optional(['postgres', 'sqlite'] as const),
  DB_HOST: Env.schema.string.optional({ format: 'host' }),
  DB_PORT: Env.schema.number.optional(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string.optional(),
  /*
  |----------------------------------------------------------
  | Variables for configuring the cache package
  |----------------------------------------------------------
  */
  REDIS_HOST: Env.schema.string.optional({ format: 'host' }),
  REDIS_PORT: Env.schema.number.optional(),
  REDIS_PASSWORD: Env.schema.string.optional(),
  REDIS_DB: Env.schema.number.optional(),
  /*
  |----------------------------------------------------------
  | Variables for @rlanz/bull-queue
  |----------------------------------------------------------
  */
  QUEUE_REDIS_HOST: Env.schema.string.optional({ format: 'host' }),
  QUEUE_REDIS_PORT: Env.schema.number.optional(),
  QUEUE_REDIS_PASSWORD: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring ally package
  |----------------------------------------------------------
  */
  DISCORD_CLIENT_ID: Env.schema.string.optional(),
  DISCORD_CLIENT_SECRET: Env.schema.string.optional(),

  FACEBOOK_CLIENT_ID: Env.schema.string.optional(),
  FACEBOOK_CLIENT_SECRET: Env.schema.string.optional(),

  GITHUB_CLIENT_ID: Env.schema.string.optional(),
  GITHUB_CLIENT_SECRET: Env.schema.string.optional(),

  GOOGLE_CLIENT_ID: Env.schema.string.optional(),
  GOOGLE_CLIENT_SECRET: Env.schema.string.optional(),

  LINKEDIN_CLIENT_ID: Env.schema.string.optional(),
  LINKEDIN_CLIENT_SECRET: Env.schema.string.optional(),

  SPOTIFY_CLIENT_ID: Env.schema.string.optional(),
  SPOTIFY_CLIENT_SECRET: Env.schema.string.optional(),

  TWITTER_CLIENT_ID: Env.schema.string.optional(),
  TWITTER_CLIENT_SECRET: Env.schema.string.optional(),

  // S3
  AWS_ACCESS_KEY_ID: Env.schema.string.optional(),
  AWS_SECRET_ACCESS_KEY: Env.schema.string.optional(),
  AWS_REGION: Env.schema.string.optional(),
  S3_BUCKET: Env.schema.string.optional(),

  // Spaces
  SPACES_KEY: Env.schema.string.optional(),
  SPACES_SECRET: Env.schema.string.optional(),
  SPACES_REGION: Env.schema.string.optional(),
  SPACES_BUCKET: Env.schema.string.optional(),
  SPACES_ENDPOINT: Env.schema.string.optional(),

  // R2
  R2_KEY: Env.schema.string.optional(),
  R2_SECRET: Env.schema.string.optional(),
  R2_BUCKET: Env.schema.string.optional(),
  R2_ENDPOINT: Env.schema.string.optional(),

  // GCS
  GCS_KEY: Env.schema.string.optional(),
  GCS_BUCKET: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  MAIL_MAILER: Env.schema.enum(['smtp', 'mailgun'] as const),
  MAIL_FROM_ADDRESS: Env.schema.string.optional(),
  MAIL_FROM_NAME: Env.schema.string.optional(),

  // SMTP Configuration
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.number.optional(),
  SMTP_USER: Env.schema.string.optional(),
  SMTP_PASS: Env.schema.string.optional(),

  // Mailgun Configuration
  MAILGUN_API_KEY: Env.schema.string.optional(),
  MAILGUN_DOMAIN: Env.schema.string.optional(),
  MAILGUN_BASE_URL: Env.schema.string.optional(),
})
