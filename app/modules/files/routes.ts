import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { uploadThrottle } from '#start/limiter'
import IPermission from '#modules/permissions/interfaces/permission_interface'

const FilesController = () => import('#modules/files/controllers/files_controller')

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
