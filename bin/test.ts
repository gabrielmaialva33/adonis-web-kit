/*
|--------------------------------------------------------------------------
| Test runner entrypoint
|--------------------------------------------------------------------------
|
| The "test.ts" file is the entrypoint for running tests using Japa.
|
| Either you can run this file directly or use the "test"
| command to run this file and monitor file changes.
|
*/

import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'
import { processCLIArgs } from '@japa/runner'

process.env.NODE_ENV = 'test'
processCLIArgs(process.argv.splice(2))

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)

/**
 * The importer is used to import files in context of the
 * application.
 */
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import('#start/env')
    })
    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
  })
  .testRunner()
  .configure(async (app) => {
    const { plugins, runnerHooks, configureSuite } = await import('../tests/bootstrap.js')
    const { configure } = await import('@japa/runner')

    configure({
      plugins,
      suites: [
        {
          name: 'unit',
          files: ['tests/unit/**/*.spec.ts'],
          timeout: 2000,
        },
        {
          name: 'functional',
          files: ['tests/functional/**/*.spec.ts'],
          timeout: 30_000,
        },
        {
          name: 'browser',
          files: ['tests/browser/**/*.spec.ts'],
          timeout: 60_000,
        },
      ],
      configureSuite,
      setup: runnerHooks.setup,
      teardown: runnerHooks.teardown.concat([() => app.terminate()]),
      forceExit: true,
    })
  })
  .run(async () => {
    const { run } = await import('@japa/runner')
    run()
  })
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
