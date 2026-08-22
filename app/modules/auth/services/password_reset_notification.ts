import { BaseMail } from '@adonisjs/mail'
import type { DateTime } from 'luxon'

import type User from '#modules/users/models/user'
import env from '#start/env'

export default class PasswordResetNotification extends BaseMail {
  subject = 'Reset your password'

  constructor(
    private user: User,
    private token: string,
    private expiresAt: DateTime
  ) {
    super()
  }

  getResetToken() {
    return this.token
  }

  prepare() {
    const appName = env.get('MAIL_FROM_NAME', env.get('APP_NAME', 'Adonis Web Kit'))
    const resetUrl = `${env.get('APP_URL', 'http://localhost:3333')}/reset-password?token=${encodeURIComponent(this.token)}`
    const expiresInMinutes = Math.max(1, Math.ceil(this.expiresAt.diffNow('minutes').minutes))

    this.message.from(env.get('MAIL_FROM_ADDRESS', 'noreply@example.com'), appName)
    this.message.to(this.user.email, this.user.full_name)

    if (env.get('NODE_ENV') === 'test') {
      this.message.html(`
        <h1>Reset your password</h1>
        <p>Hi ${this.user.full_name},</p>
        <p>Use the link below to choose a new password:</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>This link expires in ${expiresInMinutes} minutes.</p>
      `)
      this.message.text(`
        Hi ${this.user.full_name},

        Reset your password using this URL:
        ${resetUrl}

        This link expires in ${expiresInMinutes} minutes.
      `)
      return
    }

    this.message.htmlView('emails/password_reset_html', {
      user: this.user,
      resetUrl,
      appName,
      expiresInMinutes,
    })
    this.message.textView('emails/password_reset_text', {
      user: this.user,
      resetUrl,
      appName,
      expiresInMinutes,
    })
  }
}
