/** Diagnostics preserve compiler locations and unknown loader failures. */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { Context } from '@deepseek-ai/cordis'
import { expect, it, onTestFinished, vi } from 'vitest'
import { handleError } from '../src/error.ts'

it.each([null, 'failure', {}, { errors: null }, { errors: [null] }, { errors: [7] }, { errors: [{}] }, { errors: [{ text: 7 }] }])
('forwards an unrecognized error without dropping its diagnostic: %j', async (error) => {
  const ctx = new Context()
  onTestFinished(() => ctx.fiber.dispose())
  const warn = vi.spyOn(ctx.logger, 'warn')
  handleError(ctx, error)
  expect(warn).toHaveBeenCalledWith(error)
})

it('formats compiler source locations and reports unavailable source files', async () => {
  const root = mkdtempSync(join(tmpdir(), 'dsh-hmr-diagnostics-'))
  const file = join(root, 'broken.ts')
  writeFileSync(file, 'const broken = ;\n')
  const ctx = new Context()
  onTestFinished(async () => { await ctx.fiber.dispose(); rmSync(root, { recursive: true, force: true }) })
  const warn = vi.spyOn(ctx.logger, 'warn')
  handleError(ctx, { errors: [
    { text: 'without location' },
    { text: 'unexpected token', location: { file, line: 1, column: 15 } },
    { text: 'source disappeared', location: { file: join(root, 'missing.ts'), line: 1, column: 1 } },
  ] })
  expect(warn).toHaveBeenCalledWith('without location')
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('unexpected token'))
  const diagnostic = warn.mock.calls.map(([message]) => typeof message === 'string' ? stripVTControlCharacters(message) : '').join('\n')
  expect(diagnostic).toContain(`File: ${file}:1:15`)
  expect(diagnostic).toContain('> 1 | const broken = ;')
  expect(diagnostic).toMatch(/\|\s+\^ unexpected token/u)
  expect(warn).toHaveBeenCalledWith(expect.objectContaining({ code: 'ENOENT' }))
})
