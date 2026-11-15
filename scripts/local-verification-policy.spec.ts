/** Local test isolation, sandbox preparation, and Git hook checks. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as yaml from 'js-yaml'
import { expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')

function loadWorkflow(path: string): Record<string, unknown> {
  const workflow: unknown = yaml.load(readFileSync(resolve(root, path), 'utf8'))
  if (!isRecord(workflow)) throw new TypeError(`${path} must define a workflow`)
  return workflow
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

it('keeps every Vitest project process-isolated on native Windows', () => {
  const config = readFileSync(resolve(root, 'vitest.config.ts'), 'utf8')

  expect(config).not.toContain("pool: process.platform === 'win32' ? 'threads' : 'forks'")
  expect(config.match(/pool: 'forks'/g)).toHaveLength(2)
})

it('applies the lane test budget inside every Vitest project', () => {
  // Each inline project spreads coverageTestTimeoutOptions, the only route
  // for DSH_COVERAGE_TEST_TIMEOUT_MS into projects; the behavior itself is
  // pinned by scripts/lane-test-budget.spec.ts.
  const config = readFileSync(resolve(root, 'vitest.config.ts'), 'utf8')

  expect(config).toContain('const laneTestBudget = coverageTestTimeoutOptions(process.env[COVERAGE_TEST_TIMEOUT_ENV])')
  expect(config.match(/^ {10}\.\.\.laneTestBudget,$/gm)).toHaveLength(2)
})

it('pins bubblewrap to a recorded Launchpad build and excludes Ubuntu pool downloads', () => {
  const script = readFileSync(resolve(root, 'scripts/prepare-ci-bubblewrap.sh'), 'utf8')
  const url = /^readonly BUBBLEWRAP_URL="([^"]+)"$/mu.exec(script)?.[1]

  expect(url).toMatch(
    /^https:\/\/launchpad\.net\/ubuntu\/\+source\/bubblewrap\/[^/]+\/\+build\/\d+\/\+files\/bubblewrap_[^/]+_amd64\.deb$/u,
  )
  // Ubuntu removes superseded versions from its live package pool.
  expect(script).not.toMatch(/https?:\/\/[^/'"\s]+\/ubuntu(?:-ports)?\/pool\//u)
})

it('leaves frozen Agent Note sidecars to the archive verifier', () => {
  const lefthook = loadWorkflow('lefthook.yml')

  for (const hookName of ['pre-commit', 'pre-merge-commit']) {
    const hook = lefthook[hookName]
    if (!isRecord(hook) || !Array.isArray(hook.jobs)) {
      throw new TypeError(`lefthook must define ${hookName} jobs`)
    }
    const pairing: unknown = hook.jobs.find(
      (job: unknown) => isRecord(job) && job.name === 'translation pairing (staged records)',
    )

    expect(pairing).toMatchObject({ exclude: ['.agents/notes/archived/**'] })
  }
})
