# 08 ， Agent 架构与 AI 间协作前沿（2025–2026）

> 状态：调研报告 ， 2026-11-07 ， 调研员：agent-frontier（task-6）｜对象：[ADR-0006](../../docs/adr/ADR-0006-collaboration-model.md)
> 范围：只写 2025–2026 增量，为 ADR-0006 做外部证据复核。协议基础、上下文工程与框架形态已见 [05-superagent-landscape.md](05-superagent-landscape.md)，本文不重复；只回答“新架构是否改变了 D1–D8 的判断”。
> 证据等级：**A** 一手规范、官方文档、同侪评审论文；**B** 一手工程博客、预印本、厂商自测；**C** 二手报道或汇总；**D** 未核实（不据此下结论）。冲突证据并列，不强行裁决。
> 方法：只采信能打开的一手页面；数字标出处与日期；无公开资料时直说。

## 0. 一页结论

| # | 结论 | 关键证据 | 对 ADR-0006 |
|---|---|---|---|
| C1 | 2026 年行业收敛的是“协调者 + 单次交接”，不是自由多智能体；黑板式领取没有成为产品默认 | Anthropic 研究系统、Claude Projects、Gemini CLI、Deep Agents 四家同构 | 强化 D2/D6，削弱 D5 的 M2 地位 |
| C2 | 多 Agent 的主要收益来自独立上下文窗口，主要失败源是隐式决策不共享 | Anthropic 90.2% 与 Cognition“不要建多智能体”并列 | D6 必须补“决策/假设”字段 |
| C3 | 长任务瓶颈已从“会不会做”转为“能不能持续保持状态” | LHTB：最强模型 46 题仅解 13 题，29 题无人通过 | D1/D4 方向正确，但升级触发需换指标 |
| C4 | 辩论与市场化调度在 2025–2026 的实证是负向或高度受限 | 辩论会由对转错；市场化首提案偏差 10–30× | D5 的 M5 应移出运行时菜单 |
| C5 | 协议层已从长连接会话转为“无状态 + 显式句柄 + 多轮往返”，工具层语义随之改变 | MCP 2026-07-28 正式版；A2A v1.0 | 影响 M04 工具层，不改变协作拓扑 |

## 1. 新 Agent 架构（2025–2026）

| 范式 | 2026 状态 | 一手证据 | 级别 | 对 M0–M6 |
|---|---|---|---|---|
| orchestrator-worker | 唯一有规模化产品证据的拓扑；收益条件是“广度优先、可并行、信息超单窗口” | [Anthropic 多智能体研究系统](https://www.anthropic.com/engineering/multi-agent-research-system)（2025-06-13）：lead+subagent 比单 Opus 4 高 90.2%，代价 15× token；并明确“多数编码任务并行度低、不适合” | B | M1 保留为默认 |
| hierarchical / ledger | 层级最多两级有效；Magentic 用“任务台账 + 进度台账”把协调者判断外化成状态 | [Magentic-One](https://arxiv.org/abs/2411.04468)（2024-11）台账机制；[MAF 1.0](https://www.infoq.com/news/2026/08/agent-framework-harness-ga)（2026-04-02 GA）把它产品化为编排模式 | A/C | M4 降为“两级扇出”，不引入多级 Lead |
| blackboard | 学术与仿真领域仍在用；通用 agent 产品未把“任务领取/租约”作为默认调度，黑板退化为权威状态库 | Claude Projects 协调者只读 thread 回报（[文档](https://code.claude.com/docs/en/claude-projects.md)）；2026 的黑板讨论集中在仿真/流程引擎 | A/B | M2 拆成“状态模型（保留）+ 领取调度（推迟）” |
| swarm / handoff | 作为库存在（langgraph-swarm、OpenAI handoffs），但实证为“比 supervisor 略好、比单 agent 更贵” | [LangChain 基准](https://www.langchain.com/blog/benchmarking-multi-agent-architectures)（2025-06-10）：单 agent 在 ≥2 个干扰域时骤降；swarm 略优，supervisor 多付“转译”开销 | B | 不作默认；仅扇出场景 |
| market / contract-net | 有 2026 预印本把合同网用于边缘调度；但作为通用协作机制实证很差：首提案偏差给响应速度 10–30× 优势，规模上升性能骤降 | [Magentic Marketplace](https://arxiv.org/abs/2510.25779)（2025-10-27）；[LLM 合同网调度](https://arxiv.org/abs/2608.12371)（2026-08 预印本） | A/B | 不引入；最多用于资源分配实验 |
| debate / ensemble | 有反效果证据：模型被同伴理由说服而由对转错，即使强模型占多数 | [Talk Isn't Always Cheap](https://arxiv.org/abs/2509.05396)（2025-09，ICML MAS Workshop） | A/B | M5 移出运行时菜单 |
| self-evolving | 真实但昂贵且属离线：DGM 自改代码把 SWE-bench 20%至50%，单次运行约 2 周、约 2.2 万美元 | [DGM 技术报告](https://arxiv.org/abs/2505.22954)（ICLR 2026）、[官方博客](https://sakana.ai/dgm/)（2025-05-30）；[综述](https://arxiv.org/abs/2507.21046)（TMLR 2026） | A/B | 不进主路径；只保留离线挖掘候选改进 |
| agent OS / runtime | AIOS 把内核/调度/上下文/记忆/工具做成 OS 式分层（COLM 2025）；SOSP 2026 已有专门 workshop；但没有生产级通用 agent OS | [AIOS](https://arxiv.org/abs/2403.16971)；[AgenticOS @ SOSP 2026](https://os-for-agent.github.io) | A | 只借“控制面/执行面分离”，不自建内核 |
| event-driven / durable | 事件流 + 可恢复执行成为长任务标配：OpenHands 全链路类型化事件；durable execution 作为外部依赖 | [OpenHands 事件架构](https://docs.openhands.dev/sdk/arch/events)（2026-02 文档） | A/C | 与 D2 事件溯源一致，无需新增机制 |

### 1.1 三条横切发现

1. **“隔离”是手段，“决策一致”是前提**。Anthropic 用独立窗口做压缩与并行，收益来自 token 与搜索广度；Cognition 反向指出子代理各自基于冲突假设行动会毁掉结果（[Don't Build Multi-Agents](https://cognition.com/blog/dont-build-multi-agents)，2025-06-12）。两者不矛盾：可并行的判据是“子任务之间没有未言明的共同决策”。这直接决定上下文包该装什么。
2. **协调成本是可测开销，不是主观感受**。supervisor 的“转译”让每个子代理结果都过一遍大脑，实测比 swarm 更贵；多智能体整体 15× chat token、单 agent 4×（Anthropic，2025-06）。ADR 的“约 15×”仍成立。
3. **长任务的失败形态变了**。LHTB（2026-07，46 题 / 18 模型 / 90 分钟 / 120–320 步）最强模型均分 0.51、最好解 13/46，29 题无人通过；报告把原因写成“状态漂移、早先决定被遗忘、探索变循环”，而不是知识不足（[报告](https://zli12321.github.io/LHTB)，[论文](https://arxiv.org/abs/2607.08964)）。这是 D1“状态外置”的最强外部支持。

## 2. 协议与互操作

| 项 | 2025–2026 事实 | 证据 |
|---|---|---|
| MCP 2026-07-28（正式版，替代 2025-11-25） | 协议层去会话：删除 Mcp-Session-Id 与 initialize 握手，每个请求在 _meta 带版本/客户端能力；新增 server/discover（MUST 实现）；subscriptions/listen 替代 GET 与 resources/subscribe；tasks 移出核心成为官方扩展（tasks/get 轮询 + tasks/update）；引入 MRTR（resultType 为 input_required 加 inputRequests/inputResponses）；所有结果必带 resultType；删除 SSE 断点续传 | [官方 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)（A，2026-07-28）；[GitHub 适配说明](https://github.blog/changelog/2026-07-23-github-mcp-server-supports-the-next-mcp-specification)（A，2026-07-23） |
| A2A v1.0 | 以 a2a.proto 为规范源；Agent Card 签名校验（JWS/JCS）、扩展机制、多租户、版本协商；Task/TaskStatus/Artifact 仍是一等对象；从 v0.3 迁移有 breaking 变更 | [规范](https://a2a-protocol.org/latest/specification/)（A）；[What's New v1.0](https://a2a-protocol.org/latest/whats-new-v1/)（A）；稳定版时间点 2026-04 为二手（C） |
| agent identity / registry | 企业侧把 agent 变成可撤销身份：Entra Agent ID 2026-04 GA（C，二手，官方 what's-new 未逐条核对）；CSA 发布 Agent Registry 规范 v1，直接对应 OWASP ASI03 身份与权限滥用；AGNTCY 用 OASF 描述 agent、SLIM 做低延迟消息 | [CSA registry spec](https://labs.cloudsecurityalliance.org/agentic/agentic-agent-registry-specification-v1)（B）；[Entra what's-new](https://learn.microsoft.com/en-us/entra/fundamentals/whats-new)（A 页面 / C 结论）；[AGNTCY 解读](https://www.splunk.com/en_us/blog/artificial-intelligence/agntcy-structure-the-internet-of-agents.html)（C） |
| 支付与跨厂商交易 | AP2 于 2026-04 移交 FIDO Alliance，用可验证凭证与 Mandates 约束 agent 代付 | [AP2 规范站](https://ap2-protocol.org/)（A）；移交细节为二手（C） |

**判断**：协议层的真实变化是“请求即全部上下文”，无会话、显式句柄、多轮往返、任务可选扩展。这与 ADR-0006 的上下文包天然一致，反而让“执行单元不继承历史”更容易实现。A2A 的 Task 状态词表仍值得对齐，但 v0.1 不需要把内部拓扑改成 A2A（与 projects.md §4 结论一致）。

## 3. 产品与框架（只列 2025–2026 新事实）

| 产品/框架 | 新事实 | 架构启示 | 级别 |
|---|---|---|---|
| Claude ， Agent Teams | Opus 4.6（2026-02-05）带 agent teams，research preview；多 agent 协作进入消费级编码产品 | 多 agent 从框架特性变成产品形态，但仍是 preview | C（[报道](https://www.techbuzz.ai/articles/anthropic-launches-opus-4-6-with-multi-agent-teams-feature)；[官方文档](https://platform.claude.com/docs/en/docs/agent-teams) 动态渲染未逐段核对） |
| Claude ， Projects | 协调者只看 thread 回报、不看每步；thread 内审批不能从项目会话代答；协调者与 thread 可分别设模型/effort | 单次交接 + 权限边界不跨层 | A（[文档](https://code.claude.com/docs/en/claude-projects.md)，05 已详述） |
| Manus ， Wide Research | 为“多同类条目”扇出数百个各自独立上下文的 agent，再归并；官方把退化点定在 8–10 条 | 扇出-归并是唯一被产品验证的并行形态 | A（[文档](https://manus.im/docs/features/wide-research)）；上下文工程见 [Manus 博客](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)（2025-07-18，B） |
| Devin | PR 后 testing mode：读 diff 至 最小测试计划 至 录屏执行 至 视频当证据 | “证据附件”优先于自述 | A（[文档](https://docs.devin.ai)，05 已述） |
| OpenAI Agents SDK / Swarm | Swarm 已由 Agents SDK 取代；handoff 是一等原语；SDK 负责 loop/审批/trace，沙箱是执行面 | 控制面/执行面分离 | A（[swarm 仓库](https://github.com/openai/swarm)；[SDK](https://github.com/openai/openai-agents-python)） |
| Microsoft ， MAF 1.0 + Magentic | 2026-04-02 GA；harness、middleware、memory 产品化；Magentic 台账成为可选编排模式 | 台账机制已进产品，不再只是论文 | C（[InfoQ](https://www.infoq.com/news/2026/08/agent-framework-harness-ga)） |
| LangGraph supervisor / swarm | 两个模式各自独立成库；实测 swarm 略优、supervisor 更贵 | “谁是负责人”是可插拔参数，不是架构信仰 | B（[基准](https://www.langchain.com/blog/benchmarking-multi-agent-architectures)，2025-06-10） |
| AG2（原 AutoGen） | 2026 年保持 1–3 周发布节奏，2026-07 进 1.0 beta，2026-10 包版本 1.1.2 | 群聊式编排仍在维护，但无新范式 | B/C（[AG2 文档](https://docs.ag2.ai)） |
| CrewAI | Crews（角色团队）+ Flows（事件驱动、可持久化）稳定；生产建议偏向 Flows | “确定性骨架 + 局部 agent”优于全角色扮演 | A/B（[文档](https://docs.crewai.com)） |
| MetaGPT | 仓库自 2026-01 末无推送，商业重心转向其他产品；SOP 流水线范式无新贡献 | 历史范式，可作 M3 参照，不作依赖 | C（二手） |
| OpenHands | 全链路类型化事件 + SDK/automations（issue至PR） | 事件流即执行面，可观测性内建 | A（[事件架构](https://docs.openhands.dev/sdk/arch/events)，2026-02） |
| Codex | 多 agent 并行 + 用 computer/browser 工具验证到满足要求 | 验证靠真实执行而非自评 | A（[产品页](https://openai.com/codex/)） |

## 4. 评测证据（决定“该不该升级拓扑”）

| 主题 | 数字/结论 | 来源 | 级别 | 含义 |
|---|---|---|---|---|
| 长任务成功率 | LHTB：最强 Grok 4.5 均分 0.51、解 13/46；29/46 无人通过；单题 69–93 分钟、120–320 步 | [LHTB](https://zli12321.github.io/LHTB)（2026-07） | B | 上限由状态保持决定，不是推理能力 |
| 多 Agent 失败率 | 7 个框架 1600+ 轨迹，失败率 41%–86.7%；14 类失败模式分三类：系统设计、agent 间不对齐、验证缺失 | [MAST](https://arxiv.org/abs/2503.13657)（2025） | A（区间取二手 C） | 失败集中在协调与验证，不是模型能力 |
| 单/多 agent 成本 | 单 agent 约 4× chat，多 agent 约 15× chat；token 用量本身解释 BrowseComp 80% 方差 | [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system)（2025-06） | B | 多花 token 换质量必须按任务价值审批 |
| 上下文隔离收益 | 同类条目超过 8–10 条后单窗口质量显著下降；扇出后第 250 条与第 1 条同质 | [Manus Wide Research](https://manus.im/docs/features/wide-research) | A（厂商口径） | 扇出阈值可写进规则选择器 |
| 上下文腐烂 | 输入变长即退化且退化不均匀；大海捞针满分不能证明长上下文可用 | [Chroma Context Rot](https://research.trychroma.com/context-rot)（2025） | B | 支持 D1 的状态外置 + 视图压缩 |
| 可靠性口径 | pass^k（同一任务 k 次全过）替代 pass@k，衡量一致性而非上限 | [τ-bench](https://arxiv.org/abs/2406.12045)（2024-06 提出，2026 成为主流口径） | A | ADR 缺协作效果的一致性指标 |
| 辩论 | 异构模型辩论会由对转错；模型倾向附和而非质疑错误推理 | [Talk Isn't Always Cheap](https://arxiv.org/abs/2509.05396) | A/B | M5 默认关闭是对的下限，建议移出菜单 |
| 市场化调度 | 前沿模型仅在理想搜索下接近最优；规模一升即崩，首提案偏差带来 10–30× 速度优势 | [Magentic Marketplace](https://arxiv.org/abs/2510.25779)（2025-10） | A/B | 不引入竞价/拍卖式分工 |
| 自进化成本 | DGM 80 轮、SWE-bench 20%至50%，单轮约 2.2 万美元 / 2 周 | [DGM](https://arxiv.org/abs/2505.22954)（ICLR 2026） | A/B | 离线能力，不是运行时机制 |
| **缺口** | “上下文包 vs 继承历史”没有公开对照实验；“领取式黑板 vs 协调者”同样没有 | — | — | 只能靠自家 pass^k A/B 自证 |

## 5. 对 ADR-0006 的逐条修正建议

| 条目 | 判断 | 建议表述 | 依据 |
|---|---|---|---|
| D1 三层上下文分离 | **维持，补三点** | ①协作面必须是可重建的权威状态（事件 + 投影），不是摘要；②协作面新增“决策 / 假设 / 禁止事项”一等记录，而非只有任务与产物；③对话面只是投影，不承载协作状态 | LHTB 状态漂移；Cognition 动作携带隐式决策；D2 事件溯源 |
| D2 黑板优先 / Lead 降级 | **修改（拆分）** | 黑板 = 协作状态权威（保留）；“Lead 不再是唯一路由器”改为“路由由规则调度器执行，Lead 保留调度所有权、取舍与仲裁”；任务领取/租约从 P1.5 推迟到 P2，且仅用于均匀扇出批次 | 无产品把领取式黑板作为默认；LangChain/Anthropic 均为协调者模式；Magentic 台账 = 协调者 + 外化状态 |
| D3 协调策略层 | **修改（缩小决策面）** | 决策对象从六模式收敛为三元组（并行度 / 隔离级别 / 是否需人工闸门）；P1 只上规则，边界带小模型在累计 ≥200 条人工标注后启用；决策附带触发它的指标采样引用 | 规则优先仍正确；但 2026 无“评分选拓扑”的产品或论文证据，多做一层只增不可测复杂度 |
| D4 最小充分范式 + 按证据升级 | **维持，补适配条件与更便宜的升级路径** | 升级前先尝试“压缩 + 子任务隔离 + 拆句柄”；升级判据增加“未言明决策数”（子任务间共享假设超过阈值才禁止并行），把“上下文 >70%”降为必要非充分条件 | 15× 成本；Cognition 两原则；LangChain 干扰域实验 |
| D5 模式菜单 | **修改（收敛）** | 保留 M0 solo / M1 orchestrator（含扇出）/ M3 pipeline / M6 human；M2 从拓扑降为“项目域状态模型 + 均匀扇出调度”；M4 降为“两级扇出，不设子 Lead”；M5 debate 移出运行时菜单（仅作离线复核） | 辩论反效果证据；层级信息损耗；领取无产品证据 |
| D6 上下文包 / Context Broker | **修改（补字段与例外）** | 包内必含 decisions、assumptions、forbidden、upstreamDiffRef；提供受控 fork 模式白名单（强耦合子任务允许继承决策，不允许继承完整轨迹）；以“交接信息丢失率”作为验收指标 | Cognition 原则 1/2 与 Anthropic 隔离收益的冲突，只能用“共享决策、不共享轨迹”消解 |
| D7 可解释可审计 | **维持，加回链** | 每条决策记录 decisionId，可回链 runId、trace（OTel）、eval 结果；否则无法回答“失败是模型、工具还是编排” | Foundry 的 trace 与 eval 回链；05 §2.6 |
| D8 黑板视图只读投影 | **维持，补三条** | ①跨执行单元的审批不可代答；②命令入口幂等 + 记录 actor + 写审计；③投影需带过期/降级状态，避免 UI 显示陈旧状态即真 | Claude Projects 审批边界；单一写入口原则 |
| 新增 D9 | **建议新增** | 任何 M2 及以上拓扑，必须先有自家 pass^k A/B 证据才能进入默认路径；无证据时保持 M0/M1 | τ-bench pass^k；MAST 失败率；ADR 现有重议条件缺一致性指标 |
| 新增 D10 | **建议新增** | 每个 Run 携带可撤销身份与能力声明（角色、工具白名单、来源、审批人），审计只认该身份；本地单机版用本地角色 id 实现，不引入企业 IdP | Entra Agent ID、CSA registry v1、OWASP ASI03 |

## 6. 值得引入 / 不引入

### 6.1 值得引入（按性价比排序）

| # | 机制 | 落点 | 为什么现在 |
|---|---|---|---|
| A1 | **任务台账 + 进度台账**（Magentic） | 协调策略层 / 项目域 | 把 Lead 的单点判断变成可读状态：任务台账写事实/假设/计划，进度台账每步自评是否在推进，卡住即触发重规划。直接修 D2 与 D7 |
| A2 | **决策外显的上下文包** | Context Broker | 补 decisions/assumptions/forbidden，解决 Cognition 指出的隐式决策冲突；成本低、可测（交接信息丢失率） |
| A3 | **单次交接接口写死** | 编排层 | 父读 summary/artifacts/evidence/failures，子不多消息；Claude、Manus、Gemini、Deep Agents 四家同构，已无需再论证 |
| A4 | **独立评估器三态 + pass^k 门槛** | 验证闭环 / 评测 | 不仅判“完成”，还判“稳定完成”；把“是否升级拓扑”从直觉变成对照实验 |
| A5 | **证据附件型交付** | Artifact 模型 | 录屏/测试摘要/trace 链接；Devin 与 Codex 都靠真实执行而非自述 |
| A6 | **Run 级身份与能力声明** | 治理层 | 最小版 registry：谁派的、能用什么、可撤销；为将来 A2A 留位，不等 A2A |

### 6.2 不引入（附理由）

| # | 机制 | 理由 |
|---|---|---|
| N1 | 自由 swarm / 群聊式 handoff | 15× 成本；协调失败集中在不对齐；不可复现、不可审计；与 D1 最小充分冲突 |
| N2 | 竞价 / 合同网式分工 | Magentic Marketplace：首提案偏差 10–30×、规模上升即崩；本地单用户没有市场，只有开销 |
| N3 | 运行时辩论（M5 默认可用） | 有由对转错的直接证据；只在离线复核、且判据冲突时作为人工工具 |
| N4 | 自进化 / 自动 optimizer 进主路径 | DGM 单轮 2.2 万美元、两周；收益是 harness 级改动，需沙箱与人工审阅；v0.1 只做离线挖掘 + 人工采纳 |
| N5 | 通用 agent OS 内核（AIOS 式调度器） | 学术原型，无生产验证；我们已有 DSH 的 loop/tool/session seam，自建内核等于重写执行面 |
| N6 | 内部拓扑改造为 A2A / 自建 registry 服务 | 冷启动依赖外部 agent 生态；v0.1 无外部对接方。只对齐 TaskStatus 词表与 AgentCard 概念 |

## 7. 局限与未找到

- **未找到公开资料**：①“上下文包 vs 继承历史”的对照实验；②领取式黑板在通用 agent 产品中的调度数据；③M2/M4 相对 M1 的 pass^k 对比；④A2A v1.0 大规模生产部署数据。
- **二手占比**：Agent Teams 细节、Entra Agent ID GA、A2A v1.0 稳定日期、MetaGPT 停滞均来自二手（C），已标注；MAST 的 41%–86.7% 区间取自二手汇总，原论文只给框架与失败模式。
- **厂商自测**：Wide Research 的 8–10 条退化、Anthropic 的 90.2%、DGM 的 20至50% 均为厂商或作者自测，未独立复现。
- **结论稳健度**：C1/C3/C4/C5 由多源互证，可直接用于改 ADR；C2 是两方对立证据的合成判断，建议在 ADR 中写成“待 A/B 验证的设计假设”，而不是结论。
