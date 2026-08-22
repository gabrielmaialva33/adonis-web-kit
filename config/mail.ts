import { defineConfig, transports } from '@adonisjs/mail'
import env from '#start/env'

const smtpUser = env.get('SMTP_USER')
const smtpPass = env.get('SMTP_PASS')

const mailConfig = defineConfig({
  default: env.get('MAIL_MAILER', 'smtp'),

  /**
   * A static address for the "from" property. It will be
   * used unless an explicit from address is set on the
   * Email
   */
  from: {
    address: env.get('MAIL_FROM_ADDRESS', 'noreply@example.com'),
    name: env.get('MAIL_FROM_NAME', env.get('APP_NAME', 'Adonis Web Kit')),
  },

  /**
   * The mailers object can be used to configure multiple mailers
   * each using a different transport or same transport with different
   * options.
   */
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST', 'localhost'),
      port: env.get('SMTP_PORT', 1025),
      secure: env.get('SMTP_PORT', 1025) === 465,
      ...(smtpUser && smtpPass
        ? {
            auth: {
              type: 'login' as const,
              user: smtpUser,
              pass: smtpPass,
            },
          }
        : {}),
    }),

    mailgun: transports.mailgun({
      key: env.get('MAILGUN_API_KEY', ''),
      domain: env.get('MAILGUN_DOMAIN', ''),
      baseUrl: env.get('MAILGUN_BASE_URL', 'https://api.mailgun.net/v3'),
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
