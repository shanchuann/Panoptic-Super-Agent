/** Interactive projection of registered projects, ordered plans, and durable evidence. */

import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import type { WorkspaceId, WorkspaceProjectGraph, WorkspaceView } from '@deepseek-ai/dsh-api-workspace-controller/types'
import type { WorkspaceSnapshot } from '@deepseek-ai/dsh-api-workspace-controller/client'
import { Button, IconWarningOutlineRegular, IconWorkspaceTreeOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ProjectHistoryNode } from '@deepseek-ai/dsh-client-ui-layout/client'
import type { HostObservable, InjectFace, PropsHooks, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
import type { graphZh } from './project-graph-locales.ts'
import { attachProjectRipple } from './project-ripple.ts'
import css from './ProjectGraph.module.css'
import toolbar from './ProjectToolbar.module.css'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Project graph labels and status messages. */
    projectGraph: keyof typeof graphZh
  }
}

type GraphFace = {
  hooks: { projectGraphSelection: HostObservable<WorkspaceId | undefined>; projectCamera: HostObservable<GraphCamera> }
  updateCamera: UpdateCamera
  closeHistory: () => void
  openConversation: (id: WorkspaceId, seq?: number | null, node?: ProjectHistoryNode) => void
  readGraph: (id: WorkspaceId, signal: AbortSignal) => Promise<WorkspaceProjectGraph>
}

type GraphProps = PropsLocale<'projectGraph'> & InjectFace<Omit<GraphFace, 'hooks'>>
  & PropsHooks<GraphFace['hooks']> & Pick<PropsRuntime<'conversation.projectGraph'>, 'inputActions' | 'usePanelInfo' | 'sessionId'>
  & { useWorkspaces: SnapshotSelectorHook<WorkspaceSnapshot> }
type Translate = GraphProps['t']
type GraphNode = ProjectHistoryNode & { id: string; x: number; y: number; checked?: boolean }
type GraphEdge = { from: GraphNode; to: GraphNode; dependency?: boolean }
/** Camera shared with the sidebar zoom controls. Translation is in graph coordinates. */
export interface GraphCamera { readonly x: number; readonly y: number; readonly scale: number }

/** Neutral camera when opening a project or resetting the view. */
export const defaultGraphCamera: GraphCamera = { x: 0, y: 0, scale: 1 }
type UpdateCamera = (update: (camera: GraphCamera) => GraphCamera) => void
const minScale = 0.45
const maxScale = 2.4
const refreshMs = 3000

function zoomCamera(camera: GraphCamera, amount: number): GraphCamera {
  return { ...camera, scale: Math.min(maxScale, Math.max(minScale, camera.scale * amount)) }
}

type ZoomProps = PropsLocale<'projectGraph'> & Pick<PropsRuntime<'sidebar.settings.trailing'>, 'usePanelInfo'>
  & PropsHooks<Pick<GraphFace['hooks'], 'projectCamera'>> & { updateCamera: UpdateCamera }

/**
 * Control the current graph from the sidebar settings row.
 * @param props - graph camera, navigation state, and labels.
 * @returns three zoom controls when the graph is visible.
 */
export function ProjectGraphZoom({ useProjectCamera, usePanelInfo, updateCamera, t }: ZoomProps) {
  const scale = useProjectCamera(camera => camera.scale)
  const visible = usePanelInfo(info => info.activePanelId === null && info.projectHistory === undefined)
  if (!visible) return null
  return (
    <div className={css.camera} role="group" aria-label={t('zoom')}>
      <button type="button" aria-label={t('zoomOut')} disabled={scale <= minScale} onClick={() => { updateCamera(camera => zoomCamera(camera, 1 / 1.2)) }}>−</button>
      <button type="button" aria-label={t('reset')} onClick={() => { updateCamera(() => defaultGraphCamera) }}>{Math.round(scale * 100)}%</button>
      <button type="button" aria-label={t('zoomIn')} disabled={scale >= maxScale} onClick={() => { updateCamera(camera => zoomCamera(camera, 1.2)) }}>+</button>
    </div>
  )
}

function ring(index: number, count: number, radius: number): Pick<GraphNode, 'x' | 'y'> {
  const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(1, count)
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * 0.8 }
}

function layout(project: WorkspaceView, state: WorkspaceProjectGraph | undefined, t: Translate) {
  const center: GraphNode = { id: 'project', kind: 'project', label: project.title, x: 0, y: 0,
    ...(state?.goal === undefined ? {} : { detail: state.goal }),
    ...(state?.sourceSeq === undefined ? {} : { seq: state.sourceSeq }) }
  const tasks: GraphNode[] = (state?.tasks ?? []).map((task, index, list) => {
    const seq = task.evidence?.seq ?? state?.sourceSeq
    return {
      id: `task:${index}`, kind: 'task', label: task.title, detail: task.acceptance, checked: task.evidence !== undefined,
      ...(seq === undefined ? {} : { seq }), ...ring(index, list.length, list.length > 7 ? 215 : 166),
    }
  })
  const additions: Omit<GraphNode, 'x' | 'y'>[] = [
    ...(state?.decisions ?? []).map((item, index) => ({ id: `decision:${index}`, kind: 'decision' as const,
      label: item.key, detail: item.value, seq: item.sourceSeq })),
    ...(state?.constraints ?? []).map((constraint, index) => ({ id: `constraint:${index}`, kind: 'constraint' as const,
      label: constraint, detail: constraint, ...(state?.sourceSeq === undefined ? {} : { seq: state.sourceSeq }) })),
    ...(state?.pending ?? []).map(item => ({ id: `pending:${item.id}`, kind: 'pending' as const, label: item.tool })),
  ]
  const satellites: GraphNode[] = additions.map((node, index) => ({
    ...node, ...ring(index + 0.4, additions.length, tasks.length === 0 ? 157 : 277),
  }))
  const evidenceNodes: GraphNode[] = []
  const edges: GraphEdge[] = [...tasks, ...satellites].map(to => ({ from: center, to }))
  tasks.forEach((task, index) => {
    const previous = tasks[index - 1]
    if (previous !== undefined) edges.push({ from: previous, to: task, dependency: true })
    const evidence = state?.tasks[index]?.evidence
    if (evidence === undefined) return
    const node: GraphNode = { id: `evidence:${index}`, kind: 'evidence', label: t('evidence'),
      x: task.x * 1.34 - task.y * 0.16, y: task.y * 1.34 + task.x * 0.16, seq: evidence.seq, tool: evidence.tool }
    evidenceNodes.push(node)
    edges.push({ from: task, to: node })
  })
  return { nodes: [center, ...tasks, ...satellites, ...evidenceNodes], edges }
}

function Galaxy({ nodes, edges, camera, updateCamera, onSelect, t }: {
  nodes: readonly GraphNode[]
  edges: readonly GraphEdge[]
  camera: GraphCamera
  updateCamera: UpdateCamera
  onSelect: (node: GraphNode) => void
  t: Translate
}) {
  const [hover, setHover] = useState<{ id: string; x: number; y: number }>()
  const drag = useRef<{ x: number; y: number; camera: GraphCamera } | undefined>(undefined)
  const stage = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const previewId = useId()
  const gradient = useId()
  useEffect(() => {
    if (stage.current !== null && svg.current !== null && canvas.current !== null) {
      return attachProjectRipple(stage.current, svg.current, canvas.current)
    }
  }, [])
  const zoom = (amount: number): void => {
    setHover(undefined)
    updateCamera(c => zoomCamera(c, amount))
  }
  const preview = (id: string, anchor: SVGElement): void => {
    const bounds = svg.current?.getBoundingClientRect()
    if (bounds === undefined) return
    const node = anchor.getBoundingClientRect()
    setHover({ id, x: Math.max(14, Math.min(node.right - bounds.left + 10, bounds.width - 284)),
      y: Math.max(12, Math.min(node.top - bounds.top, bounds.height - 176)) })
  }
  const onCanvasKey = (event: KeyboardEvent<SVGSVGElement>): void => {
    if (event.target !== event.currentTarget) return
    if (event.key === '+' || event.key === '=') zoom(1.2)
    else if (event.key === '-') zoom(1 / 1.2)
    else if (event.key === '0') updateCamera(() => defaultGraphCamera)
    else if (/^Arrow/u.test(event.key)) updateCamera(value => ({ ...value,
      x: value.x + (event.key === 'ArrowLeft' ? 24 : event.key === 'ArrowRight' ? -24 : 0),
      y: value.y + (event.key === 'ArrowUp' ? 24 : event.key === 'ArrowDown' ? -24 : 0),
    }))
    else return
    event.preventDefault()
  }
  const startPan = (event: PointerEvent<SVGSVGElement>): void => {
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest('[data-graph-node]') !== null)) return
    setHover(undefined)
    drag.current = { x: event.clientX, y: event.clientY, camera }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const movePan = (event: PointerEvent<SVGSVGElement>): void => {
    const start = drag.current
    const bounds = svg.current?.getBoundingClientRect()
    if (start === undefined || bounds === undefined) return
    const ratio = Math.min(bounds.width / 840, bounds.height / 580)
    if (ratio <= 0) return
    updateCamera(() => ({ ...start.camera, x: start.camera.x + (event.clientX - start.x) / ratio,
      y: start.camera.y + (event.clientY - start.y) / ratio }))
  }
  const focused = hover?.id
  const previewNode = nodes.find(node => node.id === focused)
  const linked = new Set<string>(focused === undefined ? [] : [focused])
  for (const edge of edges) {
    if (edge.from.id === focused) linked.add(edge.to.id)
    if (edge.to.id === focused) linked.add(edge.from.id)
  }
  return (
    <div ref={stage} className={css.galaxy}>
      <svg ref={svg} viewBox="-420 -290 840 580" className={css.chart} tabIndex={0} aria-label={t('viewport')}
        onPointerDown={startPan} onPointerMove={movePan} onLostPointerCapture={() => { drag.current = undefined }}
        onWheel={(event) => { zoom(event.deltaY < 0 ? 1.08 : 1 / 1.08) }} onKeyDown={onCanvasKey}>
        <defs><radialGradient id={gradient}><stop offset="0" stopColor="currentColor" stopOpacity="0.24" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></radialGradient></defs>
        <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`}>
          {edges.map(({ from, to, dependency }) => <line key={`${from.id}/${to.id}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            className={css.edge} data-link={from.id === focused || to.id === focused ? 'highlight' : dependency === true ? 'dependency' : 'relation'} />)}
          {nodes.map((node) => {
            const size = node.kind === 'project' ? 14 : node.kind === 'task' ? 8 : 5
            return <g key={node.id} role="button" tabIndex={0} aria-label={`${t(node.kind)} · ${node.label}`}
              aria-describedby={node.id === focused ? previewId : undefined} data-graph-node={node.kind}
              data-muted={hover !== undefined && !linked.has(node.id)}
              data-checked={node.checked} className={css.node} transform={`translate(${node.x} ${node.y})`}
              onPointerEnter={(event) => { preview(node.id, event.currentTarget) }} onPointerLeave={() => { setHover(undefined) }}
              onFocus={(event) => { preview(node.id, event.currentTarget) }} onBlur={() => { setHover(undefined) }}
              onClick={() => { setHover(undefined); onSelect(node) }} onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setHover(undefined); onSelect(node) }
                else if (event.key === 'Escape') setHover(undefined)
              }}>
              <circle r={Math.max(21, size * 2.5)} fill={`url(#${gradient})`} />
              <circle className={css.orbit} r={size + 4} />
              <circle className={css.core} r={size} />
              <text y={size + 21} textAnchor="middle" className={css.nodeLabel}>{node.label.length > 22 ? `${node.label.slice(0, 21)}…` : node.label}</text>
            </g>
          })}
        </g>
      </svg>
      <canvas ref={canvas} className={css.ripple} aria-hidden="true" data-project-ripple />
      {hover !== undefined && previewNode !== undefined && (
        <div id={previewId} role="tooltip" className={css.preview} style={{ left: hover.x, top: hover.y }}>
          <span>{t(previewNode.kind)}</span>
          <strong>{previewNode.label}</strong>
          {previewNode.kind === 'task' && <p>{t(previewNode.checked === true ? 'recorded' : 'waiting')}</p>}
          {previewNode.detail !== undefined && <p>{previewNode.detail}</p>}
          {previewNode.tool !== undefined && <p>{t('tool')} · {previewNode.tool}</p>}
          {previewNode.seq !== undefined && <p>{t('event', { seq: previewNode.seq })}</p>}
        </div>
      )}
    </div>
  )
}

/**
 * Render project relationships with one action back to the project's conversation.
 * @param props - the current workspaces, graph reader, and navigation actions.
 * @returns the main panel.
 */
export function ProjectGraph({
  t, useWorkspaces, useProjectGraphSelection, useProjectCamera, updateCamera, usePanelInfo,
  sessionId, inputActions, closeHistory, openConversation, readGraph,
}: GraphProps) {
  const items = useWorkspaces(state => state.items)
  const selection = useProjectGraphSelection(value => value)
  const camera = useProjectCamera(value => value)
  const project = items.find(item => item.workspaceId === selection) ?? items[0]
  const history = usePanelInfo(info => sessionId !== undefined && info.projectHistory?.sessionId === sessionId
    ? info.projectHistory : undefined)
  const historyOpen = history !== undefined
  const workspaceId = project?.workspaceId
  const [loaded, setLoaded] = useState<{ id: WorkspaceId; data?: WorkspaceProjectGraph; failed?: boolean }>()
  const [retry, setRetry] = useState(0)
  const [retrying, setRetrying] = useState(false)
  const [referenceFailed, setReferenceFailed] = useState(false)
  useEffect(() => {
    if (workspaceId !== undefined) openConversation(workspaceId)
  }, [workspaceId, openConversation])
  useEffect(() => {
    if (workspaceId === undefined) return
    const abort = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = async (): Promise<void> => {
      try {
        const data = await readGraph(workspaceId, abort.signal)
        if (!abort.signal.aborted) setLoaded({ id: workspaceId, data })
      } catch (error: unknown) {
        if (!abort.signal.aborted) setLoaded(previous => ({ id: workspaceId,
          ...(previous?.id === workspaceId && previous.data !== undefined ? { data: previous.data } : {}), failed: true }))
        if (!abort.signal.aborted) console.warn('Could not load project graph', error)
      } finally {
        if (!abort.signal.aborted) {
          setRetrying(false)
          timer = setTimeout(() => { void refresh() }, refreshMs)
        }
      }
    }
    void refresh()
    return () => { abort.abort(); clearTimeout(timer) }
  }, [workspaceId, readGraph, retry])

  const snapshot = workspaceId !== undefined && loaded?.id === workspaceId ? loaded : undefined
  const { nodes, edges } = project === undefined ? { nodes: [], edges: [] } : layout(project, snapshot?.data, t)
  const node = history?.node
  const select = (item: GraphNode): void => {
    if (workspaceId !== undefined) {
      setReferenceFailed(false)
      const { kind, label, detail, seq, tool } = item
      openConversation(workspaceId, seq ?? null, { kind, label,
        ...detail === undefined ? {} : { detail }, ...seq === undefined ? {} : { seq },
        ...tool === undefined ? {} : { tool },
      })
    }
  }
  const reference = (): void => {
    if (node === undefined || inputActions === undefined) return
    const quote = [t('referenceText', { kind: t(node.kind), label: node.label }), node.detail,
      node.tool === undefined ? undefined : `${t('tool')} · ${node.tool}`,
      node.seq === undefined ? undefined : t('event', { seq: node.seq })].filter(line => line !== undefined).join('\n')
    if (inputActions.insertQuote(quote)) closeHistory()
    else setReferenceFailed(true)
  }
  return (
    <main className={css.page} aria-label={t('graph')}>
      {historyOpen && <header className={toolbar.toolbar}>
        <button className={toolbar.button} type="button" onClick={closeHistory}>{t('back')}</button>
        {node !== undefined && <>
          <strong className={toolbar.title}>{node.label}</strong>
          <button className={toolbar.button} type="button" onClick={reference}>{t('reference')}</button>
        </>}
        {referenceFailed && <span role="status">{t('referenceUnavailable')}</span>}
      </header>}
      <div className={css.surface} hidden={historyOpen}>
        {nodes.length === 0 ? <div className={css.empty}><IconWorkspaceTreeOutlineRegular size={34} /><p>{t('noProjects')}</p></div>
          : <Galaxy key={workspaceId ?? 'overview'} nodes={nodes} edges={edges} camera={camera}
            updateCamera={updateCamera} onSelect={select} t={t} />}
        {snapshot?.failed === true && (
          <div className={css.notice} role="status">
            <IconWarningOutlineRegular size={16} className={css.noticeIcon} />
            <div className={css.noticeCopy}>
              <strong>{t('failure')}</strong>
              <span>{t(snapshot.data === undefined ? 'failureEmpty' : 'failureCached')}</span>
            </div>
            <Button type="button" size="sm" variant="outline" disabled={retrying} onClick={() => {
              setRetrying(true)
              setRetry(n => n + 1)
            }}>{t(retrying ? 'retrying' : 'retry')}</Button>
          </div>
        )}
      </div>
    </main>
  )
}
