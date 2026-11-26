import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { uploadThrottle } from '#start/limiter'
import IPermission from '#modules/permissions/interfaces/permission_interface'

const FilesController = () => import('#modules/files/controllers/files_controller')

// The URL identifies its workspace; membership is checked by DownloadFileService
// independently of the active workspace selected in a browser cookie or header.
router
  .get('/api/v1/files/:tenantId/:id/download', [FilesController, 'download'])
  .where('tenantId', /^[0-9]+$/)
  .where('id', /^[0-9]+$/)
  .use([
    middleware.auth(),
    middleware.permission({
      permissions: `${IPermission.Resources.FILES}.${IPermission.Actions.READ}`,
    }),
  ])
  .as('files.download')

router
  .group(() => {
    router
      .get('/', [FilesController, 'list'])
      .use(
        middleware.permission({
          permissions: `${IPermission.Resources.FILES}.${IPermission.Actions.LIST}`,
        })
      )
      .as('files.list')

    router
      .post('/upload', [FilesController, 'upload'])
      .use([
        middleware.permission({
          permissions: `${IPermission.Resources.FILES}.${IPermission.Actions.CREATE}`,
        }),
        uploadThrottle,
      ])
      .as('files.upload')

    router
      .delete('/:id', [FilesController, 'delete'])
      .where('id', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: [
            `${IPermission.Resources.FILES}.${IPermission.Actions.DELETE}`,
            `${IPermission.Resources.FILES}.${IPermission.Actions.DELETE}.${IPermission.Contexts.OWN}`,
          ],
          resourceIdParam: 'id',
        })
      )
      .as('files.delete')
  })
  .use([middleware.auth(), middleware.tenant({ required: true })])
  .prefix('/api/v1/files')
