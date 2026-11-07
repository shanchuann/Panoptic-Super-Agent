# ADR-0003：会话与项目状态模型

- 状态：**Accepted**（用户 2026-11-07 确认按本方案推进）
- 决策人：用户 ｜ 记录：Lead ｜ 依据：[.ome/DESIGN.md](../../.ome/DESIGN.md)、[.ome/design/projects.md](../../.ome/design/projects.md)、[.ome/research/06-repo-seams.md](../../.ome/research/06-repo-seams.md)、ADR-0002
- 关联：ADR-0005（记忆）、ADR-0004（模型网关）

## 背景

基座的持久状态只有两种：会话事件日志（append-only，`SessionEventMap`，V4 格式）与非会话存储域（`ctx.storageDomain`）。产品需要的"项目"是跨会话的业务实体：目标、任务树、产物、审批、资源上限、审计，均不属于单次会话。基座里最接近的是 `Workspace`（命名目录 + 会话归属），但它是 path-keyed、Host-only、对模型不可见，且不承载目标/任务/产物。

用户要求：按项目组织工作，用户用自然语言创建项目，智能体负责拆解、分工、执行与交付；会话只是项目里的执行轨迹。

## 决策

### D1 会话保持 append-only，项目独立成域

- 会话继续使用基座 `packages/core/session` 的事件日志与既有持久化格式：物理帧、代文件名、v0至v4 相邻迁移链一律不动（ADR-0002 约束）。
- 项目状态新建独立 `storageDomain` 域：`defineDomain({ name: 'project', version: 1 })`，主表为 project、goal、task、task_dependency、run、artifact、audit_event，方案见 [projects.md §9](../../.ome/design/projects.md)。
- **不把 projectId 写进 `SessionHeader`**：头类型被 `SessionHeader.version` 严格盖章，新增字段会改持久化类型并影响所有读端。项目与会话的归属关系存在项目域（`project 至 sessionIds`），等价于 workspace 的 `sessionIds` 模式。
- 项目事件与执行轨迹的关系是引用，不是包含：项目记录引用 `sessionId`、事件序号与产物 id；会话日志不反向依赖项目。

### D2 状态词表与迁移守卫

意图层：Project、Goal；调度层：Task、Run；交付层：Artifact；治理层：Approval。

```text
Project  : draft 至 intake 至 planning 至 active ⇄ paused 至 verifying 至 delivered 至 iterating 至 archived（failed 分支）
Goal     : draft 至 active 至 achieved | failed | superseded
Task     : backlog 至 ready 至 assigned 至 running ⇄ waiting_input 至 verifying 至 done | failed | blocked | cancelled
Run      : queued 至 provisioning 至 running ⇄ paused 至 succeeded | failed | limit_stopped | cancelled | timed_out
Artifact : draft 至 candidate 至 verified 至 delivered | rejected
Approval : requested 至 granted | denied | expired
```

- 每次迁移写项目事件（`task.state_changed`、`run.ended`、`verification.recorded` 等），状态可重放；
- 迁移守卫：Task 进 ready 要求依赖完成且写域不冲突；进 assigned 要求角色预设、资源上限、验收判据齐全；进 verifying 要求产物已提交且证据非空；进 done 要求 L0 通过或 L1 通过加证据或 L2 签字；进 blocked 必须列出缺失项；
- Run 暂停时未提交产物必须先落盘，保留 checkpoint。

### D3 目标驱动连续工作

- 复用基座 `ctx.goals`（同一会话单目标，默认 256 轮）与 `goal-round-driver` 的回合边界续跑模式；
- 项目把"每个执行会话一个 goal"作为映射，停止条件四类：时长/步数耗尽、轮次上限、无进展（连续 N 轮无新证据）、用户暂停；
- 停止条件与用量由项目域记录，不依赖提示词自律；不计量费用。

### D4 归档与一致性

- 项目归档接基座 workspace 的会话活动语义：监听 `workspace/session-activity` 与 `workspace/session-stop`，避免"项目已归档但子任务仍在跑"；
- 项目域与运行态（队列、活跃 Run）之间每日对账一次：域里有 running 但无活跃执行 至 置 `blocked` 并记录原因；
- 项目导出与删除是第一天就有的能力：导出 Brief、计划、任务状态、产物清单、决策记录、来源索引；删除级联项目域与记忆命名空间，保留删除审计元数据。

## 备选与不选

| 备选 | 不选理由 |
|---|---|
| 用会话日志直接表达项目状态 | 跨会话无法表达；会强迫改会话格式与事件语义（违背 ADR-0002） |
| 扩展 workspace 成项目 | workspace 是 path-keyed、Host-only、模型不可见；改造面比新建域大 |
| 在 `SessionHeader` 加 projectId | 改持久化头类型与所有读端；兼容成本最高 |
| 引入外部任务编排服务 | 与本地优先冲突；v0.1 无多租户需求 |

## 后果与风险

- 收益：项目状态可查询、可聚合、可导出；会话格式零改动，兼容已发布数据；会话与项目各自可替换。
- 代价：新增域与服务、Remote controller、Client slot 的开发量；项目与会话存在双写点，需要单一写入口与对账。
- 风险：项目状态与执行轨迹漂移（缓解：项目事件由服务端单点写入，Run 只在结束时回写）；storage-domain open 时全量载入（缓解：项目记录量有界，归档项目移出热域）。

## 重议条件

- 基座出现官方项目/跨会话实体且语义匹配；
- 项目数或任务数增长到 storage-domain 无法承载（需外置数据库）；
- 会话格式因安全或合规要求必须携带项目元数据。
