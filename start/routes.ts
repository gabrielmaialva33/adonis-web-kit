/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { throttle } from '#start/limiter'

import router from '@adonisjs/core/services/router'

import '#modules/auth/routes'
import '#modules/users/routes'
import '#modules/roles/routes'
import '#modules/permissions/routes'
import '#modules/files/routes'
import '#modules/tenants/routes'
import '#modules/health/routes'

import '#modules/web/routes'

const docsDirectory = join(process.cwd(), 'docs')

router
  .get('/docs', async ({ response }) => {
    const html = await readFile(join(docsDirectory, 'redoc.html'), 'utf-8')
    response.header('content-type', 'text/html; charset=utf-8')
    return response.send(html)
  })
  .as('docs.index')
  .use(throttle)

router
  .get('/docs/openapi.yaml', async ({ response }) => {
    const specification = await readFile(join(docsDirectory, 'openapi.yaml'), 'utf-8')
    return response.type('yaml', 'utf-8').send(specification)
  })
  .as('docs.openapi')
  .use(throttle)

router
  .get('/version', async () => {
    const packageJsonPath = join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
    return {
      name: packageJson.name,
      description: packageJson.description,
      version: packageJson.version,
      author: packageJson.author,
      contributors: packageJson.contributors,
    }
  })
  .use(throttle)
