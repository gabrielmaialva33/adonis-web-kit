import { test } from '@japa/runner'
import limiter from '@adonisjs/limiter/services/main'
import db from '@adonisjs/lucid/services/db'

// A valid 254-character address: each domain label is within the 63-character limit.
const email = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(57)}.com`
const otherEmail = `z${email.slice(1)}`

test.group('Database-backed identity throttles', (group) => {
  group.each.setup(() => {
    const previousStore = limiter.config.default
    limiter.config.default = 'database'
    return async () => {
      limiter.config.default = previousStore
      await limiter.clear(['database'])
    }
  })

  test('long login identities retain a shared normalized budget and distinct identities stay separate', async ({
    client,
    assert,
  }) => {
    assert.lengthOf(email, 254)
    for (let attempt = 0; attempt < 5; attempt++) {
      const uid = attempt % 2 ? ` ${email.toUpperCase()} ` : email
      const response = await client
        .post('/api/v1/sessions/sign-in')
        .json({ uid, password: 'wrong-password' })
      response.assertStatus(400)
    }

    const blocked = await client
      .post('/api/v1/sessions/sign-in')
      .json({ uid: email, password: 'wrong-password' })
    blocked.assertStatus(429)
    assert.isAbove(Number(blocked.header('retry-after')), 1700)

    const distinct = await client
      .post('/api/v1/sessions/sign-in')
      .json({ uid: otherEmail, password: 'wrong-password' })
    distinct.assertStatus(400)

    const anotherIp = await client
      .post('/api/v1/sessions/sign-in')
      .header('X-Forwarded-For', '203.0.113.7')
      .json({ uid: email, password: 'wrong-password' })
    anotherIp.assertStatus(400)

    // Reset requests have their own budget even for a blocked login identity.
    const reset = await client.post('/api/v1/sessions/forgot-password').json({ email })
    reset.assertStatus(202)

    const rows = await db.from('rate_limits').select('key')
    assert.isNotEmpty(rows)
    for (const row of rows) {
      assert.isAtMost(row.key.length, 255)
      assert.notInclude(row.key, email)
    }
  })

  test('long reset emails retain a shared normalized budget and distinct identities stay separate', async ({
    client,
    assert,
  }) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const identity = attempt % 2 ? ` ${email.toUpperCase()} ` : email
      const response = await client
        .post('/api/v1/sessions/forgot-password')
        .json({ email: identity })
      response.assertStatus(202)
    }

    const blocked = await client.post('/api/v1/sessions/forgot-password').json({ email })
    blocked.assertStatus(429)
    assert.isAbove(Number(blocked.header('retry-after')), 1700)

    const distinct = await client
      .post('/api/v1/sessions/forgot-password')
      .json({ email: otherEmail })
    distinct.assertStatus(202)

    const anotherIp = await client
      .post('/api/v1/sessions/forgot-password')
      .header('X-Forwarded-For', '203.0.113.7')
      .json({ email })
    anotherIp.assertStatus(202)

    const rows = await db.from('rate_limits').select('key')
    assert.lengthOf(rows, 3)
    for (const row of rows) {
      assert.isAtMost(row.key.length, 255)
      assert.notInclude(row.key, email)
    }
  })

  for (const scenario of [
    { path: '/version', status: 200 },
    { path: '/api/v1/sessions/sign-in', status: 400 },
    { path: '/api/v1/sessions/forgot-password', status: 202 },
    { path: '/api/v1/sessions/reset-password', status: 422 },
    { path: '/api/v1/sessions/refresh', status: 422 },
  ]) {
    test(`oversized forwarded addresses cannot overflow the database key at ${scenario.path}`, async ({
      client,
      assert,
    }) => {
      // Loopback is a trusted proxy by default, and proxy-addr returns this final
      // forwarded value without checking that it is a syntactically valid IP.
      const forwardedAddress = 'x'.repeat(1024)
      const request =
        scenario.path === '/version' ? client.get(scenario.path) : client.post(scenario.path)
      const response = await request
        .header('Accept', 'application/json')
        .header('X-Forwarded-For', forwardedAddress)
        .json({ uid: email, email, password: 'wrong-password' })
      response.assertStatus(scenario.status)

      const rows = await db.from('rate_limits').select('key')
      assert.isNotEmpty(rows)
      for (const row of rows) {
        assert.isAtMost(row.key.length, 255)
        assert.notInclude(row.key, forwardedAddress)
      }
    })
  }
})
