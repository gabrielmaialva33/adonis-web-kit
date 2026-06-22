import env from '#start/env'
import { defineConfig, drivers } from '@adonisjs/core/encryption'

export default defineConfig({
  default: 'aes256gcm',
  list: {
    aes256gcm: drivers.aes256gcm({
      id: 'aes256gcm',
      keys: [env.get('APP_KEY')],
    }),
  },
})
