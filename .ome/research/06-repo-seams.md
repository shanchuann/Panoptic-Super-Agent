# 06 ， DSH 基座扩展点勘定（Panoptic Super 二次开发落点）

勘定日期：2026-11-07 ｜ 对象：本仓库 `D:\Code\SuperAgent`（DSH v0.2.1-rc.3 fork）｜ 方式：只读阅读源码与包 README，未跑构建/测试

**标注约定**：每条结论带编号（E/C/S/O/T/U），`依据` 列写 `已读 <路径>:<行号>` 表示已打开文件逐行确认；`推断` 表示由已读事实推导、未直接读到对应实现。行号对应当前 checkout 的未构建源码。

**一个必须先说清楚的命名事实**：任务清单里的 `packages/session` 是**包组**（`session-persistence-jsonl`、`session-projection` 等），真正的 `ctx.sessions` 服务与 `SessionEventMap` 在 `packages/core/session`。设计文档引用时不要混淆（`docs/architecture.md:59`、`packages/session/README.md:27-52`）。

---

## 0. 一页结论

1. **会话事件是唯一"模型可见"的持久面**：任何进入请求的新输入都必须能由 session 日志重建（`docs/architecture.md:128`）。记忆检索结果不能只存在于宿主内存，必须落成 `user/message`（durable）或等价 surface 事件。
2. **ADR-0002"不改 JSONL 格式与迁移链"的准确含义**：物理帧（JSONL/压缩）、代文件名与 v0至v4 相邻迁移链不可动；**事件词汇表是可扩展的**，V4 内新增事件类型走声明合并 + 持久化类型变更记录（`docs/session-format-status.md:32,46`、`docs/cookbook/reviewing-persistence-type-changes.md:75-80`），不需要也不应该为加记忆事件而发 v5。
3. **长期记忆最稳的落点是三层叠加**：持久化用 `ctx.storageDomain`（非会话、schema 校验、json/sqlite 可换后端，`packages/storage/storage-domain/README.md:36-58`）；写入审计必要时才加 session 事件；对模型只管"注入"，`ctx.systemPrompt.context()`（每请求动态、落成 durable user-role 快照，`packages/core/system-prompt/src/index.ts:78-90,518`）或 `agent/pre-step` 追加 `UserMessage`（`packages/context/agent-instructions/src/index.ts:330-356` 是现成先例）。
4. **压缩是单实现服务（one `ctx.compaction` per context）**：自定义压缩策略 = 新写一个 `CompactionEngine` provider 包替换 `dsh-compaction-basic`，不是"再挂一个策略"（`packages/compaction/compaction/src/index.ts:117-193`）。轻量介入只有 `compaction/summary-error` waterfall 与直接调用 `compactNow()/compactRegion()`。
5. **"项目（Project）"在基座里没有对应实体**。最接近的是 `Workspace`（`ctx.workspaceRegistry`：命名目录 + 有序会话归属，`packages/workspace/workspace/README.md:12,57,73`），但它是 path-keyed、Host-only、对模型不可见、不承载目标/任务/产物/记忆命名空间；其次是 `Goal`（同会话单目标，`docs/glossary.md:25`）和 `Agent preset`（能力组合，非项目容器）。Project 必须新建域。
6. **新增工具/插件/配置项的机制完整且统一**：`ctx.tools.register()`（`packages/core/tools/src/index.ts:128`）、函数插件 `name/inject/Config/apply`（`packages/goal/tool-goal/src/index.ts:28-40`）、schemastery `Config` 自动进设置页（`packages/settings/README.md:12`）、patch 层叠加（`packages/bundle/base/cordis.patch.yml:15-18`）。新产品不需要改 agent-loop。
7. **三个最大改造风险**：事件词汇表分叉带来的持久化兼容债（§8 R1）、记忆检索与压缩/清理的互斥（R2）、项目制需要的跨会话实体与全基座 session-scoped 设计冲突（R3）。

---

## 1. 会话与事件（packages/core/session、packages/session、packages/core/agent-loop）

### 1.1 事实表

| # | 能力 | 包 / 文件（行） | 关键类型 / 服务 / 钩子 | 接入方式 | 风险 / 不可改动项 | 依据 |
|---|---|---|---|---|---|---|
| E1 | 格式版本常量 | `packages/core/session/src/types.ts:90` | `SESSION_FORMAT_VERSION = 4` | 只读引用；不手动改 | **不可改**：现值为已发布/已定稿基线 | 已读 types.ts:75-100；`docs/session-format-status.md:32,46` |
| E2 | 事件词汇表 | `packages/core/session/src/types.ts:287,439` | `SessionEventMap`（merge-extensible）、`SessionEventType = keyof SessionEventMap` | `declare module '@deepseek-ai/dsh-session/types' { interface SessionEventMap { 'memory/…': … } }` | 新增即进入持久化词汇表；须重生成 catalog 并记录类型变更 | 已读 types.ts:281-439；先例 `packages/goal/goal/src/domain.ts:62-66`、`packages/plan/plan-mode/src/index.ts:46-53`、`packages/todo/tool-todo/src/types.ts:30-33`、`packages/compaction/compaction/src/types.ts:17` |
| E3 | 未知事件兼容 | `packages/core/session/src/types.ts:501-524` | 事件信封 `{type,seq,time,data,ignorable?}`；`ignorable: true` 是唯一"可安全跳过"标记 | 纯信息类记忆回执可标 ignorable；模型可见/影响重建的必须不标 | 不标 = 旧读端遇未知类型必须拒绝重建整个会话 | 已读 types.ts:488-524 |
| E4 | 事件类型白名单 | `packages/core/session/src/known-event-types.ts:1-22` | `KNOWN_SESSION_EVENT_TYPES`（脚本生成） | `pnpm run gen-persistence-catalog`；`verify-persistence-catalog` 在 doc-sync 内 | 手改会被 gate 拒绝 | 已读 known-event-types.ts:1-22 |
| E5 | 追加事件 | `packages/core/session/src/index.ts:806-835` | `Session.append(type,data,surfaceOp?)`；JSON 快照 + `validateSessionEventData` | 只能对已入 store 的 session 写（README:44） | 非 JSON、非法 surface 元数据在发布点抛错 | 已读 index.ts:796-835 |
| E6 | surface 与 replace | `packages/core/session/src/types.ts:447-486` | 5 类 surface 事件；`SurfaceOp = append | { op: replace, startSeq, endSeq }` | 记忆摘要可复用 replace 语义（同 compaction） | replace 使 KV 前缀失效；被遮蔽事件仍在日志 | 已读 types.ts:441-486 |
| E7 | 派生模型历史 | `packages/core/session/src/index.ts:999` | `deriveMessages()`（增量缓存、深冻结） | UI/消费方只读派生结果 | `eventAt/snapshotEvents/ownEvents` 已废弃，新代码禁用（README:64） | 已读 index.ts:999；`packages/core/session/README.md:64` |
| E8 | 事件广播 | `packages/core/session/src/index.ts:76` | `session/event`（`Scoped<Session>`） | `ctx.on('session/event', …)` 观察一切提交 | 只读观察；不得在此同步写回 | 已读 index.ts:43-76 |
| E9 | 服务入口 | `packages/core/session/src/index.ts:1064` | `class SessionStore` 至 `ctx.sessions` | `create/get/list/fork/flush` | — | 已读 index.ts:1064,1403；README:30-32,86-88 |
| E10 | 分叉 | `packages/core/session/src/index.ts:1403` | `ctx.sessions.fork(source,boundary?,childId?)` | 项目"分叉一次尝试"的现成语义 | 只复制前缀 + 继承标记，不建立源关系 | 已读 index.ts:1403；README:80-84 |
| E11 | 持久化 seam | `packages/session/session-persistence/src/index.ts:144-159` | `abstract class SessionPersistence`（`create/open/stat/list/export`） | 换后端 = 新 provider 包；**不是**加事件的方式 | 换后端不解除格式约束 | 已读 index.ts:144-171；`docs/architecture.md:166` |
| E12 | JSONL 物理层 | `packages/session/session-persistence-jsonl/src/index.ts:37`、`format.ts:144,304` | 代文件名 `generationLogPath(...)`；v0 `session.jsonl`，v1+ `session.vN.jsonl[.zstd]` | 只读复用 | **不可改**：已提交代不得改名/覆盖/删除 | 已读 format.ts:144,304；`docs/architecture.md:126` |
| E13 | 迁移链 | `packages/session/session-format-v0-to-v1` … `v3-to-v4` | 静态相邻链，catalog 校验到 `SESSION_FORMAT_VERSION` | 只读复用 | **不可改**：ADR-0002 明确禁止 | 已读 `packages/session/README.md:33-37`、`packages/session/session-format-catalog/src/current.ts:19-39` |
| E14 | 插件记录通道 | `packages/core/session/src/types.ts:526-557`、`index.ts:495` | `PluginRecordMap`、`plugin:<owner>/<record>`、`appendPluginRecord()` | 仅 `packages/experimental/*` 可用（`verify-plugin-record-callers` 强制），记录带 `ignorable` | **不能**用于模型可见数据；不属于 `SessionEventMap` | 已读 types.ts:526-557、index.ts:495；`packages/core/session/README.md:68-78` |
| E15 | 消息来源扩展 | `packages/llm/llm/src/message.ts:110` | `MessageSourceMap`（声明合并） | 记忆注入声明 `{kind:'memory'}` 来源 | 改 `user/message` 载荷 = 持久化类型变更（指纹 `docs/persistence-schema.json:65`），必须记录；V4 拒绝已退役的 `{kind:'plugin'}` | 已读 message.ts:110；`docs/cookbook/adding-a-tool.md:49`；已读 persistence-schema.json:65 |
| E16 | 会话投影 | `packages/session/session-projection/src/index.ts:74-124,290` | `ProjectionDefinition{key,stateSchema,init,apply,wire,stateVersion}`；`ctx.sessionProjections.register()` | 记忆写入回执/索引状态可在进程内投影给 UI，不新增事件 | `apply` 必须同步且纯；state 必须 plain JSON | 已读 index.ts:66-124,282-304 |
| E17 | 投影快照 | `packages/session/session-projection/src/index.ts:159-169,459` | `ProjectionHandle`、`snapshot(asOfSeq)` | Client 一次一致读 | 仅 client-visible 键 | 已读 index.ts:159-169,459 |

### 1.2 新增事件类型的正确做法（本项目的操作序列）

1. 在**拥有该事件的包**里 `declare module '@deepseek-ai/dsh-session/types'`，只加一个键，JSDoc 写 `@mode` 与载荷语义（仓库约定见根 `AGENTS.md`“Typed events use declaration merging”）。
2. 判断是否 model-visible：可见 至 必须无 `ignorable`，并考虑是否属于 `SurfaceEventType`（**不要**擅自扩这个封闭联合，`types.ts:447-452` 是已发布语义）。
3. 若载荷嵌在其他已持久化类型里（`UserMessage`、`MessageSource`、`SessionHeader`），先评估指纹变化，按 `docs/cookbook/reviewing-persistence-type-changes.md` 记录 `--decision same-version`。
4. `pnpm run gen-persistence-catalog` 重生成 `known-event-types.ts` 与 `docs/persistence-catalog.md`/`docs/persistence-schema.json`。
5. 读路径必须能处理"同版本旧表示"（`types.ts:75-89` 的版本契约）。
6. SDK / Web 快照若投影事件，同步更新（根 AGENTS.md：两个 SDK 在同一 PR 更新）。
7. 若事件影响 UI，注册 `ConversationNodeDefinition` 或 projection wire，而**不是**改 Session 的 switch。

### 1.3 本节不可改动项

- `SESSION_FORMAT_VERSION` 的既有值、已发布代的文件命名与压缩字节、v0至v4 迁移包；
- 5 类 surface 事件的语义与 `SurfaceOp` 形状；
- `session/end-seed` 只能由 `Session` 构造器与 `buildForkSeed` 写入（`types.ts:411-435`）；
- 已废弃的同步读事件方法（新代码禁用）。

---

## 2. 上下文与压缩（packages/compaction、packages/context、packages/spill、packages/ptc-runtime）

| # | 能力 | 包 / 文件（行） | 关键类型 / 服务 / 钩子 | 接入方式 | 风险 | 依据 |
|---|---|---|---|---|---|---|
| C1 | 压缩 seam | `packages/compaction/compaction/src/index.ts:88-193` | `abstract CompactionEngine`、`ctx.compaction`；`compactIfNeeded` / `compactNow` / `compactRegion` | 新 provider 包继承 `CompactionEngine` 并替换 `dsh-compaction-basic` 行 | **每 context 只允许一个实现**（:117）至 不能"叠加第二个策略" | 已读 index.ts:88-195 |
| C2 | 自动触发点 | `packages/compaction/compaction-basic/src/index.ts:157,177,183,213` | `agent/pre-step`（pressure）、`agent/request`、`agent/status`、`agent/request-error`（context-overflow） | 已有实现；自定义策略可监听同名钩子 | pre-step 是 waterfall，必须 `next()`（`packages/core/agent/src/runtime-types.ts:350`） | 已读 index.ts:144-235 |
| C3 | 摘要失败恢复 | `packages/compaction/compaction/src/index.ts:92-107` | `compaction/summary-error`（waterfall，返回 true 才算已恢复） | 记忆子系统可在此把待压缩输入先落盘再委托 | 返回值语义严格；误返 true 会掩盖失败 | 已读 index.ts:92-107 |
| C4 | 主动压缩 | 同上 `compactNow`(:162) / `compactRegion`(:187) | 需 `CompactionAgentContext`（`agent`） | 记忆整理前可主动压缩腾预算 | 失败抛 `ManualCompactionError`（稳定 code 集 :35-48） | 已读 index.ts:142-193 |
| C5 | 预算测量 | `packages/compaction/compaction-basic/src/index.ts:304` | `ctx.tokenMeter.measure(session)` | 记忆注入前查预算 | 测量请求体积，不含外部存储 | 已读 index.ts:292-330 |
| C6 | 压缩产物语义 | `packages/compaction/compaction/README.md:73-97` | `compaction/start、compaction/summary、compaction/end`（log-only）+ 一条 `user/message` replace | 只读消费 `compactCheckpointSource` 识别摘要 | replace 会遮蔽历史节点，KV 从首个遮蔽点失效（README:150） | 已读 README:73-97 |
| C7 | 系统提示注入 | `packages/core/system-prompt/src/index.ts:483,518` | `ctx.systemPrompt.section({name,order,text})`；`ctx.systemPrompt.context(...)` 至 **durable user-role 快照**（:78-90） | 记忆索引/项目约定走 section；检索结果走 context | 后者每请求落盘，涨 token；同一 name 重复注册抛错 | 已读 index.ts:41-124,476-525 |
| C8 | 每步上下文注入 | `packages/core/agent/src/runtime-types.ts:350` | `agent/pre-step` waterfall 至 `PreStepDecision` | 先 `next()`，再在 `decision.messages` 插入 `UserMessage`（先例 `packages/context/agent-instructions/src/index.ts:330-356`） | 必须自带 `MessageSourceMap` kind；顺序影响 KV | 已读 runtime-types.ts:275-350；已读 agent-instructions:180-243,330-356 |
| C9 | 异步注入 | `packages/core/agent/src/runtime-types.ts:270` | `agent.inject(message)` | 非唤醒，下一次被唤醒的请求才看到 | 空闲 agent 不会因此启动 | 已读 runtime-types.ts:191-275 |
| C10 | 大文本外置 | `packages/spill/spill/src/index.ts:47`；README:47-58 | `ctx.spillStore.saveText(...)` 至 `{locator,bytes,retrievalHint}` | 记忆候选原文先 spill，只给模型 locator | 无保留/检索/删除 API（README:12） | 已读 src/index.ts:2-47；README:26-58 |
| C11 | PTC 程序执行 | `packages/ptc-runtime/ptc-runtime/src/index.ts`（README:30-45） | `ctx.ptcRuntime.resolve()/run()`；绑定命名空间 | 记忆批量整理/去重写成程序，中间结果不进上下文 | 隔离描述不是安全保证（README:12） | 已读 README:10-55 |
| C12 | context 插件族 | `packages/context/README.md:25-33` | `agent-instructions`、`session-reference`、`time-context` 等 | 新记忆插件照此形态：无工具、只注入 | `agent-instructions` 是唯一默认挂载（:12） | 已读 group README:25-33 |

**结论（记忆注入的三条候选路，按侵入度排序）**：① `systemPrompt.context()`（最省事、每请求刷新、落成 durable user 快照）；② `agent/pre-step` 追加 `UserMessage`（可控顺序、可做去重/预算，`agent-instructions` 已验证）；③ 新增 surface 事件（最重，除非需要独立的模型可见语义否则不要）。

---

## 3. 存储与工作区（packages/storage、packages/workspace、packages/session-query、packages/skill、packages/attachment）

| # | 能力 | 包 / 文件（行） | 关键类型 / 服务 / 钩子 | 接入方式 | 风险 / 限制 | 依据 |
|---|---|---|---|---|---|---|
| S1 | 存储枢纽 | `packages/storage/storage/src/index.ts`；README:27 | `ctx.storage`（backend 名至实现表 + data form 表） | 组合里挂 `storage`+`storage-json`/`storage-sqlite`+`storage-domain` | Host-only，零模型影响 | 已读 storage/README.md:26-58 |
| S2 | 领域 KV | `packages/storage/storage-domain/src/spec.ts`；README:36-58 | `defineDomain({name,version,tables})`、`domainTable(schema)`、`ctx.storageDomain.open(spec)` | 记忆/项目域首选 | zod schema，改 schema 必须换 version 并手工迁移（README:148） | 已读 storage-domain/README.md:28-73,141-148 |
| S3 | 领域运行时语义 | `packages/storage/storage-domain/README.md:85-94` | 同步读（全量在内存）、单写链、`domain/changed` | 读多写少、记录量有界时最合适 | **open 时全量载入并校验**（:94）；无二级索引、无跨表事务、无跨进程推送（:146-147） | 已读 README:85-148 |
| S4 | 工作区 | `packages/workspace/workspace/src/index.ts`；README:57,117 | `ctx.workspaceRegistry`；`WorkspaceRegistry`/`Workspace` 实体；domain v2 | 项目制的目录/会话归属可直接复用其模式 | path-keyed（`realpath` 唯一）；header-only 读；model-invisible（:151）；archive 走 `workspace/session-activity` waterfall（README:103） | 已读 workspace/README.md:12,28-79,103,115-121 |
| S5 | 会话查询 | `packages/session-query/session-query/README.md:28-51` | `ctx.sessionQuery`：`listSessions/filterEvents/readSurface/traceSession/searchEvents` | 记忆的"来源回溯"利器 | 只读会话历史；排序全文检索需 `session-query-sqlite`（:12,43）；不是通用索引 | 已读 README:28-51 |
| S6 | 技能库 | `packages/skill/skill/README.md:28-53` | `ctx.skills`；`register()` / `registerProvider()`；`modelInvocable`/`userInvocable` | 只读知识条目可作 skill provider | 无写入/衰减/权重语义，不适合做记忆本体 | 已读 README:28-60 |
| S7 | 附件 | `packages/attachment/attachment/README.md:12,28-48` | `dsh-attachment-local`；归一化图片 + 原样文件 | 记忆里的图片/大文件引用 | 永不自动删除（:12），没有 GC | 已读 README:12-52 |
| S8 | 记忆后端选型结论 | S2+S3 vs S5 vs 新后端 | — | **主存：新建 `defineDomain({name:'memory',version:1})` 挂 `storage-domain`**；检索索引需另立 | `kv` 是后端唯一 facet（storage/README.md:79,130）；向量/倒排要么自带 JSON 扫描、要么新写 backend provider 包 | 已读 storage/README.md:77-90,130；已读 storage-domain/README.md:141-148 |

**要点**：`storage` 是"非会话配置/业务数据"的正式后端；`session-persistence` 是"会话日志"的后端，两者不可混用（storage/README.md:32“Avoid it when the data belongs in a session event log”反推）。长期记忆若要求可审计、可回放，采用"storage 为主 + 少量 session 事件为审计锚"的混合，而不是把记忆写进会话日志。

---

## 4. 编排（goal / plan / todo / schedule / subagent / workflow / guard）与"项目"最近对应物

| # | 能力 | 包 / 文件（行） | 关键类型 / 服务 / 钩子 | 接入方式 | 风险 | 依据 |
|---|---|---|---|---|---|---|
| O1 | 会话目标 | `packages/goal/goal/src/index.ts:612,652`；README:12,46 | `GoalService` 至 `ctx.goals`；`goal/change` 事件；阶段 active/paused/blocked/complete；默认 256 轮 | 目标驱动连续工作直接复用 | **一个会话同时只能有一个 goal**（README:160）；activation 是进程内状态（:99），resume 后需重新 arm | 已读 README:12-100；已读 domain.ts:56-66 |
| O2 | 目标轮驱动 | `packages/goal/goal-round-driver/src/index.ts:208,338,380` | `agent.followup()` 续轮；`session/event turn/end`；`agent/pre-step` 注入轮次提示 | 照抄其"回合边界再续"的模式 | 预算只有轮数，不含 token/时间（goal README:158） | 已读 index.ts:180-430 |
| O3 | 规划模式 | `packages/plan/plan-mode/src/index.ts:46-53,64,198` | `ctx.planMode`；`plan/mode` 事件；`exit_plan_mode` 工具；`plan:policy` section | 项目"先规划后执行"直接用 | 只引导不限制（plan/README.md:12） | 已读 index.ts:39-70,198；plan/README.md:12 |
| O4 | 待办 | `packages/todo/tool-todo/src/index.ts:124-136,200` | `todo/write` 事件；`todos` 投影；`todo_write` 工具 | 项目任务树的"会话内视图"模板 | 全量替换语义；属单个 agent 会话（todo/README.md:12） | 已读 index.ts:112-200；types.ts:30-33 |
| O5 | 定时任务 | `packages/schedule/schedule/src/index.ts:110-149`、`storage.ts:57` | `ScheduleService`、`schedule/change`、`schedule/resolve-agent` waterfall、domain `schedule` | 项目级周期任务先用它 + 自建 project 域存放归属 | 任务按 Session 归属；恢复靠现有 Session controller（packages/schedule/AGENTS.md） | 已读 index.ts:66-160；types.ts:366-371 |
| O6 | 子代理 | `packages/subagent/subagent/src/index.ts:549`、`types.ts:313` | `ctx.subagents.registerProvider(provider)`；`SubagentProvider` | 项目分工的最小单元 | 隔离靠进程/session，不共享显式黑板；continuable 能力在 :355 | 已读 index.ts:131-236,549-604；types.ts:300-356 |
| O7 | 工作流 | `packages/workflow/workflow/src/index.ts:157-168` | `ctx.workflowEngine`；`WorkflowEngine.start()` | 固定流程编排 | 脚本执行面，不是持久任务实体 | 已读 index.ts:150-187 |
| O8 | 循环护栏 | `packages/guard/README.md:27-31`；`repeat-tool-reminder/src/index.ts:220,236`；`timeout-policy/src/index.ts:56` | `tools/post-execute`、`agent/pre-step`、`tools/execute` | 项目"防跑飞"预算/重复检测挂同位置 | 都是可选插件，可被组合移除 | 已读 guard/README.md:12-31 与两插件 index |
| O9 | 产物 | `packages/deliverables/README.md:29` | `present` 工具；`workspace-changes` 监听 `session/event` 追加 `workspace/changes` | 项目产物清单的事件源 | 产物按 turn 归属，跨 turn 聚合要自建 | 已读 README:12,29 |

### 4.1 "项目（Project）"在基座里最接近什么

| 候选 | 是否跨会话 | 是否有目标 | 是否有任务/产物 | 是否对模型可见 | 结论 |
|---|---|---|---|---|---|
| **Workspace**（`ctx.workspaceRegistry`） | 是（一个 workspace 多个 session） | 否 | 否 | 否（README:151） | **最接近**：提供了"命名容器 + 会话归属 + 归档/置顶"的完整实现模式，但 key 是目录路径，没有目标/任务/产物/记忆命名空间 |
| Goal（`ctx.goals`） | 否（同会话） | 是（单目标） | 否 | 间接 | 可作 Project至Goal 的"执行态" |
| Agent preset（`ctx.agentPresets`） | 否 | 否 | 否 | 是（能力组合） | 只是"这个人用什么工具"，不是容器 |
| Schedule task | 否（按 Session） | 否 | 否 | 是（工具） | 只是触发器 |

**差距（Project 需要但基座没有）**：① 一个跨会话的持久实体（创建/改名/归档/删除）；② 成员会话集合与"该项目下的运行"关系（workspace 用 `SessionHeader.cwd` 事后归组，见 README:73，项目需要显式归属）；③ 目标/任务树（goal+todo 都是会话内、单层）；④ 产物清单（deliverables 是 turn 级事件，无聚合读模型）；⑤ 记忆命名空间与隔离（记忆按 project 分区、跨会话共享）；⑥ 对模型可见的项目上下文（`systemPrompt.context` 或 skill 形态）；⑦ UI 导航实体（sidebar 分组）与远端 API。

**低风险落地建议（推断）**：Project = 新 `storage-domain` 域（`defineDomain({name:'project'})`，含 projectRecord 与 sessionAccount 两张表）+ 新 Host service（`ctx.projects`）+ Remote controller + Client slot；**不要把 `projectId` 写进 `SessionHeader`**，那会改持久化头类型与所有读端（`types.ts:95-136`），与 ADR-0002 冲突。归属关系存域侧，等价于 workspace 的 `sessionIds`（README:117）。

---

## 5. 工具与模型（core/tools、mcp、llm、preset、boot、settings）

| # | 能力 | 包 / 文件（行） | 关键类型 / 服务 / 钩子 | 接入方式 | 风险 | 依据 |
|---|---|---|---|---|---|---|
| T1 | 工具注册表 | `packages/core/tools/src/index.ts:128,384`；`contracts.ts:26,115` | `ctx.tools.register(definition,{when})` 返回 disposer；`ToolDefinition`；`ctx.tools.guard()` | `ctx.tools.register(defineTool({...}))` | 注册即 effect，fiber 卸载自动撤销；`run_code` 名称保留（:146） | 已读 index.ts:106-152,380-400 |
| T2 | 工具定义助手 | `packages/core/tools/src/schema.ts:555` | `defineTool`（参数 DSL + `output.schema/render/presentationMeta`） | 首选写法 | schema 进 prompt 即占 token；presenter 必须纯 | 已读 schema.ts:555；`docs/cookbook/adding-a-tool.md:9-38` |
| T3 | 工具管线钩子 | `packages/core/tools/src/events.ts:18,29,41,49,56` | `tools/pre-execute`（waterfall 决策 allow/deny/ask）、`tools/execute`、`tools/post-execute`、`tools/result`、`tools/change` | 记忆读写权限、脱敏、审计挂此处 | waterfall 必须 `next()`，否则短路整条链 | 已读 events.ts:1-56 |
| T4 | MCP | `packages/mcp/mcp-client/src/tools.ts:150` | 单 server 单插件：发现至`ctx.tools.register` | 第三方记忆 server 直接接 | 工具目录 token 成本高；连接默认不可信 | 已读 tools.ts:150；mcp/README.md:27-31 |
| T5 | 模型 seam | `packages/llm/llm/src/index.ts:208,401`；README:59 | `abstract class LlmAdapter`；`ctx.llm.registerAdapter(providers, adapter)`；`listProviders()` | 模型网关 = 新 adapter 包（或在 adapter 内做路由） | 循环构建的请求深冻结，扩展不能改写（README:12） | 已读 index.ts:204-232,401；README:10-59 |
| T6 | 重试/降级底座 | `packages/llm/README.md`（`llm-retry` 组内） | `dsh-llm-retry` 包 | 降级策略先看它是否够 | 独立包，不与网关耦合 | 已读 packages/llm/README.md（组表） |
| T7 | 模型选择 | `packages/core/agent/src/model-selection.ts`；`docs/architecture.md:112` | 每会话快照 `ModelSelection`；`ctx.agentDefaultModel` | 网关需与 selection/运行时选择对齐 | selection 在 step 组装前快照，网关不能事后改 | 已读 architecture.md:112；model-selection.ts |
| T8 | Agent 预设 | `packages/preset/agent-preset-registry/src/index.ts:54,97` | `ctx.agentPresets.register(definition)`；`PresetDefinition` | 新能力按 preset 组合，不写死进 loop | 预设是组合层，不是持久项目容器 | 已读 index.ts:27-116；preset/README.md:12 |
| T9 | 启动 / 插件加载 | `packages/boot/app-boot/src/profile.ts:7,74,90`；README:50 | `dsh.profile.bundles` + `dsh.bundle.patch`；`$DSH_HOME/profiles/<name>` | 新增行 = 改 bundle patch 或 profile patch | bundle 解析失败只跳过该 bundle 并告警（README:50） | 已读 profile.ts:1-100；README:45-50 |
| T10 | 设置页 | `packages/settings/README.md:12,27`；`packages/settings/settings/src/schema.ts:1-34` | `ctx.settings`；由插件 `Config` schema 派生表单 | 新配置项 = 插件 `Config`（schemastery） | 配置写回 profile patch；无 schema 的开关不会出现在设置页 | 已读 settings/README.md:12-34；`packages/goal/tool-goal/src/index.ts:28-40` |
| T11 | 函数插件形态 | `packages/goal/tool-goal/src/index.ts:28-40` | `export const name/inject/Config` + `export function apply(ctx)` | 首选形态（工具类插件） | 不能同时 default export，否则 Loader 丢弃 namespace（packages/AGENTS.md） | 已读 tool-goal/src/index.ts:1-60；packages/AGENTS.md |

---

## 6. UI 面（packages/host、packages/client、packages/api）

只列入口与数据源，不深入实现。

| # | 入口 | 包 / 文件（行） | 数据来源 | 依据 |
|---|---|---|---|---|
| U1 | 会话控制 | `packages/api/session-controller/README.md:13` | `ctx.sessionController`（Host）至 Client `session`/`skills`/`fileReferences` 命名空间 | 已读 README:13 |
| U2 | 工作区导航 | `packages/api/workspace-controller/README.md:11` | `ctx.workspaceController` 至 `ctx.remote.workspace` | 已读 README:11 |
| U3 | RPC 管道 | `packages/api/gateway/README.md:12` | `ctx.typertGateway`（Host）/ `ctx.remote`（Client） | 已读 README:12 |
| U4 | 会话列表 UI | `packages/client/ui-session/README.md:11` | Session Controller 列表 + `SessionProvider` 绑定 | 已读 README:11-13 |
| U5 | 项目/会话侧栏 | `packages/client/ui-workspace/README.md:14` | workspace 投影 + 会话列表；行内动作是 slot 列表 | 已读 README:14 |
| U6 | 产物卡片 | `packages/client/ui-deliverables/README.md:12,28` | 记录的 turn 摘要 + `present` + `workspace/changes` | 已读 README:12-30 |
| U7 | 目标/计划面 | `packages/client/ui-goal/README.md:28`；`packages/client/ui-plan/README.md:28` | `goal` 投影；`plan/mode` 状态 + 提交的计划文档 | 已读两 README |
| U8 | Chat 业务节点 | `docs/cookbook/extension-cookbook.md:129` | `ConversationNodeDefinition` + `conversation.chat.node` 键控渲染器 | 已读 cookbook:129；packages/client/AGENTS.md“Conversation Node discipline” |
| U9 | 客户端插件三处登记 | `packages/client/AGENTS.md`（New plugin package checklist） | `tsconfig.client.json` references、`packages/bundle/web-app/cordis.patch.yml` 行、`web-app/package.json` 依赖 | 已读 AGENTS.md 清单 |

---

## 7. 扩展机制总结：记忆插件的最小骨架

### 7.1 判断：必须新建包 vs 可在 profile 层叠加

| 需求 | 结论 | 依据 |
|---|---|---|
| 新的模型可见能力（工具/提示段/事件/服务） | **新建包**（仓库内 `packages/<group>/<pkg>`） | `docs/cookbook/adding-a-package.md:9-40` |
| 只改组合（启用/禁用已有行、改配置、插一行） | **bundle/profile patch 叠加即可**，不必建包 | `docs/architecture.md:17-25`；`packages/bundle/base/cordis.patch.yml:15-18` |
| 纯外挂（分发给他人的可选能力） | 仓库外 bundle 包：`package.json` 的 `dsh.bundle.patch` + `cordis.patch.yml` | `packages/preset/agent-preset/skills/cordis-plugin-development/templates/decoration/package.json:13-20`、`cordis.patch.yml:1-3` |
| 需要 UI | 额外建 Client 包（`dsh.client` 清单 + `./client` 导出） | 同上 `package.json:13-20`；`packages/client/AGENTS.md` |
| 记忆子系统 | **Host 包 1 个 +（可选）Client 包 1 个 + storage 域声明**，事件只在必须审计时加 | 综合 §2/§3（推断：包拆分粒度按 Service Definition/Provider/Consumer） |

### 7.2 仓库内新包（以 `dsh-memory` 为例）的最小文件清单

```text
packages/<group>/memory/
  package.json     # name @deepseek-ai/dsh-memory, private:true, type:module,
                   # main lib/index.js, types lib/types/index.d.ts,
                   # exports{".":{types,default}}, cordis 在 peer+dev 同范围,
                   # 每个 dsh peer 在 devDependencies 镜像, schemastery 在 dependencies
  tsconfig.json    # extends tsconfig.base.json, rootDir src, outDir lib/types, references
  src/index.ts     # 函数插件: export const name / inject / Config / apply(ctx)
                   #   或服务插件: export default class XxxService extends Service
  src/types.ts     # 纯类型: domain 声明、SessionProjectionMap/SessionEventMap 合并
  locale/en.json   # 可选显示元数据 meta.title/description
  README.md        # 契约 + Model Experience + Known Limitations（README 有 gate）
  tests/xxx.spec.ts
```

配套登记：`tsconfig.host.json` 的 `references`；`package.json` 依赖加进 `packages/bundle/base/package.json`（或新 bundle）；`packages/bundle/base/cordis.patch.yml` 增加一行 `- {id: memory, name: '@deepseek-ai/dsh-memory', config: {...}}`。依据：`docs/cookbook/adding-a-package.md:9-40`；`packages/bundle/base/package.json:31-35`；`packages/bundle/base/cordis.patch.yml:15-18`。

### 7.3 记忆插件的骨架（可直接作为设计文档的接口草图）

```ts
// 1) 持久化：非会话域
const memorySpec = defineDomain({
  name: 'memory',
  version: 1,
  tables: { memories: domainTable(memoryRecordSchema) },
})
// 2) 服务：ctx.memory（Host）
export default class MemoryService extends Service { /* open(spec) / search / write / forget */ }
// 3) 工具：ctx.tools.register(defineTool({ name: 'memory_search' | 'memory_write', ... }))
// 4) 注入：agent/pre-step 里 next() 之后，向 decision.messages 追加 UserMessage
//    （source.kind 通过 MessageSourceMap 声明，V4 拒绝旧的 {kind:'plugin'}）
// 5) 可选审计：session.append('memory/write', {...})   // 需 catalog 重生成 + 持久化类型变更记录
```

依据：`packages/storage/storage-domain/README.md:36-58`；`packages/core/tools/src/index.ts:128`；`packages/core/agent/src/runtime-types.ts:350,270`；`packages/llm/llm/src/message.ts:110`；`docs/cookbook/adding-a-tool.md:49`。

### 7.4 ctx.effect / ctx.on 注册约定（凡是贡献都走 effect）

- 每个注册 API 返回 disposer；fiber 卸载即撤销（`docs/architecture.md:9-11`；`packages/core/tools/src/index.ts:126-152`）。
- waterfall 监听必须调用 `next()`（`docs/architecture.md:106`）。
- 可选依赖用 `ctx.get(name)`，不要用属性代理（packages/AGENTS.md）。
- 每会话隔离的注册用 `agent.ctx`（`docs/architecture.md:167`）。
- 注册即发布：先 await 注册再发布消费者（`packages/session/session-projection/src/index.ts:282-290`）。

---

## 8. 三个最大改造风险

**R1 ， 事件词汇表分叉 至 持久化兼容债（高）**
新增记忆/项目事件时，若漏做 catalog 重生成、持久化类型变更记录或忽略 `ignorable` 语义，症状是：读端拒绝打开老会话（`types.ts:509-519` 的"必需事件"规则）、`verify-persistence-catalog` 红、SDK/Web 快照漂移。ADR-0002 禁止改格式与迁移链，所以**唯一安全通道是 V4 内同版本扩展 + 兼容性记录**（`docs/session-format-status.md:35`、`docs/cookbook/reviewing-persistence-type-changes.md:80`）。缓解：记忆默认不写 session 事件，审计事件标 `ignorable: true` 并单独评审。

**R2 ， 记忆检索与压缩/清理互斥（高）**
压缩用 `replace` 遮蔽历史节点（compaction README:95），tool-result pruner / image-offload 会改写工具输出；若记忆的"来源证据"依赖被遮蔽的 `tool/result` 或 `user/message`，压缩后证据消失、KV 从首个遮蔽点失效（README:150）。缓解：记忆的原始证据写 storage（不参与 surface），session 里只保留指向证据的引用；在 `compaction/summary-error` 与 `agent/pre-step` 里做"先落盘后压缩"。

**R3 ， 项目制需要跨会话实体，而基座几乎全是 session-scoped（高）**
goal/todo/schedule/deliverables/subagent 全部按 Session 归属；唯一跨会话的 workspace 是 path-keyed、Host-only、对模型不可见（workspace README:151），且它与 archive 活动检查通过 `workspace/session-activity` / `workspace/session-stop` 两个事件协作（README:103），新 Project 若不接这两个事件，会出现"归档了项目但子任务仍在跑"的不一致。缓解：Project 先做 domain + service + UI 只读，再逐项接入 archive/stop 与 `remote-access` 权限。

**次要风险**：存储域 open 时全量载入内存（storage-domain README:94），记忆量增长会线性吃内存与启动时间；`kv` 后端无二级索引、无跨表事务（:146-147），向量检索必须自建后端 provider 或外置服务。

---

## 9. 推断清单（未直接读到实现，设计文档引用前需复核）

1. 把 `projectId` 放进 `SessionHeader` 会破坏读端兼容，**推断**，依据是 header 类型被 `SessionHeader.version` 严格盖章（`types.ts:95-100`）与读端按版本校验；未读到"禁止新增可选 header 字段"的显式规则。
2. 新增 `MessageSourceMap` kind 必定触发持久化类型变更记录，**推断**，依据是 `user/message` 类型指纹存在于 `docs/persistence-schema.json:65`，未实际改动验证。
3. `agent/pre-step` 的监听按注册顺序串行 await，**推断**，`docs/cookbook/extension-cookbook.md:111` 称其为 serial，而 `runtime-types.ts:350` 声明为带 `next()` 的 waterfall；两者精确组合语义需读 agent-loop 实现确认。
4. 记忆插件"新包 + 一行 bundle patch"即可在 `web` profile 生效，**推断**，依据是 base patch 的行插入模型与 `dsh plugin` 安装路径；未实跑。
5. Project 域可完全复用 workspace 的表结构模式（sessionIds 数组 + 操作链 + pendingMutation 标记），**推断**，workspace README:117 描述了该形状，未读到通用模板。
