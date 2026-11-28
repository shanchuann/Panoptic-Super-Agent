/** Project book selection with the beUI Bookshelf spine-to-cover interaction. */
import { useState } from 'react'
import type { WorkspaceId } from '@deepseek-ai/dsh-api-workspace-controller/types'
import { workspaceDisplayTitle } from '@deepseek-ai/dsh-api-workspace-controller/default-workspace'
import { IconChevronLeftOutlineRegular, IconProjectAddOutlineRegular } from '@deepseek-ai/dsh-client-ui-primitives'
import type { HostObservable, PropsHooks, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { ProjectBookshelf } from './ProjectBookshelf.tsx'
import css from './ProjectShelf.module.css'
import toolbar from './ProjectToolbar.module.css'

type Props = PropsLocale<'projectGraph'> & Pick<PropsRuntime<'main'>, 'useWorkspaces'>
  & PropsHooks<{ projectSelection: HostObservable<WorkspaceId | undefined>; directoryFlow: HostObservable<boolean> }>
  & { openProject: (id: WorkspaceId) => void; back: () => void; addProject: () => void }

const COVERS = [
  { color: '#5b6248', ink: '#fafaf9', thickness: 38 },
  { color: '#2f3a4a', ink: '#fafaf9', thickness: 34 },
  { color: '#b5452f', ink: '#fafaf9', thickness: 28 },
  { color: '#e3d7b8', ink: '#1c1917', thickness: 52 },
  { color: '#1f4e79', ink: '#fafaf9', thickness: 48 },
  { color: '#3b3b3b', ink: '#fafaf9', thickness: 36 },
  { color: '#d9a93f', ink: '#1c1917', thickness: 30 },
  { color: '#3f6b4f', ink: '#fafaf9', thickness: 42 },
  { color: '#8a8174', ink: '#fafaf9', thickness: 32 },
  { color: '#7a3b2e', ink: '#fafaf9', thickness: 46 },
] as const

/**
 * Browse projects by book spine, preview the cover, and open the selected workspace.
 * @param props - current workspaces, selection, directory intake, and main view navigation.
 * @returns the project selection page.
 */
export function ProjectShelf({ t, useWorkspaces, useProjectSelection, useDirectoryFlow, openProject, back, addProject }: Props) {
  const { items, phase } = useWorkspaces(snapshot => snapshot)
  const current = useProjectSelection(value => value) ?? items[0]?.workspaceId
  const available = useDirectoryFlow(value => value)
  const [preview, setPreview] = useState<WorkspaceId | null>()
  const selected = items.find(item => item.workspaceId === (preview === undefined ? current : preview))
  const books = items.map((workspace, index) => ({
    ...(COVERS[index % COVERS.length] ?? COVERS[0]),
    id: workspace.workspaceId,
    title: workspaceDisplayTitle(workspace.title, t('shelfDefault')),
    author: current === workspace.workspaceId ? t('shelfCurrent') : undefined,
  }))

  return (
    <main className={css.page} aria-labelledby="panoptic-project-shelf-title" onKeyDown={(event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      if (selected === undefined) back()
      else setPreview(null)
    }}>
      <header className={toolbar.toolbar}>
        <button type="button" className={toolbar.button} onClick={back}>
          <IconChevronLeftOutlineRegular size={14} />{t('shelfBack')}
        </button>
        <h1 className={toolbar.title} id="panoptic-project-shelf-title">{t('shelf')}</h1>
        {available && <button type="button" className={toolbar.button} onClick={addProject}>
          <IconProjectAddOutlineRegular size={16} />{t('shelfNew')}
        </button>}
      </header>
      <div className={css.room}>
        <div className={css.stage}>
          {books.length > 0 ? (
            <ProjectBookshelf books={books} value={selected?.workspaceId} onValueChange={(id) => { setPreview(id ?? null) }}
              onOpenProject={openProject} label={t('shelf')} />
          ) : <p className={css.empty} role="status">{t(phase === 'pending' ? 'shelfLoading' : 'shelfEmpty')}</p>}
        </div>

        <div className={css.selection}>
          {selected !== undefined && <>
            <button type="button" className={css.open} onClick={() => { openProject(selected.workspaceId) }}>{t('shelfOpen')}</button>
            <p title={selected.path}>{selected.path}</p>
          </>}
        </div>
      </div>
    </main>
  )
}
