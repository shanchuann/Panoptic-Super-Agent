/** Keep the composed native or Web directory chooser available to the project shelf. */
import type { WorkspaceBrowserProps } from '../contract/slots.ts'
import { WorkspacePickFlow } from '../WorkspacePicker.tsx'

/** @param props - workspace state and the existing directory-picking actions. @returns the directory chooser outlet. */
export function ProjectDirectoryIntake({
  t, useWorkspaces, useWorkspaceShortcuts, useDirectoryFlow, createWorkspace,
  closeAddWorkspace, setDirectoryBusy, renderSlot, showProjectGraph,
}: WorkspaceBrowserProps) {
  const pickerOpen = useWorkspaceShortcuts(state => state.addRequested)
  return <WorkspacePickFlow t={t} open={pickerOpen} useWorkspaces={useWorkspaces}
    createWorkspace={createWorkspace} useDirectoryFlow={useDirectoryFlow}
    renderDirectoryFlow={owner => renderSlot('sidebar.workspaces.directoryFlow', owner)}
    addOnly onBusyChange={setDirectoryBusy} onClose={closeAddWorkspace}
    onPick={(id) => { closeAddWorkspace(); showProjectGraph?.(id) }} />
}
