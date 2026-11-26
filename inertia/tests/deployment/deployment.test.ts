// @vitest-environment node
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, posix } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'
import { satisfies, subset } from 'semver'
import dockerignore from '@balena/dockerignore'

const root = new URL('../../../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')
const manifest = JSON.parse(read('package.json'))
const compose = parse(read('docker-compose.yml'))
const dockerfile = read('Dockerfile')
const workdir = dockerfile.match(/^WORKDIR\s+(\S+)/m)![1]
const require = createRequire(import.meta.url)

vi.mock('@adonisjs/core/services/app', () => ({
  default: { makePath: (...parts: string[]) => posix.join(workdir, ...parts) },
}))
vi.mock('#start/env', () => ({
  default: { get: (key: string, fallback?: string) => (key === 'DRIVE_DISK' ? 'fs' : fallback) },
}))

describe('deployment contracts', () => {
  it('mounts the configured filesystem disk in a declared persistent volume', async () => {
    const { default: config } = await import('#config/drive')
    const resolved = await config.resolver({
      tmpPath: (...parts: string[]) => posix.join(workdir, 'tmp', ...parts),
      container: { make: async () => ({}) },
    } as never)
    const disk = resolved.config.services.fs()
    const mounts = (compose.services.app.volumes ?? []).map((mount: string) => {
      const [source, target, mode] = mount.split(':')
      return { source, target, mode }
    })
    const persistent = mounts.find(
      (mount: { target: string }) => mount.target === disk.options.location
    )
    expect(
      persistent,
      `No persistent mount for configured disk ${disk.options.location}`
    ).toBeDefined()
    expect(compose.volumes).toHaveProperty(persistent.source)
    expect(persistent.mode).not.toBe('ro')
  })

  it('pins local, container and CI runtimes to a supported Node 24 release', () => {
    const localVersion = read('.nvmrc').trim().replace(/^v/, '')
    const imageVersion = dockerfile.match(/^ARG NODE_VERSION=(\S+)/m)![1]
    const ci = parse(read('.github/workflows/ci-cd.yml'))
    const setupSteps = Object.values(ci.jobs)
      .flatMap((job: any) => job.steps ?? [])
      .filter((step: any) => step.uses?.startsWith('actions/setup-node@'))
    expect(setupSteps.length).toBeGreaterThan(0)
    const ciVersions = setupSteps.map(
      (step: any) =>
        step.with['node-version'] ?? read(step.with['node-version-file']).trim().replace(/^v/, '')
    )
    for (const version of [localVersion, imageVersion, ...ciVersions]) {
      expect(
        satisfies(version, '>=24.15.0 <25'),
        `${version} lacks the required runtime APIs`
      ).toBe(true)
      expect(satisfies(version, manifest.engines.node)).toBe(true)
      expect(version).toBe(localVersion)
    }
  })

  it('selects GCS versions accepted by the actual Flydrive adapter', () => {
    const driveRequire = createRequire(require.resolve('@adonisjs/drive'))
    const flydriveEntry = driveRequire.resolve('flydrive')
    const flydrive = JSON.parse(
      readFileSync(join(dirname(flydriveEntry), '../package.json'), 'utf8')
    )
    const storage = JSON.parse(read('node_modules/@google-cloud/storage/package.json'))
    const supported = flydrive.peerDependencies['@google-cloud/storage']
    expect(subset(manifest.dependencies['@google-cloud/storage'], supported)).toBe(true)
    expect(satisfies(storage.version, supported)).toBe(true)
  })

  it.each([
    '.env',
    '.env.test',
    '.env.production',
    '.env.local',
    '.env.backup',
    'nested/.env',
    'nested/.env.production',
  ])('excludes %s from the Docker build context', (path) => {
    expect(dockerignore().add(read('.dockerignore')).ignores(path)).toBe(true)
  })

  it('keeps non-secret environment templates and application sources in the build context', () => {
    const ignore = dockerignore().add(read('.dockerignore'))
    expect(ignore.ignores('.env.example')).toBe(false)
    expect(ignore.ignores('app/modules/files/services/file_service.ts')).toBe(false)
  })
})
