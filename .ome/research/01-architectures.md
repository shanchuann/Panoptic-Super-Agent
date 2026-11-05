# 超级智能体 · 架构与编排调研（2025–2026）

日期口径：2026-11-05（Asia/Shanghai）。取证限制：本环境无法直连 github.com / huggingface.co（域名解析到非公网地址），框架事实以官方文档站、PyPI/npm 元数据为准；下文"日期不详"指文档页无发布日期。

## ① 一页结论（7 条）

1. 【推断】2026 年的生产形态已收敛为"单循环内核 + 外置会话日志 + 可替换手脚"的三层 harness：Anthropic 把 brain / hands / session 拆成三个接口（2026-04），Manus 2.0 把自家 harness 迭代为 Cascade（2026-09），LangChain 把 Deep Agents 直接定义为 harness。
2. 【事实】会话状态必须与模型上下文窗口解耦：Claude Managed Agents 的 session 是落在 harness 之外的持久事件日志，harness 崩溃后可用 wake(sessionId) 重放，并用 getEvents() 按位置切片重读。
3. 【事实】多智能体只在三类任务上划算——强并行、信息量超单窗口、工具面复杂；Anthropic 自测 agent 约为 chat 的 4× token、多智能体约 15×，并明确"多数编码任务并行度低、不适合多智能体"；学术侧 MAST 对 1600+ 条轨迹的标注显示，失败集中在系统设计、协作对齐与验证，而非模型能力。
4. 【事实】工具接口的事实标准已是 MCP（现行规范版本 2026-07-28）；但执行层应收敛为 execute(name, input) → string 的统一抽象，使 MCP server、自有工具、沙箱可互换。
5. 【事实】成本与延迟的主变量是上下文而非模型：Manus 称 agent 的输入/输出 token 比约 100:1，缓存与未缓存输入单价差约 10×；Claude Code 企业均值约 $13/活跃人日。
6. 【事实】框架差异不在"能不能跑 agent"，而在持久化/中断恢复、工具接口、可观测、沙箱四件事；许可多为 MIT / Apache-2.0，仅 Claude Agent SDK 属非标准开源（npm 元数据：SEE LICENSE IN README.md）。
7. 【推断】第一版建议：单 agent 循环 + 受控 subagent（只回摘要）+ append-only 事件日志 + MCP 兼容工具层 + 容器沙箱 + 文件工作区作为交付面。

## ② 证据表

| claim | 来源 URL | 日期 | 可信度 |
|---|---|---|---|
| 区分 workflow（预定义代码路径）与 agent（模型自定流程），建议从最简方案起步 | anthropic.com/engineering/building-effective-agents | 2024-12-19 | 高 |
| Research 用 orchestrator-worker；agent ≈4×、多智能体 ≈15× token 于 chat；编码任务并行度低不宜多智能体 | anthropic.com/engineering/multi-agent-research-system | 2025-06-13 | 高 |
| 解耦 brain/hands/session；session=上下文之外的事件日志，getEvents() 切片重读；execute() 统一手脚；p50 TTFT −60%、p95 −90% | anthropic.com/news/managed-agents | 2026-04-08 | 高 |
| 默认不要多智能体：须共享完整 trace；动作隐含决策，冲突决策带来坏结果 | cognition.com/blog/dont-build-multi-agents | 2025-06-12 | 高（厂商立场） |
| MAS 基准增益常很小；MAST 归纳 14 种失败模式/3 大类（系统设计、协作对齐、任务验证），人工标注 κ=0.88，覆盖 7 个框架 | arxiv.org/abs/2503.13657 | 2025-03-17（v3 2025-10-26） | 高（同行评审前） |
| 上下文工程是首要工作；Manus 自述重写框架 4 次、输入输出比 ≈100:1、缓存单价差 10× | manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus | 2025-07-18 | 高（厂商自述） |
| Manus 2.0：Cascade harness、Cloud Computer、事件触发 Automations；单配置下 token −23.2%、耗时 −28.2%、成本 −32% | manus.im/blog/introducing-manus-2-0 | 2026-09-28 | 中（厂商自测） |
| Claude Agent SDK 复用 Claude Code 的 agent loop，含 sessions（continue/resume/fork）、file checkpointing、hooks、subagents | code.claude.com/docs/en/agent-sdk/overview、/agent-loop、/sessions | 日期不详 | 高 |
| Claude Code 子代理有独立上下文窗口、只回传摘要；子代理描述合计超 15k token 会告警 | code.claude.com/docs/en/sub-agents | 日期不详 | 高 |
| Claude Code 的 agent teams 标为 experimental、默认关闭，已知限制含会话恢复与任务协调——多智能体尚未成为其默认架构 | code.claude.com/docs/en/agent-teams | 日期不详 | 高 |
| Claude Code 上下文管理=compaction + 清理旧工具结果 + prompt caching（文档示例：91% 输入 token 命中缓存，压缩会触发缓存重建） | code.claude.com/docs/en/costs、/prompt-caching | 日期不详 | 高 |
| Agent loop 被定义为"收集上下文→行动→验证结果"的循环，而非教科书式 plan/act/observe/reflect 四段 | code.claude.com/docs/en/how-claude-code-works | 日期不详 | 高 |
| Claude Code 按 token 计费；企业均值 ≈$13/活跃人日、$150–250/人月、90% 用户 <$30/日 | code.claude.com/docs/en/costs | 日期不详 | 高 |
| OpenAI Agents SDK 新增 Sandbox Agents（持久工作区、Manifest、快照恢复）；编排有 agents-as-tools 与 handoffs；内置 tracing | openai.github.io/openai-agents-python/sandbox_agents、/multi_agent、/tracing | 日期不详 | 高 |
| ChatGPT agent 发布；页面现标注"launch post is outdated"，指向 Workspace agents / ChatGPT Work | openai.com/index/introducing-chatgpt-agent/ | 2025-07-17（原文） | 高 |
| Deep Research 发布（研究型 agent 的最早产品化形态之一） | openai.com/index/introducing-deep-research/ | 2025-02-02 | 高 |
| LangGraph=低层编排运行时：checkpointer+store 持久化、interrupt 做人在环、time travel；Deep Agents 在其上封装规划/子代理/文件系统/上下文管理 | docs.langchain.com/oss/python/langgraph/overview、/persistence | 日期不详 | 高 |
| ADK 原语：Agent / Tool / Session-State / Artifact / Memory / Runner，另含 Sequential、Parallel、Loop 工作流 agent | adk.dev/get-started/about | 日期不详 | 高 |
| MCP 现行规范为 client-server、host 连多 server、只定义上下文交换，不管编排与上下文管理 | modelcontextprotocol.io/docs/2026-07-28/learn/architecture | 2026-07-28（规范版） | 高 |
| AutoGen 末次发布 0.7.5；Microsoft Agent Framework 自称 AutoGen+Semantic Kernel 的直接继任者，含 Harness Agent（规划/todo/上下文压缩/文件记忆/工具审批） | pypi.org/project/autogen-agentchat + learn.microsoft.com/agent-framework/overview | 2025-09-30 / 日期不详 | 高 |
| 许可：LangGraph MIT、OpenAI Agents MIT、ADK Apache-2.0、smolagents Apache-2.0、AutoGen MIT、AG2 Apache-2.0（PyPI 元数据）；Claude Agent SDK 非标准开源（npm） | pypi.org/pypi/*/json、registry.npmjs.org | 2026-11-05 读取 | 中高 |
| CellCog 以"角色化 AI 员工（super-agents）"售卖，自称 2026-10 DeepResearch Bench 第一 | cellcog.ai | 日期不详 | 低（厂商自述） |

## ③ 候选架构与框架对比

**③-1 四种执行形态**

| 形态 | 代表 | 代价 | 主要风险 |
|---|---|---|---|
| 单循环 + 工具 | Claude Code/Agent SDK、Cascade | 上下文膨胀、串行慢 | 长任务提前收尾、爆窗 |
| 显式任务图（节点/边） | LangGraph、ADK workflow agents、CrewAI Flows | 需预先建模、灵活性差 | 流程模板僵化成负债 |
| orchestrator-worker 多智能体 | Anthropic Research、Claude agent teams | ≈15× token、调试难 | 决策冲突、结果不一致 |
| 自由多智能体/角色扮演 | AutoGen/AG2、CrewAI Crews | 成本与链路最长 | 不可复现、失败率最高 |

多智能体的产品化程度比宣传低：Anthropic 自家 agent teams 仍默认关闭，说明"单循环 + 受控子代理"才是当前可交付的默认值；多智能体只在并行探索/互查场景按需开启。

【风险提示】compaction 本质是丢弃信息且不可逆；Managed Agents 的做法是把原始事件留在 session、只在 harness 读取时做变换——这是"事件日志（可回放）+ 视图（可压缩）"必须分离的核心理由。

**③-2 框架对比**

| 框架 | 持久化/中断恢复 | 工具接口 | 可观测 | 沙箱 | 许可 |
|---|---|---|---|---|---|
| Claude Agent SDK | sessions 落盘 + resume/fork + file checkpoint | 进程内工具 + MCP + hooks | 结构化消息流 + hooks | Claude Code 内置 OS 级 bash 沙箱（文件/网络） | 非标准开源（待核） |
| OpenAI Agents SDK | 会话上下文 + RunState + Sandbox 快照 | function/hosted tools + MCP + computer use | 内置 tracing | unix-local / Docker / 托管 sandbox client | MIT |
| LangGraph(+Deep Agents) | checkpointer/store、interrupt、time travel | LangChain 工具 + MCP 适配 | LangSmith / OTel | 无内置，自备 | MIT |
| Google ADK | Session/State/Event + Memory + Artifact | 函数工具 + MCP + 内置 code exec | OTel / Cloud Trace | 内置 executor、部署侧隔离 | Apache-2.0 |
| smolagents | 无持久化（进程内） | 工具即 Python 函数，CodeAgent 写代码执行 | OTel/Langfuse 等 | E2B / Docker executor | Apache-2.0 |
| AutoGen / AG2 | save_state / load_state | AgentChat 工具、Core actor 模型 | OTel | Docker code executor | MIT / Apache-2.0 |
| CrewAI | Flows @persist 状态持久化 | 工具 + crew/flow 编排 | 第三方集成 | 依赖部署环境 | 未核验 |
| OpenHands | Agent Server（REST/WS）会话与事件、Cloud/Enterprise | SDK 工具 + workspace | 事件流 + 云控制台 | Docker/远程 runtime | 未核验 |

**③-3 产品形态参考**（均按官方页面）

| 产品 | "目标→成品"如何组织 | 形态/定价线索 |
|---|---|---|
| Manus 2.0 | Cascade harness 按需加载能力；Cloud Computer 给项目常驻环境；Automations 事件触发；Studio 让成品可再编辑（视频时间线） | 订阅 + 额度，另售 Cloud Computer（具体数字官网 JS 渲染，未取到） |
| Claude Code / Cowork | 终端/桌面/云端会话，subagents 隔离上下文；Cowork 已并入主产品，向 Pro/Max/Ultra 开放 | 订阅（Pro/Max/Ultra/Team）+ API token 计费 |
| ChatGPT agent / Deep Research | 自带虚拟机与浏览器执行多步任务；官方页已标注旧文过时，指向 Workspace agents / ChatGPT Work | 订阅分层 |
| CellCog | 角色化"AI 员工"协作为主形态，高风险动作等用户确认，主张交付结果而非建议 | 免费试用 + 订阅 |

## ④ 对本项目的启示

**现在必须定死（返工成本高）**
1. 状态模型：任务/会话状态外置为 append-only 事件日志（session ≠ 上下文窗口），先定事件 schema 与存储，再写 agent。
2. 执行骨架：单循环 + 受控 subagent（只回摘要、独立上下文），不上自由多智能体。
3. 工具协议：对外兼容 MCP，对内统一 execute(name, input) → string 适配层，避免被单一框架绑死。
4. 沙箱边界：容器为默认执行环境，凭证不入沙箱（代理/金库），否则后期安全重构代价极高。
5. 交付面：文件工作区 + artifact 为一等公民（可下载、可预览、可回溯版本）——这是"交付成品"与"聊天"的分界。
6. 上下文策略：稳定前缀（利于 KV-cache）、append-only、compaction + 文件外置记忆三件套同时具备。

**可以后置**
1. 多智能体团队协议与角色体系；2. 事件触发自动化与常驻云主机；3. 跨会话长期记忆；4. 自研/微调模型；5. 企业 RBAC 与合规审计；6. 多框架抽象层（先选一家 SDK 写死，别过早抽象）。

## ⑤ 未解决问题

1. **单/多智能体的对照失败率**：MAST 给出失败分类与标注数据，但没有同一任务集上"单智能体 vs 多智能体"的失败率对照；本环境无法访问 GitHub 上的原始 trace。→ 先用自家任务集跑 pass^k 对照。
2. **各框架沙箱的真实边界**：文档只写"支持 Docker/托管沙箱"，不写网络隔离与凭证代理的实现细节。
3. **产品定价硬数字**：Manus / CellCog 定价页为 JS 渲染，Genspark 返回 403，故全文不写具体价格。
4. **Claude Agent SDK 许可正文**：npm 元数据指向 README，但 README 无许可条款；GitHub 不可达。
5. **harness 层是否会出现互操作标准**：Anthropic / OpenAI / Manus / LangChain 各自定义，暂无中立基准可引用。
