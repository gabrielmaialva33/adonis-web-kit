import { test } from '@japa/runner'

test.group('Health check', () => {
  test('should return ok status', async ({ client }) => {
    const response = await client.get('/api/v1/health')

    response.assertStatus(200)
    response.assertBodyContains({ healthy: true })
  })

  test('should include required fields in response', async ({ client, assert }) => {
    const response = await client.get('/api/v1/health')

    response.assertStatus(200)
    assert.properties(response.body(), ['healthy', 'services', 'checks'])

    // Check that services object exists and has database key
    assert.properties(response.body().services, ['database'])
    assert.properties(response.body().services.database, ['healthy'])
  })

  test('should report every registered check', async ({ client, assert }) => {
    const response = await client.get('/api/v1/health')

    response.assertStatus(200)

    const checks = response.body().checks
    assert.isArray(checks)
    assert.isNotEmpty(checks)

    // A failing check has to be identifiable from the payload alone, otherwise
    // a 503 says nothing about what actually broke.
    for (const check of checks) {
      assert.properties(check, ['name', 'status', 'message'])
    }
    assert.includeMembers(
      checks.map((check: { name: string }) => check.name),
      ['Memory RSS check', 'Database health check (postgres)']
    )
  })

  test('should be accessible without authentication', async ({ client }) => {
    const response = await client.get('/api/v1/health')

    response.assertStatus(200)
  })
})
