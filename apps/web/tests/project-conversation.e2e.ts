/** Keyless project conversation and task evidence through the shipped Web composition. */
import { mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, type Locator, type Page } from 'playwright'
import { expect, it, onTestFinished, vi } from 'vitest'
import { LlmAdapter, LlmError, ReasoningEffortId, ToolCallId, type GenerateOptions, type StreamChunk } from '@deepseek-ai/dsh-llm'
import { launchWebScaffold, type WebScaffold } from './scaffold.ts'
import { connectFreshWorkspace, newEnglishPage, writeComposerDraft } from './support.ts'

const PROVIDER = 'panoptic-project-test'
const MODEL = 'scripted'
const NOTE = 'Panoptic keeps one conversation per project.\n'

const turns = [
  'I can answer this in the project conversation.',
  { name: 'write', args: { file_path: 'project-note.txt', content: NOTE } },
  'The project note is saved.',
  { name: 'project_plan', args: {
    goal: 'Review project notes', constraints: ['Keep the note unchanged'],
    steps: [
      { title: 'Read the note', acceptance: 'Confirm the introduction' },
      { title: 'Summarize the note', acceptance: 'Report its scope' },
    ],
  } },
  { name: 'read', args: { file_path: 'project-note.txt' } },
  { name: 'project_verify', args: { revision: 1, step: 0 } },
  'The first task has inspection evidence. The summary is still open.',
  { name: 'write', args: { file_path: 'project-note.txt', content: NOTE } },
  'The reopened project still has the same plan.',
  'I can continue from that project node.',
  { error: new LlmError('Fixture provider credential diagnostic', 'MISSING_CREDENTIAL') },
] as const

/** Scripted model transport; every response goes through the ordinary Agent loop. */
class ProjectAdapter extends LlmAdapter {
  readonly requests: GenerateOptions[] = []

  override async listModels(provider: string) {
    return [
      { provider, id: MODEL, name: MODEL },
      { provider, id: 'alternate', name: 'Alternate model' },
      ...Array.from({ length: 20 }, (_, index) => ({ provider, id: `${MODEL}-${index}`, name: `${MODEL} ${index}` })),
    ]
  }

  override async resolveModel(provider: string, model: string) {
    if (model !== MODEL) return super.resolveModel(provider, model)
    return {
      provider, id: model, name: model,
      reasoning: {
        defaultEffort: ReasoningEffortId('low'),
        efforts: [{ id: ReasoningEffortId('low'), name: 'Low' }, { id: ReasoningEffortId('high'), name: 'High' }],
      },
    }
  }

  override async *stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    this.requests.push(options)
    const next = turns[this.requests.length - 1]
    if (next === undefined) throw new Error('unexpected model request in project scenario')
    if (typeof next !== 'string' && 'error' in next) throw next.error
    if (typeof next === 'string') {
      yield { type: 'block-start', index: 0, blockType: 'text' }
      yield { type: 'block-end', index: 0, block: { type: 'text', text: next } }
      yield { type: 'finish', reason: { kind: 'stop' } }
      return
    }
    const id = ToolCallId(`project-${String(this.requests.length)}`)
    const args = JSON.stringify(next.args)
    yield { type: 'block-start', index: 0, blockType: 'tool-call' }
    yield { type: 'tool-call-delta', index: 0, id, name: next.name, argumentsDelta: args }
    yield { type: 'block-end', index: 0, block: { type: 'tool-call', id, name: next.name, arguments: args } }
    yield { type: 'finish', reason: { kind: 'tool-calls' } }
  }
}

async function submit(page: Page, scaffold: WebScaffold, text: string) {
  const input = page.locator('[data-composer-input][contenteditable="true"]').first()
  const settled = scaffold.whenTurnSettled()
  await writeComposerDraft(page, input, text)
  await input.press('Enter')
  return await settled
}

async function openProject(page: Page): Promise<void> {
  const row = page.getByRole('treeitem').filter({ hasText: 'project-one' }).first()
  await row.hover()
  await row.getByRole('button', { name: 'Workspace actions for project-one' }).click()
  await page.getByRole('menuitem', { name: 'Open project conversation', exact: true }).click()
}

async function graphNodePoint(node: Locator): Promise<{ x: number; y: number }> {
  const core = node.locator('circle').last()
  await core.waitFor()
  const bounds = await core.boundingBox()
  if (bounds === null) throw new Error('expected a graph node inside the viewport')
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
}

it('reuses the project conversation across Host boots and reconciles a missing write receipt', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'panoptic-project-recovery-'))
  onTestFinished(() => rm(directory, { recursive: true, force: true }))
  const world = { workspaceCwd: join(directory, 'workspace'), persistenceRoot: join(directory, 'sessions') }
  await mkdir(world.workspaceCwd)
  await mkdir(world.persistenceRoot)
  const adapter = new ProjectAdapter()
  const boot = async (): Promise<WebScaffold> => {
    const host = await launchWebScaffold({ world })
    host.ctx.effect(() => host.ctx.llm.registerAdapter([PROVIDER], adapter))
    await host.ctx.agentDefaultModel.saveSelection({ provider: PROVIDER, model: MODEL })
    return host
  }
  const scaffold = await boot()
  let closed = false
  try {
    const browser = await chromium.launch()
    try {
      const page = await newEnglishPage(browser)
      await page.goto(scaffold.authenticatedUrl)
      await connectFreshWorkspace(page, scaffold.workspaceCwd, 'project-one')
      const workspace = await scaffold.ctx.workspaceRegistry.resolveByPath(join(scaffold.workspaceCwd, 'project-one'))
      if (workspace === undefined) throw new Error('project workspace was not registered')
      await openProject(page)
      await expect.poll(() => scaffold.ctx.agents.list().find(agent =>
        scaffold.ctx.workspaceRegistry.projects.ownerOf(agent.id) === workspace.id)?.id).toBeDefined()
      const request = { workspaceId: workspace.id, projectConversation: true } as const
      const [first, duplicate] = await Promise.all([
        scaffold.ctx.sessionController.create(request), scaffold.ctx.sessionController.create(request),
      ])
      expect(duplicate.sessionId).toBe(first.sessionId)

      expect(await submit(page, scaffold, 'What can I do here?')).toBe(first.sessionId)
      expect(scaffold.ctx.workspaceRegistry.projects.context(workspace.id).plan).toBeUndefined()
      expect(JSON.stringify(adapter.requests[0]?.messages)).toContain('Use the lightest route')

      expect(await submit(page, scaffold, 'Add a one-line project note.')).toBe(first.sessionId)
      expect(await readFile(join(workspace.path, 'project-note.txt'), 'utf8')).toBe(NOTE)
      expect(scaffold.ctx.workspaceRegistry.projects.context(workspace.id).plan).toBeUndefined()

      expect(await submit(page, scaffold, 'Plan a review of the note, then read its introduction.')).toBe(first.sessionId)
      const plan = scaffold.ctx.workspaceRegistry.projects.context(workspace.id).plan
      expect(plan).toMatchObject({ revision: 1, goal: 'Review project notes', steps: [{ evidence: { tool: 'read' } }, {}] })

      const sha256 = createHash('sha256').update(NOTE).digest('hex')
      const filePath = join(workspace.path, 'project-note.txt')
      const writtenAt = (await stat(filePath)).mtimeMs
      await scaffold.ctx.workspaceRegistry.projects.begin(workspace.id, {
        id: 'interrupted-before-receipt', tool: 'write', argsHash: sha256,
        expectedFile: { path: filePath, sha256, bytes: Buffer.byteLength(NOTE) },
      })
      closed = true
      await scaffold.close()
      const restarted = await boot()
      try {
        await page.goto(restarted.authenticatedUrl)
        await openProject(page)
        await expect.poll(() => restarted.ctx.agents.get(first.sessionId)?.id).toBe(first.sessionId)
        expect(await submit(page, restarted, 'What is still open?')).toBe(first.sessionId)
        expect(restarted.ctx.workspaceRegistry.projects.pending(workspace.id)).toEqual([])
        expect(await readFile(filePath, 'utf8')).toBe(NOTE)
        expect((await stat(filePath)).mtimeMs).toBe(writtenAt)
        using observation = await restarted.ctx.sessionQuery.observeSession(first.sessionId)
        expect(observation.events.some(event => event.type === 'tool/result'
          && event.data.error?.code === 'PROJECT_WRITE_ALREADY_VERIFIED')).toBe(true)
        expect(JSON.stringify(adapter.requests.at(-1)?.messages)).toContain('Keep the note unchanged')
        expect(JSON.stringify(adapter.requests.at(-1)?.messages)).toContain('verified-file')
        expect(restarted.ctx.workspaceRegistry.projects.context(workspace.id).plan).toEqual(plan)
      } finally {
        await restarted.close()
      }
    } finally {
      await browser.close()
    }
  } finally {
    if (!closed) await scaffold.close()
  }
}, 90_000)

it('previews a project node, opens its read-only history, and sends a reference from the main composer', async () => {
  const scaffold = await launchWebScaffold({ panoptic: true })
  onTestFinished(() => scaffold.close())
  const projectDir = join(scaffold.workspaceCwd, 'sample-project')
  await mkdir(projectDir)
  const workspace = await scaffold.ctx.workspaceRegistry.create(projectDir)
  const projects = scaffold.ctx.workspaceRegistry.projects
  const adapter = new ProjectAdapter()
  scaffold.ctx.effect(() => scaffold.ctx.llm.registerAdapter([PROVIDER], adapter))
  await scaffold.ctx.agentDefaultModel.saveSelection({ provider: PROVIDER, model: MODEL })
  const browser = await chromium.launch()
  try {
    const page = await newEnglishPage(browser, 820)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    let catalogRequests = 0
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/session/modelCatalog') catalogRequests++
    })
    const failures: string[] = []
    page.on('console', (message) => { if (message.type() === 'warning' || message.type() === 'error') failures.push(message.text().split('\n')[0] ?? '') })
    page.on('pageerror', (error) => { failures.push(error.message) })
    await page.goto(scaffold.authenticatedUrl)
    await page.getByRole('main', { name: 'Project graph', exact: true }).waitFor()
    const panel = page.locator('[data-project-home]')
    const history = panel.locator('[data-project-history]')
    const composer = panel.locator('[data-composer-input]').first()
    await composer.waitFor()
    const logo = page.locator('img[src*="panoptic-logo"]').first()
    expect((await logo.boundingBox())?.width).toBeGreaterThan(30)
    const composerSeat = panel.locator('[data-composer-seat]')
    const resizeHandle = panel.locator('[data-width-handle="left"]')
    const [seatBox, handleBox] = await Promise.all([composerSeat.boundingBox(), resizeHandle.boundingBox()])
    if (seatBox === null || handleBox === null) throw new Error('expected a composer and its width handle')
    expect(handleBox.y).toBeGreaterThanOrEqual(seatBox.y)
    expect(handleBox.y + handleBox.height).toBeLessThanOrEqual(seatBox.y + seatBox.height)
    expect(await history.isVisible()).toBe(false)
    const modelPicker = panel.getByRole('button', { name: /^Select model, current/ })
    expect(await modelPicker.getAttribute('aria-haspopup')).toBe('menu')
    expect(await modelPicker.evaluate(element => getComputedStyle(element).fontWeight)).toBe('400')
    const modelMenu = page.getByRole('menu', { name: 'Model and reasoning effort', exact: true })
    const modelPane = page.getByRole('group', { name: 'Model and reasoning effort', exact: true })
    const modelList = modelPane.getByRole('menu', { name: 'Model', exact: true })
    const modelSearch = modelPane.getByRole('searchbox')
    const modelEntry = modelMenu.getByRole('menuitem', { name: /^Model\b/ })
    const effortEntry = modelMenu.getByRole('menuitem', { name: /^Effort\b/ })

    await modelPicker.click()
    await modelEntry.click()
    const modelRow = modelList.getByRole('menuitemradio', { name: MODEL, exact: true, checked: true })
    await modelRow.waitFor()
    expect(await modelRow.getAttribute('title')).toBe(MODEL)
    await modelSearch.fill('Alternate')
    await modelList.getByRole('menuitemradio', { name: 'Alternate model', exact: true }).click()
    await modelPane.waitFor({ state: 'hidden' })
    await panel.getByRole('button', { name: /current.*Alternate model/ }).waitFor()

    await modelPicker.click()
    await modelEntry.click()
    await modelSearch.fill(MODEL)
    await modelList.getByRole('menuitemradio', { name: MODEL, exact: true }).click()
    await modelPane.waitFor({ state: 'hidden' })
    await panel.getByRole('button', { name: /current.*Low/ }).waitFor()

    await modelPicker.click()
    await effortEntry.click()
    const lowEffort = modelMenu.getByRole('menuitemradio', { name: 'Low', exact: true, checked: true })
    const highEffort = modelMenu.getByRole('menuitemradio', { name: 'High', exact: true })
    await lowEffort.waitFor()
    const [lowBounds, highBounds] = await Promise.all([lowEffort.boundingBox(), highEffort.boundingBox()])
    if (lowBounds === null || highBounds === null) throw new Error('expected two visible effort levels')
    expect(highBounds.y).toBeGreaterThan(lowBounds.y)
    expect(highBounds.x).toBe(lowBounds.x)
    expect(catalogRequests).toBeGreaterThan(0)
    const loadedCatalogs = catalogRequests
    await highEffort.click()
    await modelMenu.waitFor({ state: 'hidden' })
    await panel.getByRole('button', { name: /current.*High/ }).waitFor()
    await expect.poll(() => scaffold.ctx.agentDefaultModel.currentSelection().reasoningEffort).toBe('high')
    expect(catalogRequests).toBe(loadedCatalogs)
    await expect.poll(() => modelPicker.evaluate(element => element === document.activeElement)).toBe(true)

    await modelPicker.click()
    await effortEntry.click()
    await modelMenu.getByRole('menuitemradio', { name: 'High', exact: true, checked: true }).waitFor()
    await page.keyboard.press('Escape')
    await effortEntry.waitFor()
    await page.keyboard.press('Escape')
    await modelMenu.waitFor({ state: 'hidden' })
    const openRightbar = page.getByRole('button', { name: 'Open right sidebar', exact: true })
    await openRightbar.click()
    const rightDock = page.locator('[data-sidebar-right-open] :is([data-dockkit-host="dock"], [data-dockkit-empty])').first()
    await rightDock.waitFor()
    expect(await rightDock.evaluate((element) => {
      const style = getComputedStyle(element)
      return { property: style.transitionProperty, duration: style.transitionDuration,
        leftSidebarTiming: element.closest('[data-sidebar-animating]') !== null }
    })).toEqual({ property: 'transform', duration: '0.3s', leftSidebarTiming: false })
    await page.getByRole('button', { name: 'Collapse right sidebar', exact: true }).click()
    await openRightbar.waitFor()
    const sessionId = await submit(page, scaffold, 'What can I do here?')
    expect(projects.ownerOf(sessionId)).toBe(workspace.id)
    expect(await submit(page, scaffold, 'Add a one-line project note.')).toBe(sessionId)
    expect(await submit(page, scaffold, 'Plan a review of the note, then read its introduction.')).toBe(sessionId)
    expect(await submit(page, scaffold, `What is still open? ${'Keep this note in the project conversation. '.repeat(55)}`)).toBe(sessionId)
    expect(await panel.getByRole('button', { name: 'Conversation history', exact: true }).count()).toBe(0)
    try {
      await expect.poll(() => page.locator('svg [data-graph-node="task"]').count(), { timeout: 10_000 }).toBe(2)
    } catch (error) {
      throw new Error(`${await panel.innerText()}\n${failures.join('\n')}`, { cause: error })
    }
    const chart = page.locator('svg[aria-label="Project graph with pan and zoom controls"]')
    const task = chart.getByRole('button', { name: 'Task · Read the note' })
    const taskPoint = await graphNodePoint(task)
    await page.mouse.move(taskPoint.x, taskPoint.y)
    const preview = panel.getByRole('tooltip')
    await preview.getByText('Confirm the introduction', { exact: true }).waitFor()
    await preview.getByText('Evidence recorded', { exact: true }).waitFor()
    expect(await history.isVisible()).toBe(false)
    await page.mouse.click(taskPoint.x, taskPoint.y)
    await history.getByText('The first task has inspection evidence. The summary is still open.', { exact: true }).waitFor()
    expect(await composer.isVisible()).toBe(false)
    const nodeGraph = panel.getByRole('main', { name: 'Project graph', exact: true })
    await nodeGraph.getByText('Read the note', { exact: true }).filter({ visible: true }).waitFor()
    const nodeBack = panel.getByRole('button', { name: 'Back to graph', exact: true })
    const toolbarStyles = await nodeBack.evaluate((element) => {
      const style = getComputedStyle(element)
      return [style.border, style.borderRadius, style.padding, style.height]
    })
    await page.getByRole('button', { name: 'Projects', exact: true }).click()
    const shelfBack = page.getByRole('button', { name: 'Back to workspace', exact: true })
    await expect.poll(() => shelfBack.evaluate((element) => {
      const style = getComputedStyle(element)
      return [style.border, style.borderRadius, style.padding, style.height]
    })).toEqual(toolbarStyles)
    await shelfBack.click()
    await nodeGraph.getByText('Read the note', { exact: true }).filter({ visible: true }).waitFor()
    await nodeGraph.getByRole('button', { name: 'Reference node', exact: true }).waitFor()
    await history.getByText('The first task has inspection evidence. The summary is still open.', { exact: true }).waitFor()
    const dismissHistory = panel.getByRole('button', { name: 'Back to graph', exact: true })
    const turnThree = history.getByRole('button', { name: 'Jump to turn 3', exact: true })
    await expect.poll(() => turnThree.getAttribute('aria-current')).toBe('true')
    const turnFour = history.getByRole('button', { name: 'Jump to turn 4', exact: true })
    await turnFour.click()
    await expect.poll(() => turnFour.getAttribute('aria-current')).toBe('true')
    await dismissHistory.click()
    const evidence = chart.getByRole('button', { name: 'Evidence · Evidence' })
    const evidencePoint = await graphNodePoint(evidence)
    await page.mouse.move(evidencePoint.x, evidencePoint.y)
    await preview.getByText(/^Conversation record #\d+$/).waitFor()
    await page.mouse.click(evidencePoint.x, evidencePoint.y)
    await expect.poll(() => turnThree.getAttribute('aria-current')).toBe('true')
    await dismissHistory.click()
    await writeComposerDraft(page, composer, 'Tell me what to do next.')
    await page.mouse.click(taskPoint.x, taskPoint.y)
    await panel.getByRole('button', { name: 'Reference node', exact: true }).click()
    await composer.locator('[data-composer-quote]').getByText('Project graph node · Task · Read the note', { exact: false }).waitFor()
    expect(await composer.innerText()).toContain('Tell me what to do next.')
    const quoted = scaffold.whenTurnSettled()
    await composer.press('Enter')
    expect(await quoted).toBe(sessionId)
    expect(JSON.stringify(adapter.requests.at(-1)?.messages)).toContain('Project graph node · Task · Read the note')
    const settingsRow = page.locator('[data-project-settings]')
    const zoom = settingsRow.getByRole('group', { name: 'Graph zoom', exact: true })
    const [settingsBox, zoomBox] = await Promise.all([
      settingsRow.locator('[data-slot="sidebar.settings"] button').first().boundingBox(), zoom.boundingBox(),
    ])
    expect(zoomBox?.x).toBeGreaterThan((settingsBox?.x ?? 0) + (settingsBox?.width ?? 0) - 2)
    await zoom.getByRole('button', { name: 'Zoom in' }).click()
    await zoom.getByRole('button', { name: 'Reset view' }).filter({ hasText: '120%' }).waitFor()
    await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click()
    await zoom.waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: 'Open sidebar', exact: true }).click()
    await zoom.getByRole('button', { name: 'Reset view' }).filter({ hasText: '120%' }).waitFor()
    await page.locator('[data-animating]').waitFor({ state: 'hidden' })
    const ambient = page.locator('[class*="centerCol"]').first()
    expect(await ambient.evaluate(element => getComputedStyle(element, '::before').content)).toBe('none')
    expect(await ambient.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)')
    expect(await ambient.evaluate(element => getComputedStyle(element).marginTop)).toBe('0px')
    await chart.focus()
    expect(await chart.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('none')
    await expect.poll(() => scaffold.ctx.agents.get(sessionId)?.id).toBe(sessionId)
    const [mainBounds, canvasBounds, composerBounds] = await Promise.all([panel.boundingBox(), chart.boundingBox(), composer.boundingBox()])
    if (mainBounds === null || canvasBounds === null || composerBounds === null) throw new Error('expected all main-region geometry')
    expect(canvasBounds.width).toBeGreaterThan(mainBounds.width - 18)
    expect(composerBounds.y).toBeGreaterThan(canvasBounds.y + canvasBounds.height - 6)
    expect(composerBounds.width).toBeGreaterThan(660)
    expect(Math.abs(composerBounds.x + composerBounds.width / 2 - (mainBounds.x + mainBounds.width / 2))).toBeLessThan(10)
    const ripple = panel.locator('[data-project-ripple]')
    const hoverX = canvasBounds.x + canvasBounds.width * 0.35
    const hoverY = canvasBounds.y + canvasBounds.height * 0.45
    await page.mouse.move(hoverX, hoverY)
    await expect.poll(() => ripple.getAttribute('data-ripple-active'), { timeout: 8000 }).toBe('true')
    expect(await chart.evaluate(element => getComputedStyle(element).opacity)).toBe('0')
    await page.mouse.move(2, 2)
    await expect.poll(() => ripple.getAttribute('data-ripple-active')).toBeNull()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.mouse.move(hoverX, hoverY)
    expect(await ripple.getAttribute('data-ripple-active')).toBeNull()
    expect(await chart.evaluate(element => getComputedStyle(element).opacity)).toBe('1')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    expect(await submit(page, scaffold, 'Check the configured model.')).toBe(sessionId)
    const rootPoint = await graphNodePoint(chart.getByRole('button', { name: 'Project · sample-project', exact: true }))
    await page.mouse.click(rootPoint.x, rootPoint.y)
    await history.getByText('The selected model has no API key.', { exact: true }).waitFor()
    await history.getByText(/Configure the provider under Settings → Models/).waitFor()
    const errorDialog = page.getByRole('dialog', { name: 'Error details', exact: true })
    expect(await errorDialog.isVisible()).toBe(false)
    await history.getByRole('button', { name: 'Error details', exact: true }).click()
    await errorDialog.getByText('MISSING_CREDENTIAL', { exact: true }).waitFor()
    expect(await page.getByText('Fixture provider credential diagnostic', { exact: true }).count()).toBe(0)
    await errorDialog.getByRole('button', { name: 'Close error details', exact: true }).click()
    await errorDialog.waitFor({ state: 'hidden' })
    await dismissHistory.click()

    const graphRead = vi.spyOn(projects, 'context').mockImplementationOnce(() => {
      throw new Error('Fixture graph read failure')
    })
    try {
      const graphStatus = nodeGraph.getByRole('status').filter({ hasText: 'Showing the last loaded state.' })
      await graphStatus.waitFor({ timeout: 10_000 })
      await chart.getByRole('button', { name: 'Task · Read the note', exact: true }).waitFor()
      await graphStatus.getByRole('button', { name: 'Retry', exact: true }).click()
      await graphStatus.waitFor({ state: 'hidden' })
    } finally {
      graphRead.mockRestore()
    }
    const navigation = page.getByRole('navigation', { name: 'Global panels', exact: true })
    const shelfEntry = navigation.getByRole('button', { name: 'Projects', exact: true })
    expect(await shelfEntry.count()).toBe(1)
    expect((await navigation.getByRole('button').evaluateAll(rows => rows.map(row => row.getAttribute('aria-label')))).slice(-2))
      .toEqual(['More', 'Projects'])
    const moreEntry = navigation.getByRole('button', { name: 'More', exact: true })
    const [morePosition, projectPosition] = await Promise.all([moreEntry.boundingBox(), shelfEntry.boundingBox()])
    if (morePosition === null || projectPosition === null) throw new Error('expected both sidebar rows to be visible')
    expect(projectPosition.y).toBeCloseTo(morePosition.y + morePosition.height + 2)
    await shelfEntry.click()
    const shelf = page.getByRole('main', { name: 'Projects', exact: true })
    expect(await ambient.evaluate(element => getComputedStyle(element).marginTop)).toBe('0px')
    const projectBook = shelf.getByRole('button', { name: 'sample-project', exact: true })
    await projectBook.waitFor()
    expect(await projectBook.getAttribute('aria-pressed')).toBe('true')
    const [bookBox, openProjectBox] = await Promise.all([
      projectBook.boundingBox(), shelf.getByRole('button', { name: 'Open project', exact: true }).boundingBox(),
    ])
    if (bookBox === null || openProjectBox === null) throw new Error('expected a selected book and open project action')
    expect(openProjectBox.y).toBeGreaterThan(bookBox.y + bookBox.height)
    const shelfBox = await shelf.boundingBox()
    if (shelfBox === null) throw new Error('expected the bookshelf page')
    expect(Math.abs(openProjectBox.x + openProjectBox.width / 2 - (shelfBox.x + shelfBox.width / 2))).toBeLessThan(3)
    expect(await projectBook.evaluate((element) => {
      const book = element.getBoundingClientRect()
      const frame = element.closest('[data-project-bookshelf]')?.getBoundingClientRect()
      const page = element.closest('main')?.getBoundingClientRect()
      return frame !== undefined && page !== undefined && book.height >= 350
        && Math.abs(book.x + book.width / 2 - (frame.x + frame.width / 2)) < 2
        && Math.abs(frame.y + frame.height / 2 - (page.y + page.height / 2)) < 2
    })).toBe(true)
    await projectBook.press('Escape')
    expect(await projectBook.getAttribute('aria-pressed')).toBe('false')
    await shelf.getByRole('button', { name: 'Back to workspace' }).click()
    await chart.waitFor()
    const secondDir = join(scaffold.workspaceCwd, 'second-project')
    await mkdir(secondDir)
    await page.getByRole('button', { name: 'New project', exact: true }).click()
    const picker = page.getByRole('dialog', { name: 'Select Workspace Directory' })
    await picker.getByRole('button', { name: 'Edit path' }).click()
    const pickerPath = picker.getByRole('textbox', { name: 'Edit path' })
    await pickerPath.fill(secondDir)
    await pickerPath.press('Enter')
    await picker.getByRole('button', { name: 'Open', exact: true }).click()
    await chart.getByRole('button', { name: 'Project · second-project', exact: true }).waitFor()
    const second = await scaffold.ctx.workspaceRegistry.resolveByPath(secondDir)
    if (second === undefined) throw new Error('new project was not registered')
    await expect.poll(() => scaffold.ctx.agents.list().find(agent => projects.ownerOf(agent.id) === second.id)?.id).toBeDefined()
    expect(await history.isVisible()).toBe(false)
    await shelfEntry.click()
    await projectBook.focus()
    await projectBook.press('Escape')
    await projectBook.focus()
    await projectBook.press('ArrowLeft')
    expect(await shelf.getByRole('button', { name: 'second-project', exact: true }).evaluate(element => element === document.activeElement)).toBe(true)
    await projectBook.click()
    await shelf.getByRole('button', { name: 'Open project', exact: true }).click()
    await chart.getByRole('button', { name: 'Project · sample-project', exact: true }).waitFor()
    const summaryPoint = await graphNodePoint(chart.getByRole('button', { name: 'Task · Summarize the note' }))
    await page.mouse.move(summaryPoint.x, summaryPoint.y)
    await preview.getByText('Report its scope', { exact: true }).waitFor()
    await expect.poll(() => panel.locator('[data-conversation-session]').getAttribute('data-conversation-session')).toBe(sessionId)
    await composer.waitFor()
    for (let index = 1; index <= 14; index += 1) {
      const folder = join(scaffold.workspaceCwd, `extra-project-${String(index)}`)
      await mkdir(folder)
      await scaffold.ctx.workspaceRegistry.create(folder)
    }
    await page.setViewportSize({ width: 860, height: 820 })
    await shelfEntry.click()
    const booksViewport = shelf.locator('[data-project-bookshelf]')
    const firstBook = booksViewport.getByRole('button').first()
    await expect.poll(() => booksViewport.getByRole('button').count()).toBe(16)
    await booksViewport.hover()
    await page.mouse.wheel(0, -2000)
    await expect.poll(() => firstBook.evaluate((element) => {
      const frame = element.closest('[data-project-bookshelf]')
      return Math.abs(element.getBoundingClientRect().x - (frame?.getBoundingClientRect().x ?? 0))
    })).toBeLessThan(2)
    const initialX = await firstBook.evaluate(element => element.getBoundingClientRect().x)
    await page.mouse.wheel(0, 440)
    await expect.poll(() => firstBook.evaluate(element => element.getBoundingClientRect().x)).toBeLessThan(initialX - 100)
    await navigation.getByRole('button', { name: 'Plugins', exact: true }).click()
    const plugins = page.locator('[data-main-panel="plugins"]')
    await plugins.waitFor()
    expect(await plugins.evaluate((element) => {
      const { marginTop, borderTopWidth } = getComputedStyle(element)
      return { marginTop, borderTopWidth }
    })).toEqual({ marginTop: '8px', borderTopWidth: '1px' })
    await page.context().setOffline(true)
    const disconnected = page.getByRole('button', { name: 'Disconnected, reconnect now', exact: true })
    await disconnected.waitFor()
    expect(await disconnected.evaluate((element) => {
      const box = element.getBoundingClientRect()
      return element.closest('[data-project-sidebar]') === null
        && box.top < 80 && Math.abs(box.left + box.width / 2 - window.innerWidth / 2) < 1
    })).toBe(true)
    await page.context().setOffline(false)
    const recovered = page.getByRole('status', { name: 'Connected', exact: true })
    await recovered.waitFor()
    expect(await recovered.evaluate((element) => {
      const box = element.getBoundingClientRect()
      return box.top < 80 && Math.abs(box.left + box.width / 2 - window.innerWidth / 2) < 1
    })).toBe(true)
    await recovered.waitFor({ state: 'hidden', timeout: 6_000 })
  } finally {
    await browser.close()
  }
}, 90_000)
