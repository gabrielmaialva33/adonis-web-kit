/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Routes for the JSON API
|
*/

import router from '@adonisjs/core/services/router'

const SessionsController = () => import('#controllers/user/sessions_controller')

router
  .group(() => {
    router.post('/sessions/sign-in', [SessionsController, 'signIn'])
    router.post('/sessions/sign-up', [SessionsController, 'signUp'])
  })
  .prefix('/v1')
