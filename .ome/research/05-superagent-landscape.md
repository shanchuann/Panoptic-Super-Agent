# 超级智能体市场与工程方案调研（产品 ， 编排范式 ， 工程实践）

> 任务：task-2 ｜ 作者：market-researcher ｜ 日期口径：2026-11-07（Asia/Shanghai）
> 交付物：本文件（唯一写入）。**不改** `.ome/DESIGN.md`、`.ome/design/*` 与源码。
> 与既有调研的关系：`01-architectures.md` 回答"架构怎么选"，`02-capabilities.md` 回答"能力与上下文怎么做"，`03-eval-market.md` 回答"怎么评、市场什么价"；本文只回答**产品形态（项目制/长任务/交付物）与可落地的编排机制**，重复处直接引用既有已核事实，不重新推导。冲突数字并列、不取平均。

---

## 0. 一页结论（12 条）

1. **"项目制"已经被三家做成产品，且形态高度收敛：一个协调者 + 若干隔离执行单元 + 共享的项目级记忆**。Claude Projects（2026-09-17）叫 coordinator + threads，Manus Projects/Parallel Tasks 叫 main task + tasks，Genspark GenTeam 叫 group chat + teammates。三者都不是"多智能体自由对话"，而是**有中心的层级编排**，与 00-synthesis D1（单循环 + 受控 subagent）不冲突，是它的产品化外壳。【事实，一手 ×3】
2. **项目级对象的真实构成只有五样**：目标（一行）、指令（standing instructions）、知识库/仓库（context sources）、记忆（可增删的文件索引）、产物库（Library/PR/artifact）。四家产品的项目设置页都能一一映射回这五样，这是"Project"能落地的最小定义。【事实，一手，Claude/Manus 已核；GenTeam 部分推断】
3. **规划与执行的分离点是"协调者只看摘要、执行者各自持有完整上下文"**。Claude 明确写：协调者"看到线程回报的内容，而不是每一步"；Manus 明确写主任务负责"检查进度、读结果、下发修改"；Deep Agents 的子代理"只回一份最终报告、无状态"。【事实，一手】
4. **验证正在从"模型自查"转向"独立评估器 + 客观证据"**。Claude `/goal` 每轮结束后由一个**独立的快模型**判定 met / not-yet / impossible，并带不可满足与无进展停止；Devin 在 PR 后进入 testing mode，跑起来录屏当证据；Codex 用 computer/browser 工具"验证直到满足要求"。【事实，一手 ×3】
5. **记忆的工程形态是"索引文件 + 按需打开"**，不是向量库。Claude 的项目记忆是 `MEMORY.md` 索引 + 其他文件按需读取；CLAUDE.md / AGENTS.md 是常驻；Deep Agents 的 memory 也是 AGENTS.md 常驻 + 虚拟文件系统。**这直接支持 00-synthesis 的"先文件 + 摘要"结论**。【事实，一手】
6. **compaction 必须与事件日志分离，且"压缩后重新注入什么"是有明确清单的工程问题**。Claude Code 列出压缩后逐项处理：系统提示、项目 CLAUDE.md、auto memory、技能描述、plan、路径规则按需重载、最近修改的 5 个文件、已调用技能正文（单 5k/总 25k 上限）、后台任务继续跑。**照抄这张表比自己发明压缩策略更划算**。【事实，一手】
7. **"多智能体"在产品层是限量供应的**：Claude 的 agent teams 仍标 experimental 默认关闭；Managed Agents 的多智能体协调仍是 research preview；Manus 的 Wide Research 只在"很多相似条目"时启动。反例是 Genspark GenTeam 直接卖"角色团队"，但其单位是"一个角色 + 一台云电脑"，不是自由对话。【事实，一手】
8. **工具目录是固定税，官方解法已标准化为 Tool Search + 代码执行**：58 个工具 ≈ 55K tokens；50+ 工具约 72K；Anthropic 见过 134K 的工具定义。PTC 让复杂研究任务 43,588至27,297 tokens（−37%），Tool Search 把可用上下文 122,800至191,300。【事实，一手，转引 02-capabilities #11】
9. **MCP 2026-07-28 是断代式变更，不是小版本**：移除协议级会话与 `initialize` 握手、每请求带版本与能力、新增 `server/discover`、`subscriptions/listen` 取代 GET+subscribe、删 `ping`/`logging/setLevel`、tasks 移出核心成为扩展并用轮询 + `tasks/update`。**按 2025 教程写会整层返工**。【事实，一手规范】
10. **A2A v1.0 的 Task 状态机可以直接借来做 Task 的状态词表**（submitted / working / input-required / completed / canceled / failed / rejected / auth-required 一类），并已加入 Agentic AI Foundation；但它解决的是**跨厂商 agent 互操作**，不解决本项目 v0.1 的内部编排，属于"可对齐、不引入"。【事实，一手规范 + 推断】
11. **最容易被抄错的是"角色 = 多 agent"**。四家的"角色"都是**声明式的执行配置**（技能 + 工具白名单 + 模型 + 权限 + 提示词），执行时才实例化，且默认一次性、只回摘要；Genspark 的"雇佣"卖的是**长期实例 + 独立云电脑 + 独立记忆**，那是另一种产品假设（订阅制、多租户），本项目 v0.1 不具备其前提。【推断，依据见 §2.5、§5】
12. **本报告判断的最大风险不是模型能力，而是"假完成"**：所有厂商都在补"验证"，说明模型自述完成不可信；若我们的项目制只做到"计划-执行-汇报"，没有 L0 脚本与 L1 独立评审，用户第一次遇到"报告很漂亮但文件是空的"就会流失。**验证层是 P0，不是 P1**。【推断】

---

## 1. 取证方法与证据等级

| 等级 | 含义 | 本文用法 |
|---|---|---|
| 【事实，一手】 | 我 fetch 到厂商官方文档/规范/博客原文，关键句可复述 | 产品行为、协议条款、官方自述的性能数字 |
| 【厂商自述】 | 官方文本里的效果数字（无第三方复现） | 标注"厂商自测"，不当结论 |
| 【独立评测】 | 第三方评测/论文 | 仅用于长任务成功率、成本等（主要引 03） |
| 【推断】 | 我基于证据的判断 | 全部标【推断】，供 Lead 取舍 |

**取证限制（必须如实记录）**：
- 本环境 `github.com` / `huggingface.co` 不可达（01 已记录）；本文未使用 GitHub 原始仓库作证据。
- 部分厂商页为 JS 渲染或反爬（Genspark 定价、Manus 定价），**故本文不写任何具体价格**。
- 部分页面经文本代理（r.jina.ai）读取正文；正文与直连一致，但**丢失发布日期的页面在表中标"日期不详"**。
- Devin / Gemini CLI / Codex 的文档页无发布日期，标"日期不详"，但功能描述取自当期官方文档（2026-11 读取）。

---

## 2. 产品篇（2025–2026，重点是项目制 / 长任务 / 交付物）

### 2.0 能力对照总表

| 产品（版本/日期） | 项目如何组织 | 规划与执行如何分工 | 验证 / 自检 | 记忆与上下文 | 人如何介入 | 等级 |
|---|---|---|---|---|---|---|
| **Manus Projects + Parallel Tasks**（Projects 2025-12-01；2.0 2026-09-28） | Project = 主指令 + 知识库 + 技能/连接器；任务在项目内派生 | 主任务（main task）派发若干独立 task；主任务保留指挥权，各 task 有独立对话与结果 | 未见独立评估器；靠人逐条 review 各 task 结果，主任务核对事实一致性 | 项目上下文自动注入每个新 task；Branch 复制对话到某条回复 | 主任务里发指令给单个/全部 task；feedback 只留在本 task | 事实，一手 |
| **Claude Projects（Claude Code，2026-09-17 起 beta）** | 一个项目 = 一个协调者会话 + 若干 thread（每个是云 session，独立分支/仓库副本） | 协调者 scope 至 派活 至 并行 至 汇总；thread 内可用 subagents/loops/workflows 再拆 | thread 开 PR + 跑测试；人 review PR；冲突按 merge conflict 处理 | 项目记忆（`MEMORY.md` 索引 + 文件，按需打开）；每条 thread 自动 compaction；"协调者只看回报不看每一步" | Overview 六态分组（Ready for review/Waiting on you/Working/Landing/Idle/Resolved）；thread 内审批 | 事实，一手 |
| **Claude Managed Agents**（2026-04-08） | 无"项目"概念，只有 session + 编排 harness；适合嵌进别人的产品（Notion/Asana/Rakuten） | harness 决定何时调工具、如何管上下文、如何从错误恢复 | "定义 outcome 与成功标准，Claude 自我评估并迭代"（research preview）；内部测试结构化文件生成 +10 点 | session 持久事件日志 + memory + checkpointing；断连后进度与产物仍在 | scoped permissions + Console 全链路 trace | 事实，一手（+10 点为厂商自测） |
| **Claude `/goal`**（文档期 2026-11） | 会话级目标 | 不派活；同一会话继续跑下一轮 | **独立快模型**每轮判定 met / not-yet / impossible；无进展（连续多轮无工具调用）自动停 | 不引入新存储；靠 transcript | 随时 `/goal clear`；条件里可写"X 轮后停" | 事实，一手 |
| **OpenAI ChatGPT Work**（2026，日期不详） | 以"任务/项目"为单位持续数小时；产出 sheets/slides/docs/web apps | 自行把大目标拆成更小步骤并独立完成；跟进、提问、改方向 | "approve important actions" 是审批而非验证；验证更多靠可见产物 | 跨步骤携带上下文；Scheduled Tasks 让它离屏继续 | 全程可看进度、答问、改向、审批关键动作 | 事实，一手（无独立验证描述） |
| **OpenAI Workspace agents**（2026，日期不详） | 组织内共享的 agent（GPTs 的演进），在 ChatGPT/Slack 里被调用 | 由 prompt + 文件自动生成步骤、接工具、加技能 | "testing it until it works the way you expect"（人工试跑） | 组织权限内的系统接入 | 组织权限/审批；研究预览 | 事实，一手 |
| **OpenAI Agents SDK / Sandbox Agents** | 代码层：Agent + handoffs + sessions + sandbox | **harness 与 compute 分离**：harness 拥有 loop/工具路由/handoff/审批/trace/恢复/run state | guardrails + hooks + tracing；审批点 | session context + sandbox 快照可恢复 | interrupt / 审批 tool call | 事实，一手 |
| **Codex**（2026，日期不详） | 云端任务 + 每仓库可复用云环境；可在 ChatGPT/IDE/CLI 同一账号续跑 | "runs many agents in parallel" | **用 computer 与 browser 工具验证直到满足要求**；自动 review PR | `AGENTS.md` | 跟进、steer、review 结果 | 事实，一手（厂商页） |
| **Devin（Cognition）** | session 为单位；按 Slack/Jira/API 派活；迁移类用 skill 批量跑并行 session | Devin 自定计划并执行；人在 IDE 接手草稿 | PR 后 **testing mode**：读 diff 至 排最小测试计划 至 桌面执行 至 录屏附件当证据 | Knowledge + `AGENTS.md` + 仓库索引 + skills（`.agents/skills`） | 会话内问答/审批；PR review；"pre-approve testing" | 事实，一手 |
| **Genspark GenTeam**（2026，日期不详） | 项目用 group chat 表达；任务有状态、唯一 assignee、独立 thread | "雇佣"角色 至 @ 或派任务 至 角色在**自己的云电脑**上干完交文件 | 未见独立验证环节（厂商页强调"交付成品"） | 每个角色保留自己的历史与上下文（"三周前的对话新 agent 能接上"） | 群里可 @；DM 私密；权限按创建者身份 | 事实，一手（细节为厂商自述） |
| **Microsoft Foundry / Agent Service**（Build 2026，2026-06） | hosted agent + 每 session 独立沙箱；routines 定时/事件触发；可发布到 Teams/M365 | harness 可换（MAF/LangGraph/Copilot SDK/Claude Agent SDK） | **闭环**：OTel trace ↔ 评估 ↔ Agent optimizer 生成候选改进并对场景验证；ASSERT 造对抗测试；Agent Control Specification 运行时护栏 | 每 session 独立 compute/memory/fs；长跑 agent 有 durable state；procedural memory | 权限/身份/审批；审计与回滚 | 事实，一手 |
| **Gemini CLI**（subagents 2026-04-15） | 无项目层；单会话 + 子代理 | 主会话当 orchestrator，按 description 路由到最合适 subagent | 子代理内部跑测试/工具，回一份整合结果 | 子代理独立上下文，只回摘要/结构化结果（官方明说避免 context rot/pollution） | 主会话里看进度；`.gemini/agents` 可提交共享 | 事实，一手（厂商博客） |

> 读表要点：**只有 Claude Projects / Manus Projects / Genspark GenTeam 三家的"项目"是产品的一等对象**；其余是"会话/任务"级。这直接决定我们的设计参照点。

### 2.1 Manus：项目是"上下文的容器"，并行任务靠主任务指挥

**项目/任务如何组织**（[Projects 文档](https://manus.im/docs/features/projects)，2025-12-01 发布，2026-11-07 读取）
- 一个 Project = **master instruction（主指令）+ 知识库（上传文件）+ 技能 + 连接器**；项目内新任务自动继承。
- 项目与任务默认私有；邀请同事进项目只共享主指令与知识库，**对方只看得到自己创建的任务**，要共享某个任务得单独邀请。

**规划与执行如何分工**（[Parallel Tasks 文档](https://manus.im/docs/features/parallel-tasks)）
- 你描述一个"多部分目标"，Manus **为每一部分创建一个 task，全部同时跑**；发起请求的那个 task 是 **main task，保持指挥权**：能查进度、读每个 task 的结果、把修改发给某一个或全部 task。
- 每个 task 有自己的对话与结果；**在一个 task 里给的反馈只留在那个 task**。官方最佳实践是"先建 Project 再拆并行"，否则每个 task 只拿到一段短 brief。
- 三种"复制"语义要分清：**Wide Research** = 很多相似条目 至 一个合并结果（数百个独立 agent，各自独立上下文）；**Branch** = 从某条回复复制对话/文件/指令开新任务，原任务不变（本地 git 可选 worktree 隔离，未提交改动不复制）；**Parallel Tasks** = 多个交付物，各自独立结果。

**验证/自检**：未见独立评估器。验证发生在人身上，逐 task review，再回主任务核对"四个草稿用的是不是同一套事实"。
**记忆与上下文**：项目上下文注入；Branch 复制；2.0 的 **Cascade** 按需加载能力（"项目从轻开始，需要时才引入专门能力"，官方自测 token −23.2%、耗时 −28.2%、成本 −32%，单一配置，属厂商自测）。
**人如何介入**：主任务里下指令；各 task 内单独 review。
**启示**：Manus 的"主任务 = 指挥 + 各任务 = 独立结果"是**最省事的分工模型**，不需要跨 agent 消息总线，只要"父读子结果、父下发修改"；代价是父没有子过程的完整 trace（与 Claude 同构）。

### 2.2 Claude：目前"项目制"做得最深的产品（三个层次要分开看）

**(a) Claude Code Projects（2026-09-17 起 beta，[发布文](https://claude.com/resources/articles/projects-redesigned)、[文档](https://code.claude.com/docs/en/claude-projects.md)）**

- **组织**：一个项目 = **一个协调者会话 + 它派出的 thread**。每个 thread 是一个云 session（自己的分支与仓库副本），跑完回报；需要本机能力时可让某个 thread 通过 Remote Control 在用户机器上跑。
- **分工**：协调者"scope 请求、派活、协调并行线程、review 产出、拼装最终结果"；**协调者看到 thread 回报的内容，而不是每一步**。thread 内部还能再拆 subagents/loops/workflows。
- **冲突处理**：多个 thread 改同一处代码时，**按普通 PR 的 merge conflict 解决**，非常务实的默认值，避免自研冲突合并。
- **上下文构造**：每条云 thread 启动时拿到 ① 项目仓库与文件 ② 项目指令与记忆 ③ 各仓库的 `CLAUDE.md` ④ 账号 connectors ⑤ 云环境（网络、环境变量、密钥、预装工具）。**刻意不加载**仓库里的 skills / `.claude/settings.json` / `.mcp.json`（安全与一致性取舍）。
- **记忆**：**项目记忆 = 文件**。索引文件 `MEMORY.md` 每条云 thread 启动时都读，其余文件按需打开；用户在 Project settings > Memory 可读/改/删。项目指令另一层：**≤16,000 字符**，写给每条新 thread 的 brief（官方模板含"完成后怎么自证"与"缺东西就停下说清楚，不要替代/模拟/猜测"）。
- **状态与人介入**：Overview 把 thread 分成 **Ready for review / Waiting on you / Working / Landing / Idle / Resolved** 六组；thread 内审批**不能**从项目会话代答（"telling Claude in the project conversation to go ahead doesn't reach it"）。
- **成本/上下文**：项目不让人管窗口，**thread 自动 compaction**，项目会话"从最近消息 + 最近线程 + 项目记忆工作，而不是完整历史"；按项目看 token；协调者与 thread 可分别设模型与 effort。
- **已知限制（重要）**：项目属单个用户、**不能共享**；thread 不能跨项目移动；**云沙箱在轮次之间暂停，恢复失败会从新 clone 继续，未提交改动可能丢**（官方建议长任务中途 commit/push）；beta 期无组织级管控。

**(b) Claude Managed Agents（2026-04-08，[发布文](https://claude.com/blog/claude-managed-agents)）**

- 面向"把 agent 嵌进自己产品"的团队：托管 harness + 生产基础设施（state、memory、permissions、scheduled execution）；文档口径含沙箱化代码执行、checkpointing、凭证管理、作用域权限、端到端 tracing；**长会话可自主跑数小时，断连后进度与产物仍在**。
- **验证的官方立场**："你定义 outcome 与成功标准，Claude 自我评估并迭代"（research preview），**模型自评**路线，与 Claude Code `/goal` 的"独立评估器"不是一回事，不要混用。
- 厂商自测：结构化文件生成任务 outcome 成功率比标准提示循环最多 +10 点，难题收益更大（**厂商自测，未独立复现**）。
- **可抄的是"brain/hands/session 解耦 + session 是 harness 之外的事件日志"**（01 已核），不是它的自评迭代。

**(c) Claude Code 的 `/goal`（验证闭环的现成范式，[文档](https://code.claude.com/docs/en/goal.md)）**

- 机制：设一个完成条件 至 每轮结束后把"条件 + 到目前为止的对话"发给**配置的 small fast model** 至 三种裁决：**not yet met（把理由当作下一轮指导）/ met（清目标并记账）/ impossible（清目标并记失败）**。
- 三个工程细节值得直接抄：① **条件是给评估器看的，不是给执行器看的**，评估器不跑命令、不读文件，只在 transcript 里找证据，所以条件必须写成"执行器的输出能证明的样子"；② **无进展保护**：连续多轮没有工具调用就停循环、警告、把控制权还给人；③ **边界**：条件 ≤4,000 字符，可写"或 20 轮后停"，状态里能看到轮数、token 花费、评估器最近一次理由。

### 2.3 OpenAI：产品层"长任务"，平台层"harness 与沙箱分离"

- **[ChatGPT Work](https://openai.com/index/chatgpt-for-your-most-ambitious-work)**（2026，日期不详）：官方描述"能陪复杂项目数小时，把大目标拆成更小步骤并独立完成"，产出 sheets/slides/docs/web apps；用户可看进度、答问、改方向、**审批重要动作**；Scheduled Tasks 让人离开时继续。技术底座是 Codex（官方口径：Codex 每周 500 万使用者，其中 100 万用于非软件工作）。
- **[Workspace agents](https://openai.com/index/introducing-workspace-agents-in-chatgpt)**（2026，日期不详）：GPTs 的演进，**组织内共享**、云端跑、在 ChatGPT 或 Slack 被调用；创建方式是"描述你要做的工作或丢一个文件进去"，ChatGPT 引导定义步骤、接工具、加技能，**"testing it until it works the way you expect"**；研究预览，按组织权限与审批运行。
- **[Agents SDK Sandbox Agents](https://developers.openai.com/api/docs/guides/agents/sandboxes)**（文档期 2026-11）：把边界讲得最清楚的一份工程文本，**harness 是控制面**（agent loop、模型调用、工具路由、handoff、审批、tracing、恢复、run state），**compute 是沙箱执行面**（文件、命令、包、挂载、端口、快照）；两者必须分开，harness 不应跑在沙箱里。**直接支持 00-synthesis 的"控制面/执行面分离"**。
- **Deep Research（2025-02-02）/ ChatGPT agent（原 Operator，2025-07-17）**：研究型与浏览器 agent 的最早产品化形态；ChatGPT agent 发布页已标"launch post is outdated"，指向 Workspace agents / ChatGPT Work，**说明"浏览器自主操作"已被并入更大的工作会话，而不是独立产品**。

### 2.4 Devin：把"验证证据"做成产品功能

- **组织**：以 session 为单位，按 Slack/Teams/Jira/Linear/API 派活；批量迁移用 skill + 并行 session。
- **分工**：Devin 自定计划并执行；人可在 Devin 的 IDE 接手草稿；CLI 用 `/handoff` 把长任务交给云 session，再把 PR 拉回本地。
- **验证（最值得抄的一段）**：PR 之后可进入 **testing mode**，① 准备环境（装依赖、起服务、登录）② **读 diff 与代码，产出最小测试计划** ③ 开录屏，在桌面执行并标注关键节点 ④ 把视频作为附件发给你。目标是"reviewer 看完这段视频就敢合 PR"。另有 `Devin Review`、stacked PRs。
- **记忆**：Knowledge（团队知识录入）、`AGENTS.md`、仓库索引、**Skills**（`SKILL.md`，遵循开放 [Agent Skills 规范](https://agentskills.io/specification)，放 `.agents/skills/<name>/SKILL.md`，跨仓库自动发现）。**Devin 会在测试/踩坑后主动建议把过程沉淀成 skill 并开 PR**，好的"记忆写入"触发点。
- **人如何介入**：会话内问答与审批；PR review；"pre-approve testing" 可让它不请示就跑测试。
- **启示**：**"证据附件"（录屏/截图/diff + 测试摘要行）比"我完成了"的文本声明可信一个量级**；建议 Artifact 模型内建 `evidence[]`。

### 2.5 Genspark：把"角色"卖成"同事"

- [GenTeam](https://www.genspark.ai/genteam)（2026，日期不详）：**选一个现成角色（几十种）或写一段 JD 自己造**；像对同事一样 @、DM、派任务；**每个 teammate 在自己的云电脑上工作，回来交文件**；项目用 group chat 表达，**任务有状态、唯一 assignee、自己的 thread**；DM 私密（"agent 不会把 DM 里的话带进群"）。
- 官方三条约束：agent **以创建者身份行事**（继承其权限与已连接应用）、**消耗创建者 credits**（无论谁派的活）、**DM 私密**。
- 记忆口径：角色保留历史与上下文，"三周前的事新 agent 能接上"。可把本机 Claude Code / Codex / Cursor CLI agent 接进来，与云 agent **同群、共享文件**。
- **启示**：这是"角色 = 长期实例"的产品假设，前提是**多租户 + 计费 + 身份继承**，三项都是 SCOPE v0.1 排除项；**只能借交互（任务卡 + 唯一 assignee + 群内 @），不能借模型**（见 §5-C1）。

### 2.6 Microsoft：企业侧的"验证闭环"样板

[Build 2026 ， Foundry Agent Service](https://devblogs.microsoft.com/foundry/agent-service-build2026)（2026-06，按文中"6 月 GA"推断）：

- **运行时**：hosted agents，**每个 session 一个独立沙箱**（独立 compute/memory/filesystem）；框架无关（MAF / Copilot SDK / LangGraph / Claude Agent SDK 都能部署）；支持 Responses 与 Invocations 两协议；支持**长跑自治 agent**（durable state + 文件系统）与 **routines**（定时/事件触发）。
- **观测与优化闭环（企业侧最完整的一套）**：模型调用、工具调用、子 agent 跳转、handoff 走**同一条 OTel 管道**，评估结果**回链到产生它的 trace**；再往上：**ASSERT** 从策略生成对抗测试 至 **Agent Control Specification** 把风险变成运行时护栏（input/model/state/tool execution/output）至 **rubric 评估** 至 **Agent optimizer** 消费生产 trace 与评估、生成**排名的候选改进**、在你的场景与约束上验证、给出带 lineage/diff/审计/回滚的建议。
- **启示**：v0.1 不做 optimizer，但**"评估结果必须回链到 trace"**现在就要定，否则无法回答"这次失败是模型、工具还是编排的问题"。

### 2.7 Gemini CLI 与 Codex：两个"单会话 + 子代理"的参照系

- **Gemini CLI subagents**（[Google 开发者博客，2026-04-15](https://developers.googleblog.com/subagents-have-arrived-in-gemini-cli)）：子代理有**独立上下文窗口、自定义系统指令、精选工具集与 MCP**；主会话当 orchestrator，按 description 路由；子代理内部可能几十次工具调用，**最后合并成一条回复**给主 agent；官方明说目的就是**避免主上下文的 context rot 与 context pollution**；自定义子代理是带 YAML frontmatter 的 `.md`，放 `~/.gemini/agents`（个人）或 `.gemini/agents`（项目，可提交共享），也能随扩展分发；子代理可并行。
- **Codex**（[产品页](https://openai.com/codex/)，2026，日期不详）：多 agent 并行，**用 computer 与 browser 工具验证工作直到满足要求**；按仓库可复用的云环境；自动 review PR；同一 agent 横跨 ChatGPT/IDE/CLI。
- 两家共同说明：**"角色"的载体是 Markdown 文件（frontmatter 描述何时用、用什么工具、用哪个模型）**，不是代码里的类，与 DSH 的 `packages/skill`/`packages/preset` 同类。

### 2.8 项目制做得最好的两个产品（结论）

| 排名 | 产品 | 为什么 | 可抄 / 不能抄 |
|---|---|---|---|
| 1 | **Claude Projects** | 唯一把"项目"做成**完整对象**的产品：目标、指令、记忆、仓库/文件、环境、产物库、线程状态机、独立审批、用量分解，每项都有明确文档边界 | 抄：协调者/thread 分层、`MEMORY.md` 索引式记忆、指令 brief 模板、Overview 六态、线程内审批不可代答、merge conflict 即冲突解决。不抄：云 thread + PR 这套"代码仓库中心"默认假设（我们是通用交付物） |
| 2 | **Manus Projects + Parallel Tasks** | 最"轻"的项目制：项目只承担上下文，分工靠主任务派发 + 子任务独立结果，交互成本最低，非工程场景也能用 | 抄：项目=上下文容器、主任务指挥权、短 brief 下发、Branch 复制语义、Wide Research 的独立上下文扇出。不抄：无独立验证、无项目级记忆写入策略 |
| 3（参考） | **Genspark GenTeam** | "人机同群协作"交互最成熟：任务状态、唯一 assignee、群/私聊隔离、按创建者身份授权 | 抄：任务卡（状态 + 唯一 assignee + 自己的 thread）、群/私聊信息隔离。不抄：长期"雇佣"角色 |

---

## 3. 框架与范式篇：可落地的四种编排模式

### 3.1 LangChain Deep Agents：目前最完整的"harness 四件套"说明书

来源：[Deep Agents overview](https://docs.langchain.com/oss/python/deepagents/overview.md)、[与 Claude Agent SDK 对比](https://docs.langchain.com/oss/python/deepagents/comparison.md)（文档期 2026-11 读取）。

**四件套（官方定位）**：规划（planning）+ 虚拟文件系统（context）+ 子代理（delegation）+ 长期记忆（memory），架在 LangChain/LangGraph 之上。

| 组件 | 官方机制细节 | 对 2026 年的重要修正 |
|---|---|---|
| 任务规划 | `TodoListMiddleware` 提供 `write_todos` 工具，维护结构化任务表 | **自 v0.7 起 planning 是 opt-in**，不再默认开启；适用场景官方点名"长/复杂多步任务、较弱模型需要外部问责工具、UI 要流式展示进度" |
| 子代理 | 内置 `task` 工具创建**临时**子代理；默认 `mode:"isolated"`（新上下文），可选 `mode:"fork"`（继承父对话）；**只回一份最终报告、无状态、不能再发多条消息**；重活被压缩成紧凑结果；另有 async 子代理，支持 launch/check/update/cancel 中途干预 | "subagent 只回摘要"不是最佳实践而是**接口事实**：状态机里不要设计"子代理回多条消息" |
| 上下文管理 | 四段式：input context（系统提示/记忆/技能/工具提示）至 compression（内置 offload + 摘要）至 isolation（子代理隔离）至 long-term memory（虚拟文件系统的持久存储） | 与 Claude 的"事件日志 + 视图压缩"同构，可映射到 `compaction` + `spill` + 文件记忆 |
| 记忆 | **`AGENTS.md` 文件**，通过 `memory` 参数传入；与 skills 不同，**memory 总是加载**；agent 可自行更新 | 印证"常驻文件 + 按需文件"两层结构 |
| 人工介入 | 接 LangGraph `interrupt`，`interrupt_on={"edit_file": True}` 按工具名配置中断 | 审批粒度应按"工具 + 参数风险"而非按"轮次" |
| 沙箱 | 支持"agent 在沙箱内"与"agent 在沙箱外、把沙箱当工具"两种；后端可换（本地/虚拟/远程/自定义） | 对比页明确：**Claude Agent SDK 只支持"在沙箱内"**；Anthropic 自家 Managed Agents 反而解耦 |
| 许可 | 页面称 Deep Agents MIT；**同页称 Claude Agent SDK 为 MIT，与 npm 元数据冲突**（§4.5） | 引用许可不要用对比页当唯一来源 |

### 3.2 其余框架的编排范式（差异一览）

| 框架 | 编排原语 | 状态/恢复 | 分工方式 | 验证位置 | 可用度 |
|---|---|---|---|---|---|
| **Claude Agent SDK** | 复用 Claude Code 的 agent loop；sessions（continue/resume/fork）、file checkpointing、hooks、subagents、MCP | session 落盘 + 文件检查点 | 子代理独立上下文、只回摘要；agent teams 仍 experimental 默认关闭（01 已核） | hooks（Stop/PostToolUse）做确定性检查 | **高**：形状最接近；许可待核是唯一障碍 |
| **OpenHands** | Agent Canvas + SDK + automations（事件驱动：issue至PR 等预置自动化）；Docker/远程 runtime | 会话 + 事件流 + 云控制台 | 单 agent + 自动化触发 | 事件流可观测；验证靠 CI/测试 | 中：自动化触发模型值得借鉴 |
| **SWE-agent** | 单循环 + 工具（ACI）；**已被 mini-swe-agent 取代**（官方首页明示），后者 100 行 Python 在 SWE-bench verified 上 65%（2025-07-24 记录） | 弱（研究导向，yaml 配置） | 无 | 无（靠 benchmark 打分） | 低（反证：复杂 harness ≠ 更好结果） |
| **AutoGen 至 Microsoft Agent Framework** | AutoGen 0.7.5 为末次发布；MAF 统一 SK 企业底座 + AutoGen 多智能体编排；Harness Agent 自带规划/todo/压缩/文件记忆/工具审批（01 已核） | MAF harness 内置 | 多智能体会话/群聊 | 内置审批 + trace | 中：能力清单可当 checklist |
| **CrewAI** | Crews（角色团队）vs Flows（事件驱动、`@persist` 持久化） | Flows 持久化 | **角色扮演式多 agent** | 依赖外部 | 低：角色扮演失败率最高（MAST），但 Flows 的"确定性骨架 + 局部 agent"值得学 |

### 3.3 四种可复用模式的落地要点

**(1) planner–executor（计划是被执行的对象）**
- 不要"plan 阶段产出长篇计划书然后执行"，要**轻量计划 + 外部信号驱动修订**（00-synthesis 结论，APB 2026）。
- 计划的最小形态：**有序 todo + 每项验收判据**。Deep Agents 的 `write_todos`、Claude Code 的 plan mode、Claude Projects 的 thread 都是这个形态的不同包装。
- 反模式：计划只在模型上下文里、不落盘 至 压缩即丢。**计划必须成为可读文件/事件**（Claude Code 明确"plan 会被重新注入"）。

**(2) todo 文件（外置任务表）**
- 三条硬要求：① 一项一条、可勾选；② 每项带**验收判据**（可脚本化优先）；③ 变更产生事件（谁改、为什么），因为它同时是 UI 进度条与恢复依据。
- Deep Agents 把 planning 改成 opt-in 是信号：**todo 对强模型是负担，对长任务与弱模型是刚需**；建议做成可开关的 harness 能力而非默认值。

**(3) subagent 只回摘要（隔离即接口）**
- 接口契约：`dispatch(role, brief, budget) -> {summary, artifacts[], evidence[], failures[]}`；无中途多消息；父保留"改/停/追问"三种控制（Manus 主任务、Deep Agents async 的 update/cancel、Claude thread 的 steer）。
- 为什么必须：Gemini CLI 与 LangChain 都写成"避免 context rot / 保留主上下文"的手段，Claude 协调者只看回报，**三家独立收敛到同一设计**。
- 成本警告：多智能体 ≈15× chat token（01 已核），所以 subagent 必须有**预算与并发上限**。

**(4) 验证循环（谁判"完成"）**
- 三种成熟形态：**条件 + 独立评估器**（Claude `/goal`）；**证据产出**（Devin 录屏、Codex 用 browser 验证、测试摘要行）；**闭环优化**（Foundry：trace 至 eval 至 候选改进 至 场景验证）。
- 共同点：**判定者与执行者分离**。项目制里最危险的一句话是"agent 说它做完了"。

---

## 4. 工程实践篇

### 4.1 上下文工程

**(a) compaction：关键是"压缩后重新注入什么"**

Claude Code 的处理清单（[context-window 文档](https://code.claude.com/docs/en/context-window.md)，v2.1.198 起摘要请求继承 extended thinking 配置）：

| 内容类型 | 压缩后行为 |
|---|---|
| 系统提示 / 输出风格 | 继续生效 |
| 项目根 `CLAUDE.md`、无路径作用域规则 | **从磁盘重新注入** |
| auto memory | 从磁盘重新注入 |
| 技能描述 | 按当前技能清单重建并重注入（≥v2.1.304） |
| plan mode 里写的 plan | 从磁盘重新注入 |
| 带 `paths:` 的规则、子目录 `CLAUDE.md` | **按需重载** |
| 读/改过的文件 | **重读最多 5 个，最近修改优先**；单文件 >5k tokens 则以路径代替 |
| 已调用技能正文 | 重注入，**单技能 ≤5,000、总 ≤25,000 tokens，最旧先丢** |
| 后台命令 / 后台子代理 | **继续运行**，并提醒模型别重复启动 |

可操作结论：**"压缩"不是摘要对话，而是一次"重建工作集"**，凡能从磁盘重建的都不该进摘要；一次性产物（工具输出、日志）应 spill 到文件。另：项目会话"从最近消息 + 最近线程 + 项目记忆工作，而不是完整历史"，**长任务容器的记忆是索引，不是累积**。

**(b) context rot（上下文腐烂）**

Chroma 的 [Context Rot 研究](https://research.trychroma.com/context-rot)（2025）在**最小化控制**的任务上证明：输入越长，性能退化且**退化不均匀**；NIAH（大海捞针）近满分不能说明长上下文可用。工程含义：不要用"窗口有 1M"论证能塞下整个项目；**主动裁剪 + 子代理隔离 + 文件外置是必需项**。

**(c) 工具发现与代码执行（Tool Search / PTC）**

[Advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use)（2025-11-24，02 已核）：五个 server（GitHub 35 / Slack 11 / Sentry 5 / Grafana 5 / Splunk 2）= 58 个工具 ≈ **55K tokens**，对话还没开始就花掉；加 Jira 单个 ≈17K。解法三件套：**Tool Search Tool**（用搜索工具发现工具）、**Programmatic Tool Calling**（在代码执行环境里调工具，中间结果不进上下文）、**Tool Use Examples**（示范用法而不只是 schema）。
已核数字（02-capabilities #11）：50+ 工具约 72K tokens、见过 134K；PTC 让复杂研究任务 43,588至27,297 tokens（−37%）；Tool Search 把可用上下文 122,800至191,300；Tool Use Examples 把复杂参数准确率 72%至90%。
**结论**：默认"按需发现"，禁止把全部工具 schema 注入系统提示。

**(d) 记忆文件三层（AGENTS.md / CLAUDE.md / MEMORY.md）**

| 层 | 内容 | 谁写 | 加载方式 | 证据 |
|---|---|---|---|---|
| 项目指令 | 项目是干什么的、完成标准、禁区、缺东西怎么办 | 人 | 每次新执行单元都发（Claude 上限 16,000 字符） | Claude Projects 文档 |
| 常驻规则文件 | `CLAUDE.md` / `AGENTS.md`（仓库构建命令、约定） | 人 | 每个 session 启动加载；压缩后从磁盘重注入 | Claude memory 文档；[agents.md](https://agents.md/)（自称 6 万+ 开源项目使用） |
| 自动记忆 | 纠正、决策、坑、偏好 | 模型（人可审计/删除） | `MEMORY.md` 索引常驻，其余按需打开；auto memory 首 200 行/25KB | Claude 文档；Deep Agents memory = 总是加载的 AGENTS.md |

三层结构与 04-memory 的分层建议方向一致；注意其收益是**省 token、跨会话一致**，不是"更聪明"（00-synthesis 结论）。

### 4.2 工具标准：MCP 2026-07-28 与 A2A

**(a) MCP 2026-07-28 关键变更**（[changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)，官方原文逐条）

1. **移除协议级会话**与 `Mcp-Session-Id`：Streamable HTTP 不再有连接态；`tools/list`、`resources/list`、`prompts/list` 不再随连接变化。需要跨调用状态的 server 必须用**服务端签发的显式 handle 作为普通工具参数**传递（SEP-2567）。
2. **协议无状态化**：删除 `initialize`/`notifications/initialized` 握手；**每个请求**在 `_meta` 里带协议版本与客户端能力；版本不匹配返回 `UnsupportedProtocolVersionError`（SEP-2575）。
3. 新增 **`server/discover`**：server 必须实现，用于宣告支持的版本、能力与身份。
4. **`subscriptions/listen`** 取代 HTTP GET 端点与 `resources/subscribe`/`unsubscribe`：单一长连接流，客户端按类型 opt-in；请求级通知（progress、message）仍走各自请求的响应流。
5. 删除 `ping`、`logging/setLevel`、`notifications/roots/list_changed`；日志级别改为**每请求** `_meta` 的 `logLevel`。
6. **tasks 移出核心**，成为官方扩展 `io.modelcontextprotocol/tasks`：阻塞式 `tasks/result` 改为 **`tasks/get` 轮询 + `tasks/update`** 回填输入，去掉 `tasks/list`，server 可**未经请求**返回任务句柄（SEP-2663）。
7. **MRTR（多轮往返请求）**：server 不再主动发 `roots/list`/`sampling/createMessage`/`elicitation/create`，而是返回 `InputRequiredResult`（`resultType:"input_required"`）+ `inputRequests`，客户端用 `inputResponses` 回填。

**直接影响**：M04 工具层的 `execute(name,input)->string` **不能假设连接态**；长任务要么用 tasks 扩展（轮询），要么就是 harness 自己的 run 状态；审批/补充输入应走 MRTR 形状（"返回 input_required"）而不是反向调用。

**(b) A2A v1.0**（[spec](https://a2a-protocol.org/latest/specification/)，2026 读取；官方公告已加入 **Agentic AI Foundation**）
- 核心对象：AgentCard（发现 + 能力/技能/接口/签名）、Task（含 TaskStatus/TaskState）、Message/Part、Artifact、TaskStatusUpdateEvent、TaskArtifactUpdateEvent、PushNotificationConfig。
- 操作：SendMessage / SendStreamingMessage / GetTask / ListTasks / CancelTask / SubscribeToTask / 推送配置增删查 / GetExtendedAgentCard。
- **有用**：**任务状态词表 + "Artifact 是一等对象" + 推送/订阅两套更新机制**，可对齐 Task 状态命名，避免自造词。
- **不建议**：A2A 解决跨厂商互操作（发现、认证、多绑定），v0.1 无外部 agent 接入需求，引入只增负担；SCOPE 的排除项仍成立。

### 4.3 验证闭环：四层，从便宜到贵

| 层 | 谁判 | 判据形态 | 成本 | 适用 | 证据 |
|---|---|---|---|---|---|
| **L0 确定性脚本** | 脚本/CI | exit code、测试通过、schema 校验、文件存在/哈希、行数/大小预算、`git status` 干净 | 极低 | 一切可脚本化的验收；**首选** | Claude `/goal` 要求条件写成"执行器输出能证明的样子"；Devin/Claude thread 跑测试 |
| **L1 独立模型评审** | **另一个**模型（fresh 上下文）+ rubric + 证据 | met / not-yet / impossible + 理由；必须引用 transcript 里的证据 | 低（小模型） | 无法脚本化的质量判断（完整性、口径一致、事实核对） | Claude `/goal` evaluator；Managed Agents 的 self-evaluate 是同一循环自评，弱一档 |
| **L2 人工审批/签字** | 人 | 通过/打回 + 理由 | 高 | 三类高危动作（写、付款、外发）+ 关键交付物 | Claude thread 内审批不可代答；指令模板"不要 merge/force-push/改 CI 而不问我"；Deep Agents `interrupt_on` |
| **L3 证据附件**（横向） | 人/评审模型看 | 录屏、截图、diff、测试摘要行、trace 链接 | 中 | 让 L1/L2 有据可看 | Devin testing mode 录屏；Foundry trace↔eval 回链 |

**判定规则（建议写进设计文档）**：
1. 有 L0 就**不许**用 L1 代替；L0 未通过时 L1 不得判 met。
2. L1 评估器**必须**与执行者不同实例、不同上下文，且**不允许**调用工具"帮忙验证"，它只看证据。
3. 没有 L0 条件时，任务创建阶段必须**显式标记"不可自动验收"**，直接进 L2 队列。
4. 每次验证产出 `Verification{level, verdict, evidence[], reason}` 事件，进事件日志，供 pass^k 与轨迹回放。

### 4.4 预算与停止条件

| 停止条件 | 触发 | 行为 | 先例 |
|---|---|---|---|
| 目标达成 | 评估器判 met | 清目标、记 achieved、交付 | Claude `/goal` |
| 目标不可能 | 评估器判 impossible | 清目标、记 failed + 理由，**不假装继续** | Claude `/goal` |
| 无进展 | 连续多轮无工具调用 | 停循环、告警、交还控制权（目标保留） | Claude `/goal` |
| 条件内上限 | 条件写"或 20 轮后停" | 按条件停并报告进度 | Claude `/goal` |
| 硬预算 | token/费用/时长/并发超限 | 立刻停 + 保留现场 + 报"预算停止"而非"失败" | SCOPE M10；BRIEF 指标 |
| 环境不可恢复 | 沙箱恢复失败、凭证失效、仓库不可达 | 停并**说清缺什么，不替代/不模拟/不猜测** | Claude 指令模板；Claude Projects 限制（沙箱暂停可能丢未提交改动） |
| 人取消 | 用户停止/撤回 | 立即停，保留轨迹 | 通用 |

**成本纪律**（引 01/02 已核）：多智能体 ≈15× chat token；50+ 工具 ≈72K tokens；缓存单价差约 10×。**并发上限、每 run token 预算、工具按需发现**三件事一开始就要有。

### 4.5 许可与依赖风险（新增冲突记录）

| 依赖 | 声明 | 冲突/风险 |
|---|---|---|
| Claude Agent SDK | npm `@anthropic-ai/claude-agent-sdk@0.3.319` 的 `license` = **"SEE LICENSE IN README.md"**（2026-11-07 读取） | LangChain 对比页称其 **MIT**；两处冲突、**未有定论**。按 SCOPE §3"不假设可商用"继续标待核 |
| Deep Agents | MIT（文档页） | 无冲突 |
| MCP | 开放规范 | 0 许可费 |
| A2A | 开放规范，已入 Agentic AI Foundation | 无冲突 |

---

## 5. 提炼：可直接采用 / 需改造 / 不可照搬

> 判定标准：**可直接采用** = 有 ≥2 家一手证据、与 DSH 现有 seam 不冲突、v0.1 成本可接受；**需改造** = 方向对但形态绑定了别的前提（代码仓库、多租户、云 session）；**不可照搬** = 与 SCOPE 排除项或 00-synthesis D1 冲突，或成本/许可不可接受。

### 5.A 可直接采用（7 项）

| # | 机制 | 具体做法 | 依据 |
|---|---|---|---|
| A1 | **Project = 五件套** | `{goal(一行), instructions(≤16k), context_sources（文件/仓库/连接器）, memory(MEMORY.md 索引 + 文件), artifacts[]}`；项目设置页就这五块 | Claude Projects 文档；Manus Projects |
| A2 | **协调者 / 执行单元两层** | 协调者只看执行单元的**回报**（摘要 + artifacts + evidence + failures），不看每一步；执行单元独立上下文 | Claude Projects（"sees what threads report back, not every step"）、Manus（main task 读结果）、Deep Agents（single handoff） |
| A3 | **todo 外置 + 每项带验收判据** | 计划落盘成文件/事件（压缩可重建），UI 与恢复都读它；planning 做成**可开关**能力 | Deep Agents `write_todos`（v0.7 起 opt-in）；Claude plan 重注入 |
| A4 | **独立评估器 + 三态裁决** | `Verifier` 用**不同模型/不同上下文**判 met / not-yet / impossible；not-yet 的理由作为下一轮指导；带无进展与轮次上限 | Claude `/goal` 完整机制（4,000 字符、轮数、token 花费展示） |
| A5 | **证据附件型交付** | `Artifact{path, mime, version, provenance, evidence[]}`，evidence 含测试摘要、截图/录屏、trace 链接 | Devin testing mode（录屏）；Claude 指令模板（粘贴测试摘要行）；Foundry（eval↔trace 回链） |
| A6 | **记忆三层（指令/常驻规则/自动记忆）** | 项目指令每次注入；`AGENTS.md` 常驻；自动记忆用 `MEMORY.md` 索引 + 按需打开 + 可审计可删除 | Claude memory/Projects 文档；Deep Agents memory；agents.md |
| A7 | **压缩 = 重建工作集** | 压缩后按"可从磁盘重建的一律重建、一次性产物 spill 到文件、后台任务继续跑"三原则处理 | Claude context-window 的重注入清单（§4.1a） |

### 5.B 需改造才能用（5 项）

| # | 机制 | 原形态 | 改造点 | 理由 |
|---|---|---|---|---|
| B1 | **执行单元 = 云 session + 分支 + PR** | Claude 把执行单元绑到 git 分支与 PR，冲突用 merge conflict 解决 | 抽象成 `Run`：独立上下文 + 独立工作目录 + **交付物提交**；仓库只是 `context_source` 之一，PR 只是 `artifact` 之一。冲突需自建（文件级写域 + 锁/合并策略） | 我们是通用交付物；但**"写域冲突要显式解决"保留** 至 借鉴 Team task board 的 `write_scopes` + `blocked_by` |
| B2 | **项目级记忆 = 模型自写文件** | Claude 让模型自己写 `MEMORY.md` 与文件，人可审计 | 必须加**写入时机策略**（纠正后、决策后、验证失败后）与**容量/淘汰**，否则文件无限膨胀、检索退化 | 04-memory：写入策略比后端更重要；Claude 未公开淘汰策略（**未找到公开资料**） |
| B3 | **多 agent 协调** | Managed Agents 多 agent、Claude agent teams、Wide Research 数百 agent | 只保留**扇出-归并**（N 个独立子任务 至 汇总），**不做 agent 间自由对话**；并发上限定死、超限排队 | 15× token、MAST 失败集中在协作对齐、agent teams 默认关闭 |
| B4 | **routines / 定时触发** | Foundry routines、Manus Automations、ChatGPT Scheduled Tasks | v0.1 只做"任务级定时/续跑"，不做"事件总线 + 连接器订阅" | 集成面在验证阶段无客户；但**"离屏继续 + 回来收结果"的交互要保留** |
| B5 | **MCP 客户端** | 2025 年教程形态（握手、会话、sampling） | 按 2026-07-28 写：无状态、每请求带版本/能力、`server/discover`、`subscriptions/listen`、tasks 轮询、MRTR 回填 | 断代变更，按旧教程写会整层返工 |

### 5.C 不可照搬（5 项，附理由）

| # | 机制 | 为什么不能照搬 |
|---|---|---|
| C1 | **"雇佣长期角色"（GenTeam 式）** | 需要多租户 + credits 计费 + 身份继承。SCOPE §2 已排除多租户/计费，v0.1 做不出也验证不了。**可借交互，不可借模型** |
| C2 | **浏览器/桌面自主操作（Operator 式）** | 官方页已自标过时并并入更大工作流；成功率公开数据不支持（真实站点 ~64%、OSWorld 2.0 最好 20.6%，03 已核）。SCOPE 已排除 |
| C3 | **自由多智能体/角色扮演协作（Crews、AutoGen 群聊）** | 成本 ≈15×、失败集中在协作对齐与验证（MAST）、不可复现；与 D1 冲突 |
| C4 | **模型自评即验收（self-evaluate / 自动 optimizer）** | 自评是同一上下文的延续、无外部信号；"内在自纠错已被证否"（00-synthesis #4）。Foundry optimizer 能成立是因为有**生产 trace + 场景约束 + 人工审阅**三件套 |
| C5 | **自建跨 agent 互操作协议（A2A 那层）** | 双边市场冷启动，v0.1 无外部接入需求；**但状态词表可对齐**，不必自造 |

---

## 6. 给设计文档的输入

### 6.1 项目制编排的最小状态机

**原则**：状态少、迁移有守卫、每次迁移产生事件；Project/Goal 是"人可读的意图层"，Task/Run 是"机器可执行的调度层"，Artifact 是"可验收的交付层"。事件日志 append-only（D2），视图可压缩。

```text
Project   : draft 至 active ⇄ paused 至 archived
Goal      : draft 至 active 至 achieved | failed | superseded
Task      : backlog 至 ready 至 assigned 至 running ⇄ waiting_input 至 verifying 至 done | failed | blocked | cancelled
Run       : queued 至 provisioning 至 running ⇄ paused 至 (verifying) 至 succeeded | failed | budget_stopped | cancelled | timed_out
Artifact  : draft 至 candidate 至 verified 至 delivered | rejected
Approval  : requested 至 granted | denied | expired
```

**迁移表（守卫 + 事件）**

| 从 至 到 | 守卫（全部满足） | 事件 |
|---|---|---|
| Project.draft 至 active | 有 1 条 goal（≤1 行）+ instructions（≤16k 字符，含"完成标准/缺东西怎么办/什么要先问"）+ ≥1 个 context_source | `project.activated` |
| Project.active 至 paused | 人显式暂停，或预算熔断 | `project.paused{reason}` |
| Goal.draft 至 active | 人确认目标可度量（有 L0 判据，或显式标"仅 L2 验收"） | `goal.set{condition, maxTurns?, budget?}` |
| Goal.active 至 achieved / failed | 评估器裁决 met / impossible，或达上限 | `goal.verdict{met|not_met|impossible, reason, turn, tokens}` |
| Task.backlog 至 ready | `blocked_by` 全 done，且 `write_scopes` 不与在跑 Run 冲突 | `task.ready` |
| Task.ready 至 assigned | 有 role 绑定（能力预设）+ 预算 | `task.assigned{role, budget}` |
| Task.assigned 至 running | Run provisioning 成功 | `task.started` |
| Task.running 至 waiting_input | Run 发出 `input_required`（审批/缺料/歧义） | `task.waiting{request, risk}` |
| Task.running 至 verifying | Run 产出 artifact + 自检报告（evidence 非空） | `task.verifying` |
| Task.verifying 至 done | L0 通过，或（无 L0 时）L1 rubric 通过 + 证据齐全，或 L2 签字 | `verification.recorded` + `task.done` |
| Task.verifying 至 running | 验证失败且剩余预算/轮次 > 0 | `verification.failed{reason}` |
| Task.running 至 failed | token/费用/时长/轮次超限 | `run.budget_stopped{which, limit}`（标记可续跑） |
| Task.* 至 blocked | 依赖失败/资源不可达/凭证失效 | `task.blocked{missing[]}`（**必须列出缺什么**） |
| Task.* 至 cancelled | 人取消或项目暂停 | `task.cancelled` |
| Run.running 至 paused | 沙箱恢复失败/需人审/限流 | `run.paused{cause}`（保留 checkpoint；**未提交产物先落盘**，否则重 clone 会丢） |

**最小事件类型集**：`project.created|updated|activated|paused`、`goal.set|verdict`、`task.created|assigned|state_changed|blocked`、`run.started|turn|compacted|paused|budget_stopped|ended`、`tool.requested|result`、`approval.requested|decided`、`artifact.produced|verified`、`verification.recorded`、`human.message`、`memory.written|deleted`。

**为什么是三层而不是一个**：Project/Goal 对应 Claude 的 goal + instructions、Manus 的 master instruction；Task 对应 A2A 的 Task（状态词表可对齐）、Claude 的 thread、Manus 的 task、GenTeam 的 task（状态 + 唯一 assignee）；Run 对应"一次执行实例"（DSH session 粒度），它才是被调度、被预算、被恢复的单位；Artifact 对应 A2A Artifact + Claude Library + Manus 结果文件，**必须有 provenance**。

### 6.2 分工模型：角色是"能力预设"，执行时实例化为独立 Run

**结论先行**：**角色 = 声明式能力预设（不是独立长期 agent）**；每次派活实例化一个 **Run**（独立上下文，只回摘要）。

| 问题 | 证据 | 结论 |
|---|---|---|
| 角色用什么载体 | Claude 子代理 = md + frontmatter（description 决定何时用、tools 白名单、model、effort）；Gemini CLI 同构；Devin `SKILL.md`（Agent Skills 规范）；Manus Skills 是"文件系统基的模块化资源，带渐进披露" | **Markdown + frontmatter 文件**，与 `packages/skill`/`packages/preset` 同类 |
| 角色要不要长期存在 | Claude 子代理一次性；Deep Agents 子代理**临时、无状态、单次交接**；GenTeam 才长期 | v0.1 **一次性**；长期角色需多租户/计费/身份前提（SCOPE 排除） |
| 何时开子执行单元 | ①侧任务会污染主上下文（大量搜索/日志/文件内容）②可并行且相互独立 ③需要工具面隔离或更便宜模型 | 三条任一满足才开；**决策强耦合的任务不要拆**（Cognition：动作隐含决策，冲突决策带来坏结果） |
| 怎么收回结果 | 单一交接：`{summary, artifacts[], evidence[], failures[]}`；父保留改/停/追问 | 与三家一致；**接口不要留"子代理回多条消息"** |
| 并发与成本 | ≥15× token；Wide Research 是"独立上下文扇出"才划算 | 并发上限 + 每 run 预算 + 队列；超限排队而非拒绝 |

**角色预设最小字段**（建议写入 `design/projects.md`）：

```yaml
role: verifier              # 唯一名
description: 一句话说明何时用（会进路由上下文，≤2 行；全部 description 合计有 token 上限）
skills: [docx, xlsx]        # 引用 skill 包
tools: [read, grep, run_tests, write_artifact]   # 白名单，默认最小
model: { name: ..., effort: low }                # 与协调者分开设
permissions: { mode: read_only, approval: { write: true, send: true, pay: true } }
context: isolated           # isolated | fork（默认 isolated）
budget: { max_tokens: ..., max_turns: ..., max_seconds: ... }
return_contract: [summary, artifacts, evidence, failures]   # 固定，不可自定义
```

**三条反模式**：① 用"角色名"当人格（CrewAI 式）至 失败集中在协作对齐（MAST）；② 让子执行单元直接对外发消息/写主分支 至 必须经父的 artifact 提交；③ 角色描述写太长 至 Claude 明确"所有子代理 description 合计超 15,000 tokens 会在启动时告警"，细节应放进只在运行该角色时才加载的系统提示。

### 6.3 验证层级：脚本 > 模型评审 > 人工（含降级规则）

| 层级 | 何时用 | 判据写法 | 失败后 |
|---|---|---|---|
| **L0 脚本（首选）** | 任何能写成命令的验收：测试、构建、schema、文件存在/大小、链接可解析、表格行列数 | "命令 + 期望结果"，例：`npm test 退出码 0`、`report.md 含 ≥3 个带日期的一手链接` | 直接回 running，带 stderr 摘要；重试上限写进守卫 |
| **L1 独立模型评审** | 无法脚本化的质量判断：完整性、口径一致、是否回答原问题、是否引用证据 | rubric 3–5 条 + "必须引用 transcript 里的证据，不允许自己跑工具" | 返回 not-yet + 理由作为下一轮指导；连续 N 次 not-yet 至 升级 L2 |
| **L2 人工** | 三类高危动作 + 无法自动验收的交付 + L1 反复不通过 | 人看 evidence（录屏/diff/摘要）后一键通过/打回 | 打回必须带理由，写入记忆 |

**三条硬规则**：① 能力越弱越要靠 L0（把可判定部分用脚本判掉，显著降低评估器开销与误判）；② 评估器与执行者分离，且评估器**只看证据不产出**，同一 run 的自我总结**不计入验证**；③ 验收判据在 Task 创建时就必须存在（哪怕只是"人工签字"），运行时不得临时放宽。

**指标口径**（与 BRIEF §4 / 03 一致，不新增）：任务完成率（held-out 20 条通过验收比）、人工接管率、单任务成本、P95 时长、pass^3；按任务时长分档报（<45min / 45–137min / 137–163min / >163min）。

---

## 7. 未决问题与风险

| # | 问题 | 现状 | 建议动作 |
|---|---|---|---|
| R1 | **三家的验证都不算强**（Manus 无独立评估；Claude 靠人 review PR；Devin 靠录屏给人看） | 【推断】行业还没有"自动验收通用交付物"的成熟方案 | 把 L0+L1 做成差异点；先用 20–30 条金标准任务测 L1 与人工判的一致率 |
| R2 | **Claude Projects 的记忆淘汰策略未公开** | 未找到公开资料 | 自定策略（容量/时效/热度），并做可删除与可审计 |
| R3 | **角色描述的 token 税** | Claude 有 15k 告警 | 角色 description 总预算纳入上下文预算表 |
| R4 | **许可**：Claude Agent SDK 的 npm 元数据与第三方对比页冲突 | 冲突未解 | 不引其代码、只借范式；若要引 SDK 须法务确认 |
| R5 | **项目级数据的可移植/可删除** | 四家均未提供导出/迁移（Claude 明确项目不可共享、thread 不可移动） | 第一天就做 `project export/delete`（本地优先是优势） |
| R6 | **最大风险：假完成** | 所有厂商都在补验证，说明自述完成不可信 | 验证层进 P0；交付物必须带 evidence；无 evidence 的"完成"在 UI 上标"待验收"而非"已完成" |

---

## 8. 参考（按日期，均可点开）

**产品（一手）**
- Manus《Introducing Manus Projects》，2025-12-01（页面标注 Monday, December 01）：https://manus.im/blog/manus-projects
- Manus Projects / Parallel Tasks / Branch / Wide Research / Skills 文档（2026-11-07 读取）：https://manus.im/docs/features/projects ｜ https://manus.im/docs/features/parallel-tasks ｜ https://manus.im/docs/features/branch ｜ https://manus.im/docs/features/wide-research ｜ https://manus.im/docs/features/skills
- Manus《Introducing Manus 2.0》，2026-09-28：https://manus.im/blog/introducing-manus-2-0
- OpenAI《Introducing Deep Research》，2025-02-02：https://openai.com/index/introducing-deep-research/
- OpenAI《Introducing ChatGPT agent》（页面已标过时），2025-07-17：https://openai.com/index/introducing-chatgpt-agent/
- Google《Subagents have arrived in Gemini CLI》，2026-04-15：https://developers.googleblog.com/subagents-have-arrived-in-gemini-cli
- Anthropic《Claude Managed Agents》，2026-04-08：https://claude.com/blog/claude-managed-agents
- Microsoft Foundry《Build and run agents at scale with Microsoft Foundry at Build 2026》，2026-06（按文中"6 月 GA"推断）：https://devblogs.microsoft.com/foundry/agent-service-build2026
- Anthropic《Projects redesigned: from folder to conversation》，2026-09-17：https://claude.com/resources/articles/projects-redesigned
- Claude Code 文档（日期不详，2026-11 读取）：Projects /goal /memory /context-window /sub-agents：https://code.claude.com/docs/en/claude-projects.md ｜ /goal.md ｜ /memory.md ｜ /context-window.md ｜ /sub-agents.md
- OpenAI《Introducing workspace agents in ChatGPT》（2026，日期不详）：https://openai.com/index/introducing-workspace-agents-in-chatgpt
- OpenAI《ChatGPT is now a partner for your most ambitious work》（ChatGPT Work，2026，日期不详）：https://openai.com/index/chatgpt-for-your-most-ambitious-work
- OpenAI Agents SDK《Sandbox Agents》（文档，日期不详）：https://developers.openai.com/api/docs/guides/agents/sandboxes
- OpenAI Codex 产品页（2026，日期不详）：https://openai.com/codex/
- Devin 文档（日期不详，2026-11 读取）：Testing & Video Recordings / Devin Skills / Introducing Devin / Migration & Modernization：https://docs.devin.ai/work-with-devin/testing-and-recordings.md ｜ https://docs.devin.ai/product-guides/skills.md ｜ https://docs.devin.ai/get-started/devin-intro.md ｜ https://docs.devin.ai/use-cases/migration-modernization.md
- Genspark GenTeam（2026，日期不详）：https://www.genspark.ai/genteam ｜ https://www.genspark.ai/helpcenter/genteam

**框架 / 规范 / 研究**
- LangChain《Deep Agents overview》/《Comparison with Claude Agent SDK》（文档，2026-11 读取）：https://docs.langchain.com/oss/python/deepagents/overview.md ｜ https://docs.langchain.com/oss/python/deepagents/comparison.md
- SWE-agent 首页（"已被 mini-swe-agent 取代"、65% 记录 2025-07-24）：https://swe-agent.com/latest/
- OpenHands 文档：https://docs.openhands.dev/overview/introduction
- AGENTS.md：https://agents.md/ ｜ Agent Skills 规范：https://agentskills.io/specification
- MCP 2026-07-28 Key Changes：https://modelcontextprotocol.io/specification/2026-07-28/changelog
- A2A v1.0：https://a2a-protocol.org/latest/specification/
- Anthropic《Effective context engineering for AI agents》（2025，页面未示明确日期）：https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Anthropic《Advanced tool use》（2025-11-24，02 已核）：https://www.anthropic.com/research/advanced-tool-use
- Chroma《Context Rot》（2025）：https://research.trychroma.com/context-rot

**本文引用的内部调研（不重复其推导）**
- `.ome/research/00-synthesis.md`（D1–D6、五项指标）
- `.ome/research/01-architectures.md`（Managed Agents session 设计、agent teams experimental、15× token、框架许可表）
- `.ome/research/02-capabilities.md`（72K/134K 工具目录、PTC −37%、Tool Search 122,800至191,300）
- `.ome/research/03-eval-market.md`（OSWorld 2.0 分档衰减、METR time horizons、pass^k）