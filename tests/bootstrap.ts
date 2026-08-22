import { mkdir } from 'node:fs/promises'

import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import { browserClient } from '@japa/browser-client'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import testUtils from '@adonisjs/core/services/test_utils'
import redis from '@adonisjs/redis/services/main'
import { authApiClient } from '@adonisjs/auth/plugins/api_client'
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'
import { shieldApiClient } from '@adonisjs/shield/plugins/api_client'

import env from '#start/env'

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [
  assert(),
  apiClient({
    baseURL: `http://${env.get('HOST')}:${env.get('PORT')}`,
  }),
  browserClient({
    runInSuites: ['browser'],
  }),
  pluginAdonisJS(app),
  authApiClient(app),
  sessionApiClient(app),
  shieldApiClient(),
]

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executed after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    async () => {
      await mkdir(app.tmpPath(), { recursive: true })
    },
    () => testUtils.db().migrate(),
    () => testUtils.db().seed(),
  ],
  teardown: [],
}

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    const clearRedis = async () => {
      await redis.flushdb()
    }

    suite.onTest((test) => {
      test.setup(clearRedis)
    })
    suite.onGroup((group) => {
      group.each.setup(clearRedis)
    })
    suite.setup(() => testUtils.httpServer().start())
  }
}
