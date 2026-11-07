# Panoptic Super 项目制工作模型设计（v0.1 草案）

> 状态：设计草案 ， 2026-11-07 ， 上位文档：[.ome/DESIGN.md](../DESIGN.md)
> 一句话：用户只创建一个"项目"并用自然语言对话，智能体负责把它拆成目标、任务、分工与验证，直到交付，而不是让用户在聊天窗口里手工串流程。

## 0. 为什么是"项目"而不是"会话"

| 维度 | 纯会话 | 项目制 |
|---|---|---|
| 状态容器 | 一次对话的历史 | 项目：目标、计划、任务、产物、记忆、资源上限、审计 |
| 连续性 | 会话结束即失忆 | 跨会话、跨天、跨设备继续同一件事 |
| 隔离 | 所有话题混在一起 | 项目级记忆/文件/资源隔离，避免互相污染 |
| 可审计 | 只能翻聊天记录 | 计划变更、任务状态、审批、产物版本都是结构化记录 |
| 可交付 | 聊天里贴结果 | 产物工作区（版本、预览、下载、溯源） |
| 可并发 | 单线程对话 | 多任务并行、子智能体分工 |

结论：Project 是本产品的一等公民；会话是项目内的对话线程，而不是产品的主容器。

## 1. 概念模型

```text
Project（项目）
 ├── Brief（项目章程）：目标 / 非目标 / 成功判据 / 约束 / 风险 / 资源上限
 ├── Goal[]（目标）：项目要达成的阶段性结果，可被评估
 │    └── Task[]（任务）：可分配、可验收的最小工作单元，构成 DAG
 │         └── Run[]（执行）：一次尝试，绑定执行者、上下文、日志、产物
 ├── Artifact[]（交付物）：文件/文档/代码/报告，带版本与来源
 ├── MemoryNamespace（记忆命名空间）：project 作用域的事实、决策、经验
 ├── Role[]（分工）：Lead / Researcher / Builder / Writer / Verifier 的能力预设（Human 为审批者，不是 Agent 角色）
 └── AuditLog：状态迁移、审批、资源、错误
```

关系规则：
- 一个任务至少属于一个 Goal；一个 Goal 至少产出一个可验收结果；
- Task 之间用 `blocked_by` 形成 DAG，禁止环；
- 一个 Artifact 必须能追溯到产生它的 Run 与证据；
- 一条项目记忆默认只在项目内可见（共享规则见 §8）。

## 2. 状态机

项目生命周期只约束需要交付的工作。日常问答由交互循环直接处理，不创建项目或任务；只有需要执行或修改项目的请求才进入任务阶段。交互循环、执行循环与学习循环共享项目状态，生命周期彼此独立。

所有任务、运行、审批与事件记录 commandId、correlationId 与 actor；有副作用的工具调用另带 idempotencyKey，用于恢复与去重。

### 2.1 Project

```text
draft 至 intake 至 planning 至 active ⇄ paused 至 verifying 至 delivered 至 iterating 至 archived
                                   └────────────至 failed（超限/能力/取消）
```

| 状态 | 含义 | 退出条件 |
|---|---|---|
| draft | 刚提出想法，尚未成章 | 进入 intake |
| intake | 澄清目标、约束、成功判据 | 用户确认 Brief |
| planning | 生成 Roadmap 与 Task DAG | 计划被接受（可自动或人工） |
| active | 执行中（任务在跑或排队） | 全部任务完成 / 阻塞 / 人暂停 |
| paused | 等待用户决策、审批、外部依赖或资源耗尽 | 解除后回 active |
| verifying | 交付前整体验证 | 通过或退回 active |
| delivered | 已交付 | 用户验收 / 进入 iterating |
| iterating | 基于反馈继续改 | 达到新的交付点 |
| archived | 结束（保留审计、产物、可导出） | ， |
| failed | 无法继续 | 人工决定重开或归档 |

迁移守卫：进 active 前必须有 1 条目标 + 完成标准 + 至少 1 项上下文来源；paused 必须记录原因；每次迁移写项目事件。

### 2.2 Task / Run / Artifact / Approval

采用与业界一致的三层状态词表（Project/Goal 是意图层，Task/Run 是调度层，Artifact 是交付层）：

```text
Task      : backlog 至 ready 至 assigned 至 running ⇄ waiting_input 至 verifying 至 done
                                                        └──────────至 failed（超限/轮次/超时）
                                                        └至 blocked / cancelled
Run       : queued 至 provisioning 至 running ⇄ paused 至 succeeded | failed | limit_stopped | cancelled | timed_out
Artifact  : draft 至 candidate 至 verified 至 delivered | rejected
Approval  : requested 至 granted | denied | expired
```

| 迁移 | 守卫（全部满足） |
|---|---|
| Task.backlog 至 ready | `blocked_by` 全部 done；写域与在跑 Run 不冲突 |
| Task.ready 至 assigned | 绑定角色预设 + 资源上限 + 验收判据 |
| Task.assigned 至 running | Run 创建成功（沙箱/会话就绪） |
| Task.running 至 waiting_input | 需要审批、缺材料或目标有歧义（必须写清缺什么） |
| Task.running 至 verifying | 产物已提交且证据非空 |
| Task.verifying 至 done | L0 通过，或（无 L0 时）L1 rubric 通过 + 证据齐全，或 L2 人工签字 |
| Task.verifying 至 running | 验证失败且剩余步数/时长 > 0 |
| Task.running 至 failed | 步数/时长/轮次超限（标 `resumable`） |
| Run.running 至 paused | 需人审/限流/沙箱异常；**未提交产物先落盘**，保留 checkpoint |

规则：
- 每次迁移产生事件（`task.state_changed` / `run.ended` / `verification.recorded`），状态可重放；
- `blocked` 必须列出缺失项，不允许"卡住了"这种无信息状态；
- 状态词表与 A2A 的 Task 状态可对齐，但 v0.1 不引入 A2A 协议。

## 3. 自然语言建项：从一句话到可执行计划

### 3.1 触发

- 用户说"帮我做一个 X / 我想做一个 Y / 把这个想法落地"；
- 系统识别为**新项目意图**，进入 intake，而不是直接开聊。

### 3.2 澄清（最多 3 个问题，可跳过）

只问会改变计划的问题，例如：
1. 交付形态（网页/文档/代码/报告/其他）与验收标准？
2. 截止时间与资源上限？
3. 已有素材/仓库/账号/约束（必须遵守的规则）？

规则：
- 能从上下文推断的不问；
- 用户说"你决定"就按默认假设推进，并在 Brief 里标注假设；
- 澄清问题以选项卡+自由输入呈现，避免一串文字提问。

### 3.3 生成 Project Brief

Brief 字段（结构化，可编辑）：

```yaml
goal: 一句话目标
non_goals: [明确不做的事]
success_criteria: [可验证的判据，至少 1 条客观判据]
constraints: [技术/合规/风格/资源上限/时间]
assumptions: [推断的前提，用户可改]
risks: [最可能失败的三件事]
limits: { maxSteps: N, maxTurns: N, maxSeconds: N }
```

Brief 必须让用户一次确认（"开始 / 修改 / 换个方向"），确认后写入项目记忆 L4。

### 3.4 生成 Roadmap 与 Task DAG

- 里程碑（3–7 个），每个里程碑对应一个可演示的结果；
- 任务粒度：单个 Run 内可完成（建议 ≤30 分钟）、有明确判据；
- 每个任务自动标注：`role`（researcher/builder/verifier/writer）、`depends_on`、`acceptance`、`limits`；
- 计划生成后展示为"任务图 + 预计时长与步数"，用户可删改、可一键接受；
- 计划不是一次性的：执行中允许修订，但每次修订写 `plan.revised` 事件并记录理由；
- **确认策略默认"风险自适应"**：首次建项确认一次 Brief + 计划摘要，之后自动推进；仅四类情况强制确认，不可逆动作/付款/外发、资源上限超过阈值、范围或交付物变更、置信度不足（无客观判据）。

### 3.5 示例（端到端）

用户："帮我做一个竞品分析网站，对比三家 AI 笔记产品，下周给团队看。"

```text
intake:
  Q1 交付形态 至 网页（可本地打开）
  Q2 期限/规模 至 下周五 / 3 个里程碑
  Q3 约束 至 中文、需来源链接、不采集登录后数据

plan:
  M1 资料收集（researcher ×2 并行）
  M2 结构化对比（analyst）
  M3 页面实现（builder）
  M4 验证（verifier：链接可点、数据与来源一致、移动端可用）
  M5 交付（artifact 版本 + 来源清单）

tasks:
  T1 收集公开资料并落 evidence（researcher）
  T2 提取对比维度与结论（analyst，依赖 T1）
  T3 实现页面（builder，依赖 T2）
  T4 自动校验：链接/引用/可访问性（verifier，依赖 T3）
  T5 生成交付说明与来源索引（writer）
```

## 4. 分工模型

### 4.1 角色 = 声明式能力预设，执行时实例化为 Run

| 角色 | 职责 | 能力预设 | 是否直接对用户 |
|---|---|---|---|
| Lead（主智能体） | 理解目标、规划、决策、集成、汇报 | 全工具 + 项目管理工具 | 是 |
| Researcher | 检索、阅读、取证 | web/fs/read + 只写 evidence | 否（回摘要） |
| Builder | 写代码/文档/页面 | fs/shell/sandbox + 产物写入 | 否 |
| Verifier | 独立验证，只看证据不看执行者叙述 | 测试/校验工具 + 只读产物 | 否（回报告） |
| Writer | 汇总、成文、来源索引 | fs/read + 模板 | 否 |

角色预设最小字段（存为 Markdown + frontmatter，与 `packages/skill`/`packages/preset` 同类）：

```yaml
role: verifier                   # 唯一名
description: 一句话说明何时用（会进路由上下文，≤2 行）
skills: [doc-templates]          # 引用的技能
tools: [read, grep, run_tests]   # 工具白名单，默认最小
model: { name: ..., effort: low }# 与主智能体分开配置
permissions: { mode: read_only, approval: { write: true, send: true, pay: true } }
context: isolated                # isolated | fork
limits: { maxSteps: N, maxTurns: N, maxSeconds: N }
return_contract: [summary, artifacts, evidence, failures]   # 固定
```

**分工原则**（来自产品调研）：
1. **执行者与验证者分离**：Verifier 只看产物与证据，不看 Builder 的自述结论；
2. **单一交接**：子执行单元只回 `{summary, artifacts[], evidence[], failures[]}`，不回多条消息、不直接对外沟通、不直接写主线产物；
3. **只在三种情况开子执行单元**：侧任务会污染主上下文（大量搜索/日志）、任务可并行且独立、需要工具面/模型隔离；决策强耦合的任务不拆；
4. **角色是一次性的**：任务结束即回收；长期"雇佣"角色需要多租户与计费前提（v0.1 不做）；
5. **并行受控**：并行 Run 上限默认 3；同写域不得并发；超限排队而不是拒绝；
6. **描述配额**：所有角色 description 合计纳入上下文配额（业界有 ~15k tokens 告警的教训），细节放进运行该角色时才加载的提示里。

### 4.2 分配规则

- 任务有 `role` 建议，但 Lead 可按依赖与资源改派；
- 需要跨任务判断的任务（拆解、集成、取舍）留给 Lead，不下放；
- 需要长上下文的任务（读整个仓库/长文档）优先给子智能体，主会话只留摘要；
- 验证类任务不得派给产出该任务的同一执行者。

### 4.3 AI 间交互契约（P1 默认拓扑 M1）：单次交接、无自由消息总线

**拓扑（唯一允许的形态）**

```text
                ┌──────────── 人（只与 Lead 对话）────────────┐
                │                                            │
              Lead（规划 / 派活 / 集成 / 汇报）               │
                │  SubagentRequest            │ VerificationRequest
                ▼                             ▼
          Worker（Researcher/Builder/Writer）  Verifier（只看产物+证据）
                │  SubagentResult             │ VerificationVerdict
                └────────────► Lead ◄─────────┘
Worker ↔ Worker：无直连，只能通过受控共享面（产物、项目状态、只读记忆）间接协作
```

**四条硬规则**

1. **单向交接**：父派活 至 子执行 至 子回一条结构化结果；子不回多条消息、不主动追问（缺信息就 `blocked` 并写清缺什么）、不直接对用户说话。
2. **上下文隔离**：子 Run 有独立会话与上下文，不继承父的完整历史；父只接收摘要 + 句柄（产物 id、证据 id、会话 id）。需要细节时父按句柄下钻，而不是把子会话整段拉回来。
3. **不开放自由消息总线**：AI 之间不通过群聊或消息总线协作。共享状态只经三个受控面读写，项目域（黑板：任务/产物/决策/假设）、文件工作区（按写域互斥）、记忆域（按 scope 只读）；事件日志是审计记录，不是通信通道。§4.4 说明何时从 M1 升级到 M2。
4. **验证者独立**：Verifier 不继承执行者上下文、不读执行者自述，只接收“产物 + 验收判据 + 证据”；能用 L0 脚本判的不用模型评审。

**台账（复核补充）**：协作状态里维护两份可审计台账，**任务台账**（事实/假设/计划，谁在做什么）与**进度台账**（每步自评是否在推进；卡住即触发重规划）。台账放项目域，不占对话上下文；Lead 的判断因此可被检查，而不是黑盒。

**交接数据结构（不是自然语言聊天）**

```ts
interface SubagentRequest {
  taskId: string; parentRunId: string;
  goal: string;                                  // 一句话目标（可执行）
  inputs: { artifactIds?: string[]; filePaths?: string[]; query?: string };
  acceptance: AcceptanceCriterion[];             // 验收判据，创建时就带
  tools: string[];                               // 工具白名单
  permissions: PermissionSpec;                   // 读写范围、审批要求
  limits: { maxSteps: number; maxTurns: number; maxSeconds: number };
  decisions: DecisionRef[];                      // 已确认的决策（共享决策，不共享轨迹）
  assumptions: string[];                        // 未言明的假设（子必须看到）
  forbidden: string[];                          // 禁止事项 / 约束
  upstreamDiffRef?: string;                     // 上游改动句柄（代码类任务）
  returnContract: ["summary", "artifacts", "evidence", "failures"]; // 固定
  deadline?: string;
}

interface SubagentResult {
  taskId: string; runId: string;
  status: "succeeded" | "failed" | "blocked";
  summary: string;                               // ≤N 行，父可读
  artifacts: ArtifactRef[];                      // 产物句柄
  evidence: EvidenceRef[];                       // 证据（命令输出/链接/截图/diff）
  failures?: { reason: string; recoverable: boolean }[];
  usage: { tokensIn: number; tokensOut: number; steps: number; ms: number; retries?: number };  // 不换算金额
}

interface VerificationRequest { taskId: string; artifactIds: string[]; criteria: AcceptanceCriterion[]; evidence: EvidenceRef[]; }
interface VerificationVerdict { verdict: "met" | "not_met" | "impossible"; reasons: string[]; fixes?: string[]; }
```

**并发、取消与升级**

- 并发上限默认 3；同写域不得并发（第二个 Run 排队或拒绝）；
- 父取消必须传播到子进程/子会话；子超时按 `timed_out` 返回，父决定重试或换方案；
- 子失败 2 次 至 升级（换强模型 / 换方案 / 转人工），不无限重试；
- 每个子 Run 有独立资源上限，超限 `limit_stopped` 并保留 checkpoint。

**哪些交互不允许**

- 子代理之间直接发消息、协商、投票（自由多智能体）；
- 子代理直接写主分支/主线产物或对外发送；
- 子代理绕过父直接调用高危工具；
- 把子会话的完整上下文回灌父会话（上下文污染与 token 爆炸的主因）。

**为什么不做自由对话式多智能体**

约 15× token 用量；MAST 实测多智能体系统失败率 41%–86.7%，失败集中在协调与系统设计；自由对话难以审计与复现。产品调研也印证：Claude Projects 的协调者只看线程回报、Manus 的主任务保持指挥权、Deep Agents 的子代理一次性只回报告，行业收敛到的就是“中心化编排 + 单次交接”。A2A 属于跨厂商互操作协议，v0.1 不引入；未来若引入，作为对外适配器，不改内部拓扑。
### 4.4 协调策略层：按任务规模选择协作范式

在项目域与调度器之间加一层（Host 插件 `coordination`，不是 Agent）：

```text
信号 至 规则打分 至 边界带（可选小模型） 至 CoordinationDecision 至 调度器执行
```

| 信号 | 影响 |
|---|---|
| 交付物数量与类型 | 单产物 至 solo；多产物 至 编排/并行 |
| 可分解性（独立子任务数） | ≥3 且写域不冲突 至 blackboard |
| 预估步数/时长 | 超单上下文阈值 至 上下文包 + 拆分 |
| 领域广度 | 跨域 至 分工 |
| 判据清晰度 | 模糊 至 先澄清，不并行 |
| 风险等级 | 不可逆/付款/外发 至 加审批或 human |
| 写域冲突 | 冲突多 至 串行或分区 |
| 资源上限 | 紧 至 便宜模式 |

**默认策略（用户 2026-11-07 确认）：最小充分范式 + 按证据升级。**

| 默认 | 升级触发 |
|---|---|
| solo | 上下文 >70%、同一步失败 2 次、独立子任务 ≥3 至 orchestrator |
| orchestrator | 任务数 >5、需并行缩短时延、写域不冲突 至 blackboard；阶段固定 至 pipeline |
| blackboard | 里程碑 >5 或跨领域 至 两级扇出；高风险证据冲突 至 debate（仅离线复核） |

控制规则：
1. 规则优先（确定性、可单测、毫秒级）；模型只在边界带使用且可关闭；
2. 迟滞：同一信号持续或超阈值才切换；只在项目启动、里程碑、阻塞事件重评估；
3. 切换前必须 checkpoint + 生成上下文包；禁止运行中频繁切换；
4. 决策写审计（signals/scores/mode/rationale/decidedBy），节点详情可见；
5. 用户可在项目级强制模式（auto/solo/orchestrator/blackboard），改动写审计。

**为什么不默认多 Agent**：多 Agent 约 15× 用量、协调失败率高（MAST 41%–86.7%）；小任务用编排是负收益。策略层的价值是"该简单时简单，该拆分时有据可依"。

**复核修订（2026-11-07，见 ADR-0006）**：
1. 模式收敛为 M0 / M1 / M2（项目域状态模型 + 均匀扇出）/ M3 / M4（两级扇出）/ M6；M5 辩论移出运行时，仅离线复核；
2. 任何 M2 及以上进入默认路径前必须有 **pass^k A/B 证据**（D9 门槛）；
3. 决策对象收敛为三元组（并行度 / 隔离级别 / 人工闸门）+ mode 标签，避免"评分选拓扑"的过度设计；
4. **任务台账与进度台账**放项目域，作为协作状态的权威记录；
5. Run 携带身份与能力声明（角色、工具白名单、来源、审批人），审计只认该身份（D10）。
## 5. 验证闭环

### 5.1 判据分级（每个任务至少 1 条，创建时就写）

| 级别 | 判据类型 | 例子 | 失败后 |
|---|---|---|---|
| L0 脚本（首选） | 命令 + 期望结果 | `pnpm test` 退出码 0；`report.md` 含 ≥3 个带日期的一手链接；链接返回 200 | 回 running，附 stderr 摘要，重试上限 2 次 |
| L1 独立模型评审 | 3–5 条 rubric，评审器只看证据、不产出 | "三条对比结论均有来源且口径一致"；"回答原问题" | 返回 not-yet + 理由作为下一轮指导；连续 3 次 not-yet 升级 L2 |
| L2 人工 | 人看证据（录屏/diff/摘要）后签字 | 视觉、语气、商业判断 | 打回必须带理由，写入项目记忆 |

三条硬规则：
1. 能用 L0 就不用 L1；L1 不能替代 L0；L2 只用于价值判断；
2. **评估器与执行者分离**：同一 Run 的自我总结不计入验证；评估器不调用产出工具；
3. 验收判据在任务创建时必须存在（哪怕只是"人工签字"），运行中不得临时放宽；无 L0 的任务在创建时标注"仅人工验收"。

### 5.2 验证流程

```text
Task 完成 至 Verifier 拿"判据 + 产物 + 证据"（不看执行者叙述）
  至 逐条判定 pass/fail/uncertain
  至 全 pass：任务 done，产物入库
  至 有 fail：生成可执行的修复指令，退回执行者（重试上限 2 次）
  至 仍失败：升级 Lead 决策（换方案/降级/请求人工）
```

### 5.3 证据与可追溯

每个任务完成时固化：
- 执行命令与输出（或摘要 + 句柄）；
- 产物路径 + 版本 + 哈希；
- 来源链接（研究类任务）；
- 判定记录（谁判的、依据哪条判据）。

证据缺失的"完成"不算完成；无判据的任务不允许进入 `done`。

## 6. 人在环

| 触点 | 何时 | 形式 |
|---|---|---|
| Brief 确认 | intake 结束 | 结构化卡片，一键开始/修改 |
| 计划确认 | planning 结束 | 任务图 + 时长预估，可编辑 |
| 高危审批 | 写文件/付款/外发前 | 审批卡（动作、目标、风险、证据） |
| 里程碑验收 | 每个里程碑 | 产物预览 + 验证报告 |
| 超时告警 | 步数/时长 50%/80%/100% | 通知 + 可调上限 |
| 随时接管 | 任意时刻 | 用户插话即进入对话，模型回报当前状态并继续 |
| 待办收件箱 | 任意时刻 | 审批/阻塞/待验收/超时告警聚合成一个入口，处理完即消失 |

原则：**模型自行掌管对话，但关键决策与不可逆动作由人把关**；人不在场时项目可暂停等审批，不静默越权。

## 7. 交付物与版本

- Artifact = 文件/目录/报告，带 `version`、`sha256`、`provenance`（哪些 Run、哪些证据产生）；
- 同一交付物重跑产生新版本，不覆盖历史；
- 支持预览（Web）、下载、回滚到任意版本；
- 项目关闭时导出：Brief + 计划 + 产物 + 决策记录 + 来源清单（可交接给别人）。

## 8. 记忆与上下文的项目化

- 记忆作用域默认 `project:<id>`；用户级偏好（称呼、语言、沟通风格）放 `user` 作用域；
- 项目记忆存 `memory` 域（storageDomain + SQLite/FTS，见 ADR-0005）；`MEMORY.md` 仅作可选的 L4 索引投影（可重建），不是第二套存储；索引注入上下文，正文按需检索；
- 跨项目共享白名单：`preference`、`procedure`（经验）可共享；`fact`、`decision` 默认不共享，除非用户显式导出；
- 项目归档时：项目记忆转冷存储，用户级偏好保留；删除项目 = 级联删除项目记忆与索引（保留删除审计元数据）；
- 项目第一天就要支持**导出与删除**（`project export` / `project delete`）：导出 Brief、计划、任务状态、产物清单、决策记录、来源索引；删除必须可验证、可级联（业界多数产品没做，是本地优先的机会）；
- 上下文注入优先级：项目画像 > 项目约束/决策 > 用户偏好 > 历史经验。

## 9. 数据模型

```sql
CREATE TABLE project (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL,
  brief_json TEXT NOT NULL, limit_json TEXT NOT NULL,
  workspace_path TEXT, created_at TEXT, updated_at TEXT
);
CREATE TABLE goal (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, title TEXT NOT NULL,
  success_criteria_json TEXT, status TEXT NOT NULL, order_index INTEGER
);
CREATE TABLE task (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, goal_id TEXT NOT NULL,
  title TEXT NOT NULL, description TEXT, role TEXT,
  acceptance_json TEXT NOT NULL,          -- [{kind: exec|rubric|human, spec}]
  status TEXT NOT NULL, assigned_run_id TEXT,
  limit_json TEXT, evidence_json TEXT,
  created_at TEXT, updated_at TEXT
);
CREATE TABLE task_dependency (task_id TEXT, blocked_by TEXT, PRIMARY KEY (task_id, blocked_by));
CREATE TABLE run (
  id TEXT PRIMARY KEY, task_id TEXT NOT NULL, agent_kind TEXT,  -- lead|subagent
  role TEXT, model TEXT, status TEXT NOT NULL,
  started_at TEXT, ended_at TEXT, tokens_in INTEGER, tokens_out INTEGER,
  steps INTEGER, summary TEXT, artifact_ids_json TEXT, error_json TEXT
);
CREATE TABLE artifact (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, run_id TEXT,
  path TEXT NOT NULL, mime TEXT, version INTEGER NOT NULL,
  sha256 TEXT NOT NULL, provenance_json TEXT, created_at TEXT
);
CREATE TABLE audit_event (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT, at TEXT,
  actor TEXT, action TEXT, target TEXT, detail_json TEXT
);
```

## 10. 接口

项目管理工具（模型可调用）：
- `project.create({ name, brief, limits })`；
- `project.plan({ projectId, milestones, tasks })` / `project.revise(...)`；
- `task.assign({ taskId, role })` / `task.complete({ taskId, evidence })`；
- `task.verify({ taskId, verdict, basis })`；
- `artifact.publish({ projectId, path, provenance })`；
- `project.status({ projectId })`。

服务层（UI/RPC）：项目列表、详情、任务图、产物、审计、审批、资源上限。

## 11. 与 DSH 基座的映射（依据 [.ome/research/06-repo-seams.md](../research/06-repo-seams.md)）

| 本设计概念 | 基座落点（已读确认） | 说明 |
|---|---|---|
| Project | 新 `storage-domain` 域（`defineDomain({name:'project', version:1})`，七张表见 §9）+ 新 Host service `ctx.projects` + Remote controller + Client slot | 基座无跨会话项目实体；**不要把 projectId 写进 `SessionHeader`**（会改持久化头类型与所有读端） |
| 会话归属 | 域侧维护 `projectId 至 sessionIds` | 等价 workspace 的 `sessionIds` 模式；与会话日志弱关联 |
| Workspace（复用） | `ctx.workspaceRegistry` | 提供"命名目录 + 会话归属 + 归档/置顶"的实现模式与归档事件协调（`workspace/session-activity`、`workspace/session-stop`） |
| Goal | `ctx.goals`（同会话单目标，默认 256 轮） | 项目可映射到"每个执行会话一个 goal"；goal 激活是进程内状态，重启需重新 arm |
| Goal 轮驱动 | `goal-round-driver` | 回合边界续跑的模式可直接照抄 |
| Plan / Todo | `ctx.planMode` + `todo/write` 投影 | 计划模式与待办都是会话内视图，不是持久任务树 |
| Task / Run | 新 project 域 + `core/agent-loop` + `ctx.subagents.registerProvider` | 任务树自己建；执行复用循环与子智能体 |
| 验证 | `guard/*`（`tools/post-execute`、`agent/pre-step`）+ 测试工具 | 校验器插件，与执行者分离 |
| 定时/续跑 | `ctx.schedule` + goal round driver | 任务按 Session 归属，项目归属存 project 域 |
| 产物 | `deliverables`（`present` 工具 + `workspace/changes` 事件） | 产物是 turn 级记录，跨 turn/跨会话聚合需自建读写模型 |
| 审计 | session 事件（执行轨迹）+ project 域审计表（业务事件） | 双轨：轨迹在会话、状态在项目域 |
| UI / 交互 | 图谱投影 + 节点详情 + 收件箱（Client 组件） | 默认看项目图；聊天记录是节点的"记录"页签（见 [interaction.md](interaction.md)） |

约束：
- 项目状态不是会话日志的替代品：**项目是业务状态，会话是执行轨迹**，项目记录引用会话/事件 id；
- 项目归档必须接 `workspace/session-activity` / `workspace/session-stop` 语义，否则出现"项目已归档但子任务仍在跑"；
- 新增 session 事件能不加就不加；必须加时按 V4 同版本扩展 + catalog 重生成 + 类型变更记录（见 06-repo-seams R1）。

## 12. 失败模式与对策

| 失败模式 | 表现 | 对策 |
|---|---|---|
| 目标漂移 | 越做越偏，最后交付的不是用户要的 | Brief 锁定 + 每次修订记录 + 里程碑回看 |
| 任务爆炸 | 拆出上百个微任务，管理成本大于执行 | 任务粒度约束（单 Run 可完成）+ 上限 + 合并 |
| 假验证 | "我做完了"但没跑测试 | 判据先行 + 验证者分离 + 证据缺失不算完成 |
| 资源超限 | 无限重试/死循环 | 任务/项目级硬熔断 + 重试上限 + 用量可见 |
| 并发写冲突 | 两个子智能体改同一文件 | 写域声明 + 冲突检测 + 串行化 |
| 上下文污染 | 子任务细节挤占主会话 | 子智能体只回摘要 + 产物句柄 |
| 审批阻塞 | 人不在，任务卡住 | 暂停 + 通知 + 可批量审批；不静默降级安全策略 |
| 记忆串项目 | A 项目的事实进入 B 项目 | 服务端 scope 强制过滤 + 共享白名单 |

## 13. 指标

| 指标 | 定义 | v0.1 目标（草案） |
|---|---|---|
| 项目完成率 | held-out 项目任务中按判据交付的比例 | ≥ 60% |
| 任务一次通过率 | 无需退回即通过验证的任务占比 | ≥ 70% |
| 人工介入率 | 需要人决策/修改才能继续的项目占比 | ≤ 20% |
| 返工率 | 被验证退回的任务占比 | ≤ 25% |
| 交付周期 | 从 Brief 确认到 delivered 的 P50/P95 | 按项目类型分档 |
| 单项目资源 | 时长 / 步数 | 上限熔断 |
| 可复现率 | 同项目重跑得到可用交付的比例（pass^3） | ≥ 50% |

## 14. 里程碑

| 阶段 | 交付 | 判据 |
|---|---|---|
| P1 最小项目 | 建项、Brief、任务列表、单线程执行、产物 | 一句话建项并跑通一个 3 任务项目 |
| P2 分工与验证 | 子智能体角色、DAG 并行、验证器、证据 | 任务一次通过率可测量 |
| P3 人在环 | 审批、里程碑验收、超时告警、随时接管 | 高危动作全部经审批 |
| P4 长任务 | 定时续跑、跨天恢复、项目归档与交接 | 项目可暂停 24h 后继续 |

## 15. 待决问题

已决（2026-11-07）：1）模型分层见 ADR-0004 D2；2）计划确认见 BRIEF 决策 4；3）验证器独立性见 ADR-0004 D2 与 §4.1。

1. 项目与 Git 仓库的关系（一个项目一个目录？多仓库？）；
2. 项目模板（常见项目类型预置 Brief/任务图）是否进 v0.1；
3. 角色 description 的 token 总配额与路由策略（多角色时如何选人）；
4. 项目记忆的淘汰策略（业界未公开，需自定容量/时效/热度规则）；
5. 项目数据可移植性（导出格式、跨设备导入）在 v0.1 的边界。
