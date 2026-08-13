import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import type { Page } from 'playwright'

/**
 * Covers the data grid features that no application page turns on: column
 * pinning, resizing, drag-and-drop and column visibility. They are only
 * reachable through `/data-grid-demo`, and without this suite a regression in
 * them type-checks cleanly and ships unnoticed.
 */
async function signIn(page: Page) {
  const user = await UserFactory.merge({ password: 'password123' }).create()

  await page.goto('/login')
  await page.fill('input[name="uid"]', user.email)
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]:has-text("Sign in")')
  await page.waitForURL('**/dashboard', { timeout: 30000 })
}

test.group('Data grid', () => {
  test('should render the grid with every column', async ({ browserContext, assert }) => {
    const page = await browserContext.newPage()
    await signIn(page)
    await page.goto('/data-grid-demo')

    await page.locator('table').waitFor()

    for (const header of ['Server', 'Region', 'Status', 'CPU %', 'Uptime']) {
      await page.locator(`th:has-text("${header}")`).first().waitFor()
    }

    // pageSize is 5
    assert.equal(await page.locator('tbody tr').count(), 5)
    await page.locator('td:has-text("api-gateway")').first().waitFor()
  })

  test('should pin a column using the physical side attribute', async ({
    browserContext,
    assert,
  }) => {
    const page = await browserContext.newPage()
    await signIn(page)
    await page.goto('/data-grid-demo')
    await page.locator('table').waitFor()

    /**
     * v9 reports pinning as the logical 'start'/'end'; the grid's CSS keys off
     * the physical 'left'/'right'. Leaking the logical value here silently
     * kills the sticky-column styling.
     */
    const pinned = page.locator('th[data-pinned]').first()
    await pinned.waitFor()
    assert.equal(await pinned.getAttribute('data-pinned'), 'left')
    assert.equal(await page.locator('th[data-pinned="start"]').count(), 0)
    assert.equal(await page.locator('th[data-pinned="end"]').count(), 0)

    // The pinned column has to actually be sticky for the attribute to matter.
    // `getComputedStyle` runs in the browser; reach it off `globalThis` since
    // this file is type-checked against the backend tsconfig (no DOM lib).
    const position = await pinned.evaluate(
      (el) => (globalThis as any).getComputedStyle(el).position as string
    )
    assert.equal(position, 'sticky')
  })

  test('should expose resize handles on resizable columns', async ({ browserContext, assert }) => {
    const page = await browserContext.newPage()
    await signIn(page)
    await page.goto('/data-grid-demo')
    await page.locator('table').waitFor()

    const handles = page.locator('div.cursor-col-resize')
    assert.isAbove(await handles.count(), 0)

    const header = page.locator('th').first()
    const larguraInicial = (await header.boundingBox())!.width

    await handles.first().hover()
    await page.mouse.down()
    await page.mouse.move(larguraInicial + 120, 10, { steps: 8 })
    await page.mouse.up()

    const larguraFinal = (await header.boundingBox())!.width
    assert.notEqual(Math.round(larguraFinal), Math.round(larguraInicial))
  })

  test('should hide a column through the visibility menu', async ({ browserContext, assert }) => {
    const page = await browserContext.newPage()
    await signIn(page)
    await page.goto('/data-grid-demo')
    await page.locator('table').waitFor()

    assert.equal(await page.locator('th:has-text("Region")').count(), 1)

    await page.click('button:has-text("Columns")')
    await page.locator('[role="menuitemcheckbox"]:has-text("Region")').click()

    await page.locator('th:has-text("Region")').waitFor({ state: 'detached', timeout: 10000 })
    assert.equal(await page.locator('th:has-text("Region")').count(), 0)
  })

  test('should switch between column and row drag modes', async ({ browserContext, assert }) => {
    const page = await browserContext.newPage()
    await signIn(page)
    await page.goto('/data-grid-demo')
    await page.locator('table').waitFor()

    // Both modes mount a different grid component; a crash in either one only
    // shows up at runtime.
    await page.click('button:has-text("Drag rows")')
    await page.locator('button:has-text("Drag columns")').waitFor()
    assert.equal(await page.locator('tbody tr').count(), 5)

    await page.click('button:has-text("Drag columns")')
    await page.locator('button:has-text("Drag rows")').waitFor()
    assert.equal(await page.locator('tbody tr').count(), 5)
  })

  test('should paginate to the next page', async ({ browserContext, assert }) => {
    const page = await browserContext.newPage()
    await signIn(page)
    await page.goto('/data-grid-demo')
    await page.locator('table').waitFor()

    await page.locator('td:has-text("api-gateway")').first().waitFor()

    // The control is icon-only; its accessible name comes from an sr-only span.
    await page.locator('button:has-text("Go to next page")').click()

    // 8 rows, 5 per page -> the second page holds the remaining 3.
    await page.locator('td:has-text("search-indexer")').first().waitFor({ timeout: 10000 })
    assert.equal(await page.locator('tbody tr').count(), 3)
  })
})
