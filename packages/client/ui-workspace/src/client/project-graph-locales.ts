/** Copy for the project graph and its navigation controls. */

/** Simplified Chinese project graph dictionary. */
export const graphZh = {
  shelf: '项目', shelfBack: '返回工作区', shelfNew: '新项目', shelfOpen: '打开项目',
  shelfCurrent: '当前项目', shelfDefault: '默认项目', shelfLoading: '正在读取项目', shelfEmpty: '还没有项目',
  graph: '项目图谱',
  failure: '暂时无法读取项目状态', retry: '重试', noProjects: '点击「新项目」开始',
  failureEmpty: '项目尚未加载，请检查连接后重试。',
  failureCached: '当前显示上次成功读取的状态，请重试以获取更新。',
  retrying: '正在重试',
  project: '项目', task: '任务', evidence: '证据', decision: '决策', pending: '待核对', constraint: '约束',
  recorded: '已有证据', waiting: '等待证据',
  event: '主对话记录 #{seq}', tool: '工具', zoomIn: '放大', zoomOut: '缩小', reset: '还原视图',
  viewport: '项目关系图，可拖动和缩放',
  zoom: '图谱缩放',
  back: '返回图谱', reference: '引用节点', referenceText: '项目图谱节点 · {kind} · {label}',
  referenceUnavailable: '当前无法添加引用，请确认主输入框可编辑后重试。',
} as const

/** English project graph dictionary. */
export const graphEn: Record<keyof typeof graphZh, string> = {
  shelf: 'Projects', shelfBack: 'Back to workspace', shelfNew: 'New project', shelfOpen: 'Open project',
  shelfCurrent: 'Current project', shelfDefault: 'Default project', shelfLoading: 'Loading projects', shelfEmpty: 'No projects yet',
  graph: 'Project graph',
  failure: 'Could not load project state', retry: 'Retry', noProjects: 'Select New project to get started',
  failureEmpty: 'Check the connection and try again.',
  failureCached: 'Showing the last loaded state. Retry to check for updates.',
  retrying: 'Retrying',
  project: 'Project', task: 'Task', evidence: 'Evidence', decision: 'Decision', pending: 'Needs review', constraint: 'Constraint',
  recorded: 'Evidence recorded', waiting: 'Awaiting evidence',
  event: 'Conversation record #{seq}', tool: 'Tool', zoomIn: 'Zoom in', zoomOut: 'Zoom out', reset: 'Reset view',
  viewport: 'Project graph with pan and zoom controls',
  zoom: 'Graph zoom',
  back: 'Back to graph', reference: 'Reference node', referenceText: 'Project graph node · {kind} · {label}',
  referenceUnavailable: 'The composer cannot accept a reference right now. Check that it is editable and try again.',
}
