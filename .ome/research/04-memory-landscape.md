# 记忆系统全景调研：中国厂商、开源方案与可落地机制

> 调研日期：**2026-11-07** ｜ 资料范围：2023-04 至 2026-11 ｜ 作者：memory-researcher
> 关联：`.ome/research/02-capabilities.md` 已给出记忆层选型结论与基准分数冲突（第 4、9、15–21 条）；本文不重复选型，只补**机制、公式、标签体系、删除路径**与**中国厂商一手资料**。
> 证据等级：**A 一手已核**（论文原文 / 官方文档 / GitHub API / 公司技术号原文，均已打开确认）；**B 二手转述**（第三方文章、汇编、评测转述）；**C 厂商自述**（官方宣传或自报指标，未被独立复现）；**D 推断/建议**（本文综合判断，不可当事实引用）。
> 星数均为 **2026-11-07** 通过 GitHub REST API 取得的快照，会随时间变化；不要把它当稳定排名。

---

## 0. 一页结论

1. **用户要的"抽象层 + 原始证据"已被多家中国厂商独立做出来**：货拉拉是 L0 原始数据 至 L1 感知 至 L2 决策 至 L3 画像；腾讯 TencentDB Agent Memory 是 L0 Conversation 至 L1 Atom 至 L2 Scenario 至 L3 Persona。两者都强调"低层保留证据、高层保留结构"，并支持从高层下钻回原文（腾讯用 `node_id`）。这是本次调研最强的设计印证。腾讯混元另外开源了 **Hy-Memory**（Apache-2.0，Chat 记忆 L0–L7，见 2.6）。
2. **"标签决定管理策略"在开源里最接近的是 Letta 的 memory block label + archival tag、LangMem 的 semantic/episodic/procedural 三分、LlamaIndex 的 block name/priority、A-MEM 的 keywords/tags。** 没有一家把"标签 至 TTL/衰减/共享/删除策略"做成完整规则引擎；这正是我们可以差异化的地方。
3. **真正给出显式遗忘公式的只有两条线**：Generative Agents 的 `recency = 0.995^小时` + 三元加权检索；MemoryBank 的 `R = e^{-t/S}`、`S` 初始 1、每次召回 `S+1` 且 `t` 归零。其余方案要么没有衰减（Zep、GraphRAG、RAPTOR、A-MEM、Cognee、LlamaIndex），要么只做"排序偏置"（Mem0 Decay 0.3×–1.5×），要么只做"逻辑失效"（Zep 的边失效）。
4. **"权重"在工业界通常不是单一标量，而是三件事**：重要性（写入时打分）、时效（检索时衰减/时间过滤）、强化（被召回或确认后加权）。LangMem 明确写"relevance 应结合 similarity + importance + strength（strength 是最近/最频繁使用的函数）"；Mem0 把 strength 落成 0.3–1.5 的乘子；GA 把它落成加权和。这三种实现可以合并成我们的权重公式。
5. **"用户一定要记住的权重为 1"需要单独的 pin 语义**：目前没有现成方案把 pin 做成一等公民。可行做法是 `pinned=true` 时半衰期设为无穷、权重恒为 1，并跳过自动淘汰；Mem0 的 expiration 只解决"到期隐藏"，不解决 pin。
6. **删除与遗忘要分开建模**：Mem0 的 expiration 是"隐藏，不删除"；Cognee 的 `forget()` 是"真删图/向量/关系数据 + 清缓存"；Claude memory tool 把存储完全交给调用方（client-side），天然可做租户隔离与物理删除。GDPR Art.17 要求覆盖 embedding/index/cache/log 等派生副本（02 文档已列），所以"软遗忘"和"硬删除"必须是两条独立路径。
7. **写入时机正在从"每轮写"转向"每 N 轮 + 后台整合"**：腾讯默认每 5 轮抽一次 L1、每 50 条新记忆生成画像；LlamaIndex 在 token 超限时把旧消息刷入长期块；Letta/OpenAI/Mem0 都有后台 "dreaming" 式整合。这比"每轮都让 LLM 决定写不写"更省 token，也更稳定。
8. **中国厂商的公开材料质量差异很大**：货拉拉给的是完整架构 + 实验表（但是公司技术号自述，无独立复现）；腾讯给的是开源仓库 + README + 官方博文（MIT，可自托管），但**没有公开权重/衰减公式**，也**没有公开 L1/L2/L3 的抽取 prompt**。
9. **不要直接采信任何记忆榜单**：Mem0 自报 LongMemEval 94.4，独立评测同 benchmark 49.0（差 45.4 分，02 文档第 16 条）；Zep LoCoMo 84 / 第三方复现 58.44 / Zep 反驳 75.14（第 17 条）。本调研因此把"厂商自报指标"统一标 C，只把架构与公式标 A。
10. **对 Panoptic Super 最稳的路线**：L0 证据库（append-only）+ L1 原子记忆（带标签）+ L2 场景/项目层 + L3 用户/团队画像；模型默认只读 L2/L3 与按需召回的 L1，L0 只通过引用下钻。权重与半衰期按标签分档，pin 恒为 1，检索分 = 相关性 × 权重 × 标签优先级，删除分软/硬两条路径。**这套组合没有现成开源可直接套用，需要自建薄层**（与 02 文档"记忆存储可接现成、写入策略自建"的结论一致）。

---

## 1. 方法与口径

- 检索工具：`web_search` / `web_fetch`；中文厂商优先找公司技术号原文（掘金、腾讯云开发者社区、官方产品页），开源项目以 GitHub REST API + 仓库 README + 官方文档为准，论文以 arXiv HTML 原文为准（公式从原文摘录）。
- "7 个问题"统一为：① 分层结构 ② 写入时机 ③ 检索打分（是否含权重/时效） ④ 遗忘/衰减（有无显式公式，原文摘录） ⑤ 标签/分类体系 ⑥ 许可证与自托管可行性 ⑦ 证据等级。
- 冲突数字**并列，不取平均**；厂商自报与独立评测分开列。见第 8 节。
- 本文只写 `.ome/research/04-memory-landscape.md`，不改源码、不改 `.ome/DESIGN.md` 与 `.ome/design/*`。

---

## 2. 中国厂商方案

### 2.1 货拉拉（Huolala）：对话式 Agent 的四层渐进式记忆

**一手来源**：货拉拉技术（AI 应用组 郑绮欣、吴湖龙、张广发），《记忆即智能：重构对话式 AI Agent 认知基座的四层渐进式记忆与自进化系统》，掘金，**2026-11-04**。
链接：https://juejin.cn/post/7703850980559667234

这是本次调研找到的**最直接命中用户设计要求**的中文一手材料。文章明确说设计动机是"把扁平标签升级为原始数据至当时观察至当下判断至长期画像的递进加工链路"，并给出上线实验数据。

#### 分层结构（原文 2.3）

| 层 | 名称 | 职责 | 写入时机 | 内容 |
|---|---|---|---|---|
| **L0** | 数据底座 | **只存不判**：100% 还原现场 | 实时落库 | 原始消息（含时间戳、消息 ID）、完整对话原文、事件流 |
| **L1** | 感知层 | **只观察不决策**：每条消息的意图、情绪、回溯信号、行为完成度 | 每条消息后**毫秒级** | 粗/细粒度意图、情绪判断等 |
| **L2** | 决策层 | **唯一调度者**：阶段状态机、策略库、规则库，"该走哪条路"由它决定 | 每条消息后 | 阶段状态、策略选择、规则命中 |
| **L3** | 画像层 | **长期记忆**：用户维度 6 个核心特征 | **每日凌晨 2:00 全量重算**（覆盖式 UPDATE）+ **每 ≥5 条消息**实时重算"忙碌标签、回复风格" | 价格敏感度、信任度、操作熟练度、偏好时段、忙碌标签、回复风格 |

原文关键句：

> "渐进式体现在两个层面：L0 实时落库 至 L1 准实时分析（每条消息后毫秒级）至 L2 实时调度（每条消息后）至 L3 24h 定时 + 实时微调"
> "把'扁平标签'升级为'原始数据至当时观察至当下判断至长期画像'的递进加工链路"

#### 写入时机

- L0：每条消息实时写。
- L1：每条消息后毫秒级分析。
- L2：每条消息后调度。
- L3：每日 2:00 全量覆盖式 UPDATE；会话内每 ≥5 条用户消息，即时重算忙碌标签与回复风格两个高频维度。
- 跨渠道：以用户身份标识为主键，打通 App/小程序/H5/电话/IM；L3 画像渠道无关，凌晨重算时合并两渠道数据；电话结束时的"用户状态"写入 L0，IM 开场读取。

#### 检索/决策如何打分

- **没有公开的检索打分公式**。L2 是唯一调度者，由"阶段状态机 + 策略库 + 规则库"决定下一步策略；L3 画像作为决策输入。
- 文章的关键词里**没有"权重"和"衰减"**（我已对原文全文做过关键词检查，均未出现）。它做的是"分层 + 状态机 + 策略效果闭环"，不是"标量权重衰减"。
- 策略自进化：按效果淘汰/保留策略（"汰劣留优"），实验期策略淘汰率 1%（下线两条），策略推进率 72%至80%。

#### 遗忘/衰减

- **无显式公式**。
- 但有事实上的"旧画像被覆盖"：L3 每日全量重算、覆盖式 UPDATE；旧画像不保留多版本（文章未提版本化）。
- 策略层有"淘汰"：效果差的策略下线。

#### 标签/分类体系

- L3 固定 6 维画像（价格敏感度、信任度、操作熟练度、偏好时段、忙碌标签、回复风格）。
- L2 有策略库/规则库，但没有公开的标签 schema。
- L1 有意图（粗/细）、情绪、回溯信号、行为完成度。

#### 效果数据（厂商自报，C）

| 指标 | 常用记忆策略 | 渐进式记忆架构 |
|---|---|---|
| 任务转化率 | 58.3% | **60%** |
| 平均消息数 | 18.4 条 | **12.1 条** |
| AI 响应延迟 | 0.25s | **0.45s** |
| 流失率 | 2.8% | **1.2%** |
| 画像覆盖率 | —（无画像能力） | **75%** |
| 策略推进率 | 72% | **80%** |

实验条件：2 周、账号分流。作者自己的结论是"以单轮慢 0.2s 的代价，换转化 +1.7pp、流失 -1.6pp、画像从 0 到 75%"。

#### 许可证与自托管

- **无公开代码/仓库/许可证**；纯技术博客。不能直接复用实现，只能借鉴架构。

#### 证据等级

- 架构、写入时机、实验设计：**A（公司技术号原文，已打开确认）**。
- 指标：**C（厂商自报，无独立复现）**。

---

### 2.2 货拉拉的知识侧：从 Naive RAG 到 GraphRAG 的元数据检索

**一手来源**：货拉拉技术（陈元，RAG 平台工程师；刘志鹏），《从 RAG 到 GraphRAG：货拉拉元数据检索应用实践》，掘金，**2026-03-18**。
链接：https://juejin.cn/post/7618261670406438964

这篇不是"记忆"，但它是同一家公司对"知识如何组织、如何加权检索"的一手实践，和记忆的检索层直接相关。

- 方案 1.0（Naive RAG）：**回答准确率 55%，召回率/TopK 命中率约 60%**。
- 问题归因：知识库"营养不良"（只有 schema+comment，缺业务背景/口径/血缘）、检索"单一薄弱"（只靠向量）、边界感缺失。
- 方案 2.0（GraphRAG，基于 LightRAG）：三类实体，表/字段、业务术语/缩写、同义词层；离线建图 + 向量；在线"低级关键词（同义词扩展）至 混合检索（向量+BM25）+ 重排 至 TopK 实体 至 图谱关系 至 Local Query Context；高级词 至 Embedding 至 TopK 关系 至 Global Query Context"。
- **显式权重公式（原文 3.4）**：

```text
表分数   = manual_boost_1 × (w1 × score_downstream + w2 × score_popularity + w3 × score_star)
字段分数 = manual_boost_2 × (w4 × base_score + w5 × table_factor)
术语词汇分数 = 1
```

- 效果：整体准确率从 **56% 提升至 78%**，知识召回率 **91%**、TopK 命中率 **90%**、**MRR 0.73**；AI 检索渗透率约 30%，数仓答疑节省 20%+ 时间。
- **同一篇文章内部冲突**：3.3 节说 Naive RAG 准确率 "55%"，3.5 节说 "从 56% 提升至 78%"。并列，不取平均。
- 证据：架构与公式 **A**；指标 **C（厂商自报）**。

**对记忆设计的直接启发**：这套"表分数/字段分数 + manual_boost + 多因子加权"说明工业界已经在用**多因子加权 + 人工 boost** 做知识检索排序；记忆的权重公式可以复用同样的形态（相关性 × 权重 × 人工 pin/boost），而不是纯向量相似度。

---

### 2.3 腾讯：需要核实的三个名字

用户提示可能是 WeKnora / 腾讯云智能体记忆 / T-MEM。核实结果如下：

| 名称 | 是否腾讯 | 实际性质 | 核实证据 |
|---|---|---|---|
| **TencentDB Agent Memory** | ✅ 是（腾讯云数据库团队） | **Agent 分层记忆引擎**，已开源 | 官方博文 + GitHub 仓库 + 产品页 |
| **WeKnora（维娜拉）** | ✅ 是（腾讯） | **企业知识管理框架**（RAG + Agent + Wiki），**不是记忆系统** | 官方文档 + GitHub |
| **T-Mem**（arXiv 2606.15405） | ❌ 未找到与腾讯的隶属证据 | 一篇 2026-06 的长期对话记忆论文（write-time triggers） | arXiv 作者列表未显示腾讯；不建议归到腾讯 |
| 腾讯云"Agent 记忆服务" | ✅ 是 | TencentDB Agent Memory 的**商业化产品形态** | 产品页 `cloud.tencent.com/product/agm` |

**结论：用户要找的"腾讯开源记忆设计"，真实项目名是 `TencentDB Agent Memory`，不是 WeKnora，也不是 T-MEM。** WeKnora 是知识库侧的另一条线，可以作为"知识层"参考，但不要把它当记忆系统引用。

---

### 2.4 TencentDB Agent Memory（腾讯云数据库团队，MIT）

- 仓库：https://github.com/TencentCloud/TencentDB-Agent-Memory （`Tencent/TencentDB-Agent-Memory` 会重定向到该组织）
- GitHub 快照（2026-11-07）：**30,591 stars / 2,982 forks**；创建 2026-04-07；最近 push 2026-11-04；主语言 TypeScript；默认分支 `feat/server_team`；open issues 888。
- 许可证：**MIT**（LICENSE 原文："TencentDB Agent Memory is licensed under the MIT."；GitHub API 因自定义头显示 `NOASSERTION`，以 LICENSE 原文为准）。
- 官方开源博文：https://cloud.tencent.com/developer/article/2668579 （腾讯云 NoSQL 技术，**2026-05-13**）
- 产品页：https://cloud.tencent.com/product/agm

#### 分层结构

**短期记忆（单次长任务）三层**：
1. 底层：原始工具调用结果卸载到外部文件（`refs/*.md`），保留全文；
2. 中层：步骤摘要（`jsonl`）；
3. 高层：极轻量的 **Mermaid 任务画布**，带 `node_id`；上下文中只放高层结构，需要时按 `node_id` 下钻回原文。

**长期个性化（跨会话）L0–L3 语义金字塔**：
- **L0 Conversation**：原始对话；
- **L1 Atom**：结构化事实、偏好、约束、阶段结论（官方博文明确列出这四类）；
- **L2 Scenario**：按任务自动聚合的场景块；
- **L3 Persona**：持续蒸馏的稳定长期画像。

**存储异构**：低层（事实、日志、轨迹）进数据库/归档文件，保证全量检索；高层（画像、场景、画布、Skill）进可读的 Markdown 文件系统，保证白盒可调。原话："**低层保留证据，高层保留结构**"；"每一条信息都 100% 可找回、可恢复"。

#### 写入时机（来自 README 配置默认值）

- 每次对话自动录制；**每 5 轮对话触发一次 L1 提取**（`pipeline.everyNConversations = 5`），单次最多 20 条（`extraction.maxMemoriesPerSession = 20`）。
- **每 50 条新记忆触发一次用户画像生成**（`persona.triggerEveryN = 50`）。
- 下一轮对话前自动召回。
- 短期记忆压缩（context offloading）**默认关闭**（`offload.enabled = false`），需显式开启。

#### 检索打分

- 召回策略默认 `hybrid`：**BM25 + 向量 + RRF 融合**；`recall.maxResults = 5`；可配 `keyword` / `embedding` / `hybrid`。
- 官方产品页表述为"增强型双路召回：Embedding + 双路检索，兼顾语义与关键词命中"。
- **没有公开的权重公式**；RRF 是排名融合，不是时间衰减。

#### 遗忘/衰减

- **没有公开的显式衰减公式**。
- 机制上有"归档/过期"位置：MemOS 式的生命周期不是它的说法；它的公开材料只讲分层与压缩，不讲权重衰减。
- 产品侧有备份、回档、权限管控、记忆库分配回收（偏治理，不是遗忘算法）。

#### 标签/分类体系

- L1 四类：事实、偏好、约束、阶段结论。
- L2 场景（按任务聚合）。
- L3 画像。
- 短期记忆用 Mermaid 节点 + `node_id` 做结构索引。
- 没有公开的通用标签 schema（如 type/scope/sensitivity/TTL）。

#### 许可证与自托管

- **MIT**，可自托管；默认后端 **SQLite + sqlite-vec**，零外部 API 依赖；提供 OpenClaw 插件与 Hermes Gateway Docker 镜像。
- 商业产品（腾讯云 Agent Memory）提供团队记忆、权限、备份、按小时计费；开源版与云版能力边界未在 README 中逐条列明。

#### 效果（厂商自报，C）

| 能力 | Benchmark | OpenClaw | 加插件 | 相对变化 | Token 变化 |
|---|---|---|---|---|---|
| 短期 | WideSearch | 33% | 50% | **+51.52%** | 221.31M 至 85.64M（**−61.38%**） |
| 短期 | SWE-bench | 58.4% | 64.2% | +9.93% | 3474.1M 至 2375.4M（−33.09%） |
| 短期 | AA-LCR | 44.0% | 47.5% | +7.95% | 112.0M 至 77.3M（−30.98%） |
| 长期 | PersonaMem | 48% | 76% | +59%（相对） | — |

**冲突**：官方博文/README 写 PersonaMem "48% 至 76%"；腾讯云产品页写"总准确率由 **47.85% 提升至 76.10%**，事实召回率由 **29.63% 提升至 79.07%**"。两者方向一致、口径/精度不同，并列。另有第三方文章（知乎，未标日期）称 "GitHub 已经 19.8k Star"，与 2026-11-07 API 的 30,591 冲突，属于时间快照差异。

#### 证据等级

- 仓库、许可证、配置默认值、L0–L3、Mermaid/offload、BM25+RRF：**A（README/LICENSE/官方博文，已打开确认）**。
- 指标：**C（厂商自报）**。

---

### 2.5 WeKnora（腾讯，MIT）：知识库，不是记忆

- 仓库：https://github.com/Tencent/WeKnora
- 快照（2026-11-07）：**36,708 stars / 5,030 forks**；创建 2025-07-22；最近 push 2026-11-03；主语言 Go；版本 v0.9.0；open issues 913。
- 许可证：**MIT**（LICENSE 原文："WeKnora is licensed under the MIT except for the third-party components listed below."；GitHub API 同样因自定义头显示 `NOASSERTION`）。
- 官方文档：https://weknora.weixin.qq.com/docs/01-getting-started/01-introduction
- 定位（官方文档）："腾讯开源的知识库问答系统"，导入 PDF/Word/网页/飞书/Notion/Confluence/语雀/钉钉等资料，问答带引用；架构为 Go 后端 + Vue 3 前端 + Python 文档解析服务 docreader；支持 Docker Compose、Helm、Lite 单二进制、桌面应用。
- 核心机制：RAG（混合检索、多模态解析、原文引用）+ Agent（多步任务）+ Wiki（知识整理），三者共享同一知识库。
- **没有找到独立的长期记忆模块**（会话记忆/用户画像/遗忘机制均未在官方文档中确认）。因此它只能作为"知识层/证据层"的参考，不能作为记忆方案引用。
- 证据：仓库/文档 **A**；"不是记忆系统"是**D（基于公开文档的推断）**。

---

### 2.6 Hy-Memory（腾讯混元，Apache-2.0，Chat 记忆 L0–L7）

- 仓库：https://github.com/Tencent-Hunyuan/Hy-Memory ｜ LICENSE 原文：**Apache-2.0**（GitHub API 因自定义头显示 `NOASSERTION`）。
- 快照（2026-11-07）：**1,993 stars / 143 forks**；创建 2026-10-15；最近 push 2026-11-06；主语言 Python。官网宣称 2026-10-16 发布 Hy-Memory 2.0（专用写入模型 + SDK + MemHub）。
- 记忆形态按 **scene** 路由：`chat`（L0–L7）、`working`（会话事实 + 可复用经验双层）、`coding`（同 working + 代码 diff 链）。
- Chat L0–L7：L0 `BASIC_INFO` / L1 `RAW`（append-only）/ L2 `FACT`（版本化、不可变）/ L3 `SUMMARY` / L4 `IDENTITY`（保留）/ L5 `KNOWLEDGE`（保留）/ L6 `SCHEMA`（心智模型）/ L7 `INTENTION`（**带有效期，过期后转为普通事实**）。
- 写入/检索：`add()` 先过 scene 路由；`search()` 返回 **profile / normal / proactive 三路**，带 score；三档 `lite`（只对原始记忆 embedding、零 LLM）/ `pro`（+ LLM 提取 + reconcile 冲突处理）/ `ultra`（+ System 2 图式归纳 + 跨域 sweeper，图数据库自动开启）。
- 遗忘/衰减：**没有公开的权重/半衰期公式**；唯一显式时效是 L7 有效期；FACT 版本化、reconcile 冲突处理。
- 标签/分类：scene + layer（L0–L7）+ 记忆类型 + 版本；working/coding 经验层需过价值门槛（0–N 条）才写入。
- 证据等级：仓库/README/LICENSE **A**；效果指标**未核实**。

## 3. 开源与论文方案（统一 7 问）

### 3.1 MemGPT / Letta

- 论文：https://arxiv.org/abs/2310.08560 （2023-10-12）
- 仓库：https://github.com/letta-ai/letta （**25,373 stars**，Apache-2.0，2026-11-07）
- 文档：memory blocks https://docs.letta.com/guides/agents/memory-blocks ；archival https://docs.letta.com/guides/agents/archival-memory ；MemFS/dreaming https://docs.letta.com/configuration/memory

**① 分层结构**：OS 式两级。**主上下文**（main context）= 系统指令 + working context + FIFO 消息队列；**外部上下文**（external context）= recall storage（完整消息历史）+ archival storage（任意长文本）。Letta 进一步把"核心记忆"做成 **memory blocks**（常驻 prompt、按 label 组织），archival 做向量检索，2026 文档还有 **MemFS**（git-backed 记忆文件系统）。
**② 写入时机**：对话消息进 FIFO；上下文到 **70%** 发 memory pressure 警告，到 **100%** 触发 flush（驱逐约 50% 窗口、生成递归摘要、被驱逐消息留在 recall storage）；模型可通过函数调用自编辑记忆。Letta 由 agent 主动更新 block，或用 `/remember`；dreaming 用后台 subagent 在"每 N 个 step 或 compaction 后"整合。
**③ 检索打分**：**没有公开的数值打分公式**。主上下文常驻；archival/recall 由模型发函数调用按需检索（语义搜索）。这是"模型自己决定检索"的路线，不是"检索器打分"。
**④ 遗忘/衰减**：**无显式时间衰减公式**。淘汰由上下文压力驱动（flush/摘要/驱逐），不是时间或权重；archival 默认 agent 不可改删（开发者可改）。
**⑤ 标签/分类**：memory block 的 **label**（如 persona/human）是核心抽象；archival 支持 **tags**；没有固定 taxonomy。
**⑥ 许可/自托管**：Apache-2.0，可自托管；云版付费。完整 agent runtime，接入会侵入架构。
**⑦ 证据等级**：论文/文档 **A**；无衰减公式是**A（原文确认）**。

---

### 3.2 Mem0

- 论文：https://arxiv.org/abs/2504.19413 （2025-04-28，ECAI 2025）
- 仓库：https://github.com/mem0ai/mem0 （**68,543 stars**，Apache-2.0，2026-11-07）
- 文档：how-it-works https://docs.mem0.ai/core-concepts/how-it-works ；Decay https://docs.mem0.ai/platform/features/memory-decay ；Dream https://docs.mem0.ai/platform/features/dream ；Expiration https://docs.mem0.ai/platform/features/memory-expiration

**① 分层结构**：**扁平事实层**为主：每条记忆 = 事实文本 + metadata + embedding；写入路径是 SQL（事实与 metadata，真源）+ 向量库（语义）+ 实体库（实体/关系，Platform 上组成 Graph Memory）。没有 L0–L3 分层；但 **Dream** 会在事实之上生成"pattern memory"（高阶模式），并保留到来源记忆的链接，形成事实上的"抽象层 + 证据层"。
**② 写入时机**：**每对消息 (m_{t-1}, m_t) 后**做 extraction，LLM 以 tool call 选择 **ADD / UPDATE / DELETE / NOOP**；Dream 的 **Supersede**（新事实覆盖旧事实）与 **Merge**（去重）**始终开启、写入时触发**；**Synthesis**（把多条事实蒸馏成模式记忆）是 Pro+ 的可选后台任务。
**③ 检索打分**：四类信号，**semantic**（向量）、**keyword**（词面）、**entity**（实体 boost）、**temporal**（写入时抽取的时间 metadata vs 查询的时间意图）；Platform 融合，OSS 只靠向量 + 可选 reranker。**Decay** 在检索时乘一个 **0.3×–1.5×** 的 scaling factor；候选池先扩到 `max(top_k×3, 50)` 再排序。
**④ 遗忘/衰减**：**有，但不是公式而是分档乘子**。Decay 是"软排序偏置，永不筛除"：刚访问 ≈1.5×、今天访问 1.2–1.4×、闲置几天 0.6–1.0×、闲置几周 0.4–0.6×、闲置数月/数年 ≈0.3×（floor）。另有 **Expiration**：`expiration_date`（YYYY-MM-DD，UTC），到期后 `search()/get_all()` 不再返回，但**不删除**，按 ID 仍可取回，清除日期即恢复。
**⑤ 标签/分类**：metadata（自定义字段、可过滤）、`user_id/agent_id/run_id` 作用域、Platform 的 **custom categories**、实体链接；OSS 支持 metadata filtering。
**⑥ 许可/自托管**：Apache-2.0（OSS 可自托管）；Platform/Decay/Dream/Graph 是商业服务，OSS 不保证同等能力。
**⑦ 证据等级**：论文/文档 **A**；指标 **C**（自报 LoCoMo 92.5 / LongMemEval 94.4 与独立 49.0 冲突，见 02 文档）。

> 说明：Decay 的 **0.3–1.5** 是文档给出的分档，不是公开公式；文档只说"根据 last retrieved 与 how often 计算 scaling factor"。

---

### 3.3 Zep / Graphiti

- 论文：https://arxiv.org/abs/2501.13956 （2025-01-20）
- Graphiti 仓库：https://github.com/getzep/graphiti （**32,615 stars**，Apache-2.0，2026-11-07）
- Zep CE 停止维护公告：https://www.getzep.com/blog/announcing-a-new-direction-for-zeps-open-source-strategy （2025-04-02，更新 2026-06-03）

**① 分层结构**：**三层子图**。Episode 子图（原始消息/文本/JSON，非有损存储）至 Semantic entity 子图（实体 + 关系边）至 Community 子图（强连通实体的社区摘要）。图谱是 **bi-temporal**：事件时间线 T（t_valid / t_invalid）与事务时间线 T′（t_created′ / t_expired′）。
**② 写入时机**：episode 入库后即时抽取实体/事实；实体解析 = 向量（1024 维余弦）+ 全文检索 + LLM 判定；新事实与旧事实矛盾时做 **edge invalidation**；社区用 **label propagation** 增量更新（不是 GraphRAG 的 Leiden）。
**③ 检索打分**：三种召回，**余弦语义**、**Okapi BM25 全文**、**BFS 图遍历**；再重排，**RRF / MMR / episode-mentions（提及频次）/ node-distance / cross-encoder**。返回事实时带 `t_valid, t_invalid`，用于时间过滤/排序。**没有时间衰减乘子**。
**④ 遗忘/衰减**：**无时间衰减公式**；用**逻辑失效**代替：矛盾时把旧边的 `t_invalid` 设为新边的 `t_valid`，历史仍保留可查。原话：

```text
"...it invalidates the affected edges by setting their t_invalid to the t_valid of the invalidating edge.
Following the transactional timeline T′, Graphiti consistently prioritizes new information when determining edge invalidation."
```

**⑤ 标签/分类**：实体类型、关系类型、`group_id` 作用域、社区名（关键词/主题）、时间有效性字段；没有通用 TTL/重要度标签。
**⑥ 许可/自托管**：Graphiti **Apache-2.0**，可自托管（需图数据库/Neo4j 等）；Zep Community Edition **已停止维护**（2025-04 公告），云版商业。**不要基于 Zep CE 做长期选型**。
**⑦ 证据等级**：论文/仓库 **A**；CE 停维护 **A（官方公告）**。

---

### 3.4 A-MEM（Zettelkasten 式 Agent 记忆）

- 论文：https://arxiv.org/abs/2502.12110 （2025-02-17；NeurIPS 2025）
- 仓库：https://github.com/WujiangXu/A-mem （**1,014 stars**，MIT，2026-10-28 push）

**① 分层结构**：**没有层级**；是一张动态增长的"卡片网络"（Zettelkasten）。每条记忆是一个结构化 note，note 之间自动建链。
**② 写入时机**：每次新增记忆时：**Note Construction**（LLM 生成 keywords、tags、contextual description，并编码 embedding）至 **Link Generation**（与历史 memory 找语义相关项建链）至 **Memory Evolution**（新记忆反过来更新旧记忆的 context/attributes）。
**③ 检索打分**：**余弦相似度 top-k**，原文公式：

```text
s_{q,i} = (e_q ， e_i) / (|e_q| |e_i|)
M_retrieved = { m_i | rank(s_{q,i}) ≤ k }
```

**④ 遗忘/衰减**：**无**。没有删除、TTL 或权重衰减；靠"evolution"更新表示，不淘汰。
**⑤ 标签/分类**：每条 note 显式带 **keywords K_i、tags G_i、contextual description X_i、links L_i**；note 定义为 `m_i = {c_i, t_i, K_i, G_i, X_i, e_i, L_i}`。这是"标签驱动组织"的最直接参考之一。
**⑥ 许可/自托管**：MIT，可自托管（研究代码；作者另有 A-mem-sys 官方实现）。
**⑦ 证据等级**：论文/仓库 **A**。

---

### 3.5 MemoryBank（艾宾浩斯遗忘曲线）

- 论文：https://arxiv.org/abs/2305.10250 （2023-05-17）
- 仓库：https://github.com/zhongwanjun/MemoryBank-SiliconFriend （**458 stars**，MIT，2023 后基本停更）

**① 分层结构**：三层存储，**逐日对话记录**（含时间戳）、**分层事件摘要**（hierarchical event summary）、**用户画像**（personality/portrait）；不是 L0–L3 的访问分层。
**② 写入时机**：每轮交互后写入记录；摘要器周期性总结；**被召回时**更新记忆强度 S。
**③ 检索打分**：双塔稠密检索（DPR 式），FAISS 索引，按上下文与 memory 的向量相似度取 top；**检索分数不含时间/权重**（时间只进更新机制）。
**④ 遗忘/衰减**：**有显式公式**，本次调研最接近"衰减 + 强化"的原文：

```text
R = e^(-t/S)
R: 记忆保持率（retention）
t: 距学习/上次强化的时间
S: 记忆强度，首次出现时初始化为 1
被召回时：S ← S + 1，t ← 0（遗忘概率降低）
```

原文："we model S as a discrete value and initialize it with 1 upon its first mention in a conversation. When a memory item is recalled during conversations, it will persist longer in memory. We increase S by 1 and reset t to 0, hence forget it with a lower probability."
**⑤ 标签/分类**：每条记忆带强度 S（隐式权重）；用户画像；没有 type/scope/tag 体系。
**⑥ 许可/自托管**：MIT（研究代码，依赖较多、工程化程度低）。
**⑦ 证据等级**：论文/仓库 **A**。

---

### 3.6 Generative Agents（记忆流 + recency/importance/relevance）

- 论文：https://arxiv.org/abs/2304.03442 （2023-04-07）
- 仓库：https://github.com/joonspk-research/generative_agents （**22,355 stars**，Apache-2.0）

**① 分层结构**：**memory stream**（自然语言观察，带时间戳）至 **reflection**（更高层推断，作为一类记忆回写）至 **plan**（计划）；检索时把 reflection/plan 与 observation 一起参与排序。
**② 写入时机**：每个观察即时入 stream 并打 importance；反思在"最近事件的 importance 之和 > **150**"时触发（原文明确 150，实际约每天 2–3 次）。
**③ 检索打分**：**三元加权 + min-max 归一化**，原文公式：

```text
score = α_recency，recency + α_importance，importance + α_relevance，relevance
所有 α 均为 1；三项先 min-max 到 [0,1]
recency = 0.995^(距上次被检索的沙盒小时数)
importance = LLM 打 1–10 分（创建时）
relevance = cosine(memory embedding, query embedding)
```

**④ 遗忘/衰减**：**有 recency 指数衰减，无删除**：`0.995` 是"沙盒小时"衰减因子；越久未访问，排序越靠后。没有半衰期表述，但 `0.995^t` 等价于半衰期约 **138.3 小时（≈5.76 天）**（本文计算，D）。
**⑤ 标签/分类**：只有 **importance 分数 1–10**；没有 type/scope 标签。
**⑥ 许可/自托管**：Apache-2.0，可自托管（研究/模拟环境，不是生产记忆服务）。
**⑦ 证据等级**：论文/仓库 **A**。

---

### 3.7 MemOS

- 论文：https://arxiv.org/abs/2507.03724 （2025-07-04）
- 仓库：https://github.com/MemTensor/MemOS （**12,307 stars**，Apache-2.0，2026-11-04 push）

**① 分层结构**：OS 式三层，**Memory Interface / Memory Operation / Memory Infrastructure**；记忆类型三分，**Plaintext / Activation / Parameter**；基本单元 **MemCube**（内容 + provenance/versioning/permission 等 metadata）。
**② 写入时机**：MemReader / Memory API / Memory Pipeline 接入；MemScheduler 做类型转换、加载、迁移；生命周期覆盖 **generation 至 activation 至 fusion 至 archiving 至 expiration**。
**③ 检索打分**：论文讲 **hybrid retrieval + dynamic dispatch + task-aligned memory routing**；没有公开的具体打分公式（至少论文 HTML 未给出数值权重）。
**④ 遗忘/衰减**：**没有公开的数值衰减公式**；有生命周期状态与 expiration/archiving（"user preference memories can be scoped ... automatically expire or archive after task"）。这是"策略/生命周期"路线，不是"权重曲线"路线。
**⑤ 标签/分类**：MemCube 的 **descriptive identifiers / governance attributes / behavioral usage indicators**；provenance tagging、versioning、permission。分类粒度比大多数开源方案细。
**⑥ 许可/自托管**：Apache-2.0，可自托管。
**⑦ 证据等级**：论文/仓库 **A**；具体实现细节部分 **D（未公开）**。

---

### 3.8 Cognee

- 仓库：https://github.com/topoteretes/cognee （**33,119 stars**，Apache-2.0，2026-11-06 push）
- 文档：architecture https://docs.cognee.ai/core-concepts/architecture ；remember/forget/recall https://docs.cognee.ai/core-concepts/main-operations/remember

**① 分层结构**：**三存储**，relational（文档/分块/provenance）、vector（语义）、graph（实体/关系）；**session memory**（短期会话缓存）与 **permanent memory**（图记忆）两层。
**② 写入时机**：`remember()` 触发完整 ingestion（归一化 至 chunk 至 实体/关系抽取 至 embedding 至 建图 至 Improve 增强）；带 `session_id` 时先写 session cache，默认再后台跑 Improve 把会话内容桥接进永久图。
**③ 检索打分**：**semantic（向量）/ structural（Cypher）/ hybrid（向量+图）**；有 graph completion / rerank，但没有公开的数值权重公式。
**④ 遗忘/衰减**：**无时间衰减**。`forget()` 是**硬删除**：删 graph/vector/relational 数据，并清掉基于它的 session 缓存；`memory_only=True` 只删图/向量、保留原文以便重新 cognify。
**⑤ 标签/分类**：**ontology / DataPoint 类型 / dataset / node set / provenance**；支持自定义数据模型与本体（ontology）。
**⑥ 许可/自托管**：Apache-2.0，可自托管，本地小模型可零 API key 跑。
**⑦ 证据等级**：仓库/文档 **A**。

---

### 3.9 LangMem

- 仓库：https://github.com/langchain-ai/langmem （**1,750 stars**，MIT，2026-11-03 push）
- 文档：https://langchain-ai.github.io/langmem/concepts/conceptual_guide/

**① 分层结构**：按**记忆类型**分，**semantic**（collections 集合 / profiles 严格 schema）、**episodic**（few-shot 经验）、**procedural**（system prompt 规则/collection）；实现上是 Memory Manager + Store Manager（LangGraph store）。
**② 写入时机**：两条路，**hot path**（对话中即时写，延迟可见、agent 自主决定）与 **background**（调用间/后做模式分析、摘要、整合）；每次操作统一为"输入对话 + 当前记忆状态 至 LLM 决定 expand/consolidate 至 返回新状态"。
**③ 检索打分**：**没有公开公式**，但文档明确给出设计原则："memory relevance is more than just semantic similarity. Recall should combine similarity with 'importance' of the memory, as well as the memory's 'strength', which is a function of how recently/frequently it was used."
**④ 遗忘/衰减**：**无显式公式**；有"strength"概念（最近/频率的函数）与 consolidation，但未公开实现参数。
**⑤ 标签/分类**：semantic/episodic/procedural 三分 + profile schema + namespace；这是最清晰的"按类型决定管理方式"的公开分类之一。
**⑥ 许可/自托管**：MIT，可自托管；但依赖 LangGraph，接入有框架耦合。
**⑦ 证据等级**：文档/仓库 **A**；实现细节 **D（未公开参数）**。

---

### 3.10 LlamaIndex Memory

- 文档：https://developers.llamaindex.ai/python/framework/module_guides/deploying/agents/memory/
- 仓库：https://github.com/run-llama/llama_index （**52,837 stars**，MIT）

**① 分层结构**：**短期**（FIFO 消息队列，受 token limit 约束）+ **长期**（Memory Block 列表，可为 static / fact extraction / vector）；检索时短期与长期合并。
**② 写入时机**：`memory.put()` 每轮写；当 chat history 超过 `token_limit × chat_history_token_ratio`（默认 30000 × 0.7）时，把最旧消息 **flush** 到长期块（默认 `token_flush_size=3000`）；长期块可异步抽取事实。
**③ 检索打分**：短期按 FIFO + token 预算；长期按 block 的 `priority` 排序、vector block 做 top-k；插入位置可选 system message 或最新 user message。**没有统一的相关性公式**。
**④ 遗忘/衰减**：**无时间衰减**；只有 token 预算驱动的 flush（旧消息离开短期窗口，进入长期或丢弃）。
**⑤ 标签/分类**：block 的 `name`、`priority`、`insert_method`；三种内置 block 类型。
**⑥ 许可/自托管**：MIT，可自托管。
**⑦ 证据等级**：官方文档 **A**。

---

### 3.11 RAPTOR（层级摘要树）

- 论文：https://arxiv.org/abs/2401.18059 （2024-01-31）
- 仓库：https://github.com/parthsarthi03/raptor （**1,779 stars**，MIT）

**① 分层结构**：**递归摘要树**：叶子是文本块，向上用 GMM 软聚类 + LLM 摘要生成父节点，直到根；每层是不同抽象粒度。
**② 写入时机**：**离线建树**（chunk 至 embed 至 UMAP 降维 至 GMM 软聚类 至 摘要 至 递归）；不是在线逐轮写。
**③ 检索打分**：两种，**tree traversal**（逐层剪枝）与 **collapsed tree**（跨所有层一起按相似度取 top-k）；没有时间/权重。
**④ 遗忘/衰减**：**无**。
**⑤ 标签/分类**：树层级 + 聚类成员关系；没有业务标签。
**⑥ 许可/自托管**：MIT，可自托管。
**⑦ 证据等级**：论文/仓库 **A**。

---

### 3.12 GraphRAG

- 论文：https://arxiv.org/abs/2404.16130 （2024-04-24）
- 仓库：https://github.com/microsoft/graphrag （**36,585 stars**，MIT）

**① 分层结构**：**实体知识图 + Leiden 社区层级 + 社区摘要**；面向"全局 sensemaking"的语料级索引。
**② 写入时机**：**离线索引**：实体/关系抽取 至 社区检测 至 LLM 生成社区摘要；不是对话记忆的在线写入。
**③ 检索打分**：**local search**（实体中心，图邻域）与 **global search**（社区摘要 map-reduce）；没有公开的数值权重/时间衰减。
**④ 遗忘/衰减**：**无**。
**⑤ 标签/分类**：实体类型、关系类型、社区层级。
**⑥ 许可/自托管**：MIT，可自托管。
**⑦ 证据等级**：论文/仓库 **A**。

---

### 3.13 HippoRAG / HippoRAG 2

- 论文：https://arxiv.org/abs/2405.14831 （2024-05-23，NeurIPS 2024）；HippoRAG 2：https://arxiv.org/abs/2502.14802 （2025-02-20）
- 仓库：https://github.com/OSU-NLP-Group/HippoRAG （**4,104 stars**，MIT）

**① 分层结构**：**知识图谱 + passage 节点**（开放信息抽取三元组），没有多级摘要；灵感是海马索引理论。
**② 写入时机**：离线建图 + 同义词边；在线只做 query 实体链接。
**③ 检索打分**：**Personalized PageRank** 在图上传播，按 passage 得分排序；是图传播权重，不是时间衰减。
**④ 遗忘/衰减**：**无**。
**⑤ 标签/分类**：实体节点、关系边；没有业务标签。
**⑥ 许可/自托管**：MIT，可自托管。
**⑦ 证据等级**：论文/仓库 **A**。

---

### 3.14 Claude memory tool

- 官方文档：https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool （访问 2026-11-07）

**① 分层结构**：**`/memories` 目录 + 文件/子目录**；层级完全由模型/应用约定，没有固定 schema；配套 context editing 与 compaction。
**② 写入时机**：模型在任务开始前自动检查 memory 目录；工作中边做边写；官方给出"多会话软件开发"模式，初始化会话建 progress log / feature checklist，后续会话开场读、结束前更新。
**③ 检索打分**：**没有检索器打分**。模型通过 tool call 直接 `view` 目录/文件（可带行范围），按需读取；是"just-in-time retrieval"。
**④ 遗忘/衰减**：**无**；删除由模型发 `delete` 命令、应用执行；context editing/compaction 是上下文管理，不是记忆衰减。
**⑤ 标签/分类**：目录名/文件名由模型决定；没有 type/importance/TTL 元数据。官方建议按项目/主题组织目录。
**⑥ 许可/自托管**：专有 API；**memory 存储完全 client-side**，由调用方决定存储与保留（可自建在本地/数据库/加密文件）；模型本身不可自托管。
**⑦ 证据等级**：官方文档 **A**。

**安全要点（原文）**：必须校验所有路径以 `/memories` 开头、解析 canonical path、拒绝 `../`、`..\\` 与 URL 编码穿越；否则 `/memories/../../secrets.env` 可越权。

---

### 3.15 OpenAI memory（ChatGPT）

- 官方博客：https://openai.com/index/chatgpt-memory-dreaming （**2026-06-04**）
- Memory FAQ：https://help.openai.com/en/articles/8590148-memory-faq

**① 分层结构**：公开材料只给功能层：**saved memories**（2024-04 上线，对话中显式触发）+ **dreaming 合成记忆**（2025-04 起，后台从聊天历史自动整理）+ **memory summary**（可审阅的高层摘要）。底层存储/索引结构未公开。
**② 写入时机**：saved memories 在对话中按强线索写（"remember I'm traveling..."）；dreaming **后台**持续从多轮对话合成/更新记忆；2026 的 Dreaming V3 是当前架构，官方称服务 Free 用户的算力降了约 **5×**。
**③ 检索打分**：**未公开**。官方只给三个评估目标：carry forward context、follow preferences/constraints、stay current over time（例：旅行结束后把"将去新加坡"改成"去了新加坡"）。
**④ 遗忘/衰减**：**无公开公式**；机制是"后台自动更新/改写"来对抗 stale memory。用户控制：可删除、可"Don't mention this again"（不再引用但不删原文）、可关闭 Memory（关闭不删历史聊天）。
**⑤ 标签/分类**：未公开；memory summary 按主题/领域呈现，用户可纠正/忽略。
**⑥ 许可/自托管**：专有、不可自托管；本次调研**未找到**把 dreaming 记忆作为公开 API 提供的文档（ChatGPT 产品面与 API 面需分开看，未核实）。
**⑦ 证据等级**：官方博客 **A（功能与方向）**；内部机制/打分 **D（未公开）**。

---

## 4. 横向对比（摘要）

| 方案 | 分层 | 显式衰减/遗忘公式 | 标签/分类 | 许可证 | Stars（2026-11-07） | 证据 |
|---|---|---|---|---|---|---|
| 货拉拉 | L0–L3 四层 | 无公式；画像覆盖式 UPDATE | 6 维画像 + 策略库 | 无公开代码 | — | A/C |
| TencentDB Agent Memory | L0–L3 + 短期符号化 | 无公式；无公开权重 | L1 四类 + L2 场景 + L3 画像 | MIT | 30,591 | A/C |
| WeKnora | 知识库（非记忆） | 无 | 文档/知识库 | MIT | 36,708 | A |
| Hy-Memory（腾讯混元） | Chat L0–L7 + working/coding 双层 | 无公开公式；L7 带有效期 | scene/layer/type/version | Apache-2.0 | 1,993 | A |
| MemGPT/Letta | 主上下文 + recall/archival + blocks | 无（上下文压力驱逐） | block label + archival tag | Apache-2.0 | 25,373 | A |
| Mem0 | 扁平事实 + Dream pattern | **Decay 0.3–1.5×**；Expiration 到期隐藏 | metadata/category/entity/scope | Apache-2.0 | 68,543 | A/C |
| Zep/Graphiti | episode/entity/community 三层图 | 无时间衰减；**边失效** | 实体/关系/group/时间 | Apache-2.0（CE 停维护） | 32,615 | A |
| A-MEM | 卡片网络（无层级） | 无 | keywords/tags/context/links | MIT | 1,014 | A |
| MemoryBank | 记录/摘要/画像 | **R=e^(-t/S)，S+1** | 强度 S + 画像 | MIT | 458 | A |
| Generative Agents | stream/reflection/plan | **0.995^小时**（无删除） | importance 1–10 | Apache-2.0 | 22,355 | A |
| MemOS | 三类记忆 + MemCube + 三层架构 | 无公式；生命周期 expire/archive | identifiers/governance/usage | Apache-2.0 | 12,307 | A |
| Cognee | relational/vector/graph + session/permanent | 无；forget 硬删 | ontology/DataPoint/dataset | Apache-2.0 | 33,119 | A |
| LangMem | semantic/episodic/procedural | 无公式；有 strength 概念 | 类型 + profile schema + namespace | MIT | 1,750 | A |
| LlamaIndex | 短期 FIFO + 长期 blocks | 无；token flush | block name/priority | MIT | 52,837 | A |
| RAPTOR | 递归摘要树 | 无 | 层级/聚类 | MIT | 1,779 | A |
| GraphRAG | 实体图 + 社区层级 | 无 | 实体/关系/社区 | MIT | 36,585 | A |
| HippoRAG | 知识图 + passage | 无（PPR 传播） | 实体/关系 | MIT | 4,104 | A |
| Claude memory | /memories 目录 | 无 | 目录/文件名 | 专有（client-side 存储） | — | A |
| OpenAI memory | saved + dreaming + summary | 无公式；后台更新 | 未公开 | 专有 | — | A/D |

> 读法：**有显式衰减公式的只有 MemoryBank 与 Generative Agents**；Mem0 有"分档乘子"但没有公式；其余是逻辑失效、生命周期、token 驱逐或硬删除。**有明确"类型至管理策略"分类的**：LangMem、Letta（label）、LlamaIndex（block type/priority）、Tencent L1 四类；但没有一家把"标签至TTL/衰减/共享/删除"闭环做全。

---

## 5. 公式与原文摘录（可核对）

### 5.1 Generative Agents

```text
recency  = 0.995 ^ (hours since the memory was last retrieved)
importance = LLM integer 1..10, generated at creation time
relevance = cosine(memory embedding, query embedding)

score = α_recency，recency + α_importance，importance + α_relevance，relevance
（三项先 min-max 到 [0,1]；论文中所有 α = 1）

reflection trigger: sum(importance of latest events) > 150
```

出处：arXiv 2304.03442 §4.1 / §4.2（https://ar5iv.labs.arxiv.org/html/2304.03442）。

### 5.2 MemoryBank

```text
R = e^(-t/S)
R = retention
t = time elapsed since learning
S = memory strength, initialized to 1 at first mention
on recall: S ← S + 1; t ← 0
```

出处：arXiv 2305.10250 §2.3（https://ar5iv.labs.arxiv.org/html/2305.10250）。

### 5.3 Mem0 Memory Decay（分档，不是公式）

```text
scaling factor ∈ [0.3, 1.5]，检索时乘到 ranking score
just accessed        ≈ 1.5×
touched today        1.2–1.4×
idle a few days      0.6–1.0×
idle weeks           0.4–0.6×
idle months/years    ≈ 0.3×（floor，永不归零）
候选池 = max(top_k × 3, 50)
```

出处：https://docs.mem0.ai/platform/features/memory-decay （docs 最后更新 2026-08-14；访问 2026-11-07）。

### 5.4 Zep/Graphiti 的"逻辑失效"

```text
四个时间戳：
T′: t′_created, t′_expired   （事务时间线，审计）
T : t_valid,   t_invalid     （事件时间线，语义）
矛盾时：t_invalid(旧边) = t_valid(新边)
```

出处：arXiv 2501.13956 §2.2.3。

### 5.5 A-MEM 的 note 与检索

```text
m_i = { c_i, t_i, K_i, G_i, X_i, e_i, L_i }
c=原文, t=时间戳, K=keywords, G=tags, X=context, e=embedding, L=links
s_{q,i} = (e_q ， e_i) / (|e_q| |e_i|)
M_retrieved = { m_i | rank(s_{q,i}) ≤ k }
```

出处：arXiv 2502.12110 §3 / §3.4。

### 5.6 货拉拉 GraphRAG 的实体权重（知识检索，不是记忆衰减）

```text
表分数   = manual_boost_1 × (w1 × score_downstream + w2 × score_popularity + w3 × score_star)
字段分数 = manual_boost_2 × (w4 × base_score + w5 × table_factor)
术语词汇分数 = 1
```

出处：https://juejin.cn/post/7618261670406438964 §3.4。

### 5.7 LangMem 对"相关性"的定义（无公式）

> "memory relevance is more than just semantic similarity. Recall should combine similarity with 'importance' of the memory, as well as the memory's 'strength', which is a function of how recently/frequently it was used."

出处：https://langchain-ai.github.io/langmem/concepts/conceptual_guide/

### 5.8 腾讯的召回融合（无公式）

- "混合检索：BM25 + 向量 + RRF，兼顾关键词和语义召回"（README 配置说明）。
- "增强型双路召回：Embedding + 双路检索"（产品页）。
- 默认 `recall.maxResults = 5`；没有公开 RRF 的 k 值或权重。

---

## 6. 可写进我们设计的机制清单（逐条映射）

> 本节把用户要求的方向拆成 4 组，每组给"可借鉴出处 + 我们的建议"。**建议部分标 D（推断），不是既有方案的事实**。

### 6.1 抽象层 + 原始证据（模型读抽象，底层留原文佐证）

| 机制 | 可直接借鉴的出处 | 关键做法 |
|---|---|---|
| L0 原始证据只追加、不改写 | 货拉拉 L0（"只存不判，100% 还原现场"）；腾讯 L0 Conversation；Zep episode 子图（non-lossy） | 原始消息/工具结果/文档快照 append-only，带 ID、时间戳、来源、hash |
| 每层抽象都带 `evidence_refs[]` | 腾讯 `node_id` 下钻；Mem0 Dream 的 pattern memory 链接来源记忆；A-MEM 的 `L_i` links；Cognee provenance；Zep episode至entity 双向索引 | L1/L2/L3 节点必须存来源 ID；检索返回抽象时同时返回可点开的证据引用 |
| 模型默认只读高层，按需下钻 | 腾讯"平时靠 Persona 把握偏好，需要考证时再检索 Atom"；Claude just-in-time retrieval；Letta blocks 常驻 + archival 按需 | 注入 prompt 的只有 L2/L3 + top-k L1；L0 只在工具调用/引用展开时读 |
| 抽象由 LLM 生成、但可白盒修改 | 腾讯高层存 Markdown；Letta MemFS（git-backed）；Claude /memories 文件；Cognee 可读图 | 高层用 Markdown/JSON 落盘，人可直接编辑；变更走版本/审计 |
| 反思/摘要作为一等记忆 | Generative Agents reflection；MemoryBank 事件摘要；A-MEM evolution | 反思节点也要有 evidence_refs、时间、importance，不能是"无源摘要" |

**我们的建议（D）**：数据模型固定四层，`L0 event`（append-only）、`L1 atom`（事实/偏好/约束/决策/流程）、`L2 scene`（项目/任务/场景聚合）、`L3 profile`（用户/团队画像）。所有 L1+ 节点强制 `evidence_refs: string[]`；L0 只允许追加与墓碑删除。模型上下文只拼 L2/L3 + 检索到的 L1；L0 通过 `memory.inspect(evidence_id)` 下钻。

### 6.2 标签决定管理策略

| 标签维度 | 可借鉴出处 | 建议取值（D） | 决定什么 |
|---|---|---|---|
| 类型 type | LangMem（semantic/episodic/procedural）；腾讯 L1 四类；Letta block label | fact / preference / constraint / decision / procedure / task_state / reflection | 抽取 prompt、存放层、检索权重、是否进画像 |
| 来源 source | Mem0 metadata；A-MEM tags；Cognee provenance | user_explicit / user_confirmed / observed / inferred / imported | 可信度初值、是否需要用户确认、能否升级为 pin |
| 作用域 scope | Mem0 user_id/agent_id/run_id；Zep group_id；Cognee dataset；Letta shared block | user / project / team / global | 隔离、共享、权限、删除影响面 |
| 敏感度 sensitivity | Claude 路径穿越防护；腾讯权限/备份；GDPR（02 文档） | public / internal / secret | 是否加密、是否可跨项目、是否禁止进 prompt |
| 状态 status | Mem0 Supersede；Zep 边失效；Mem0 Expiration | active / superseded / expired / deleted(tombstone) | 是否召回、是否保留证据、是否参与审计 |
| 置顶 pin | **无现成方案**（最接近 Mem0 的 floor 0.3×，但不是 pin） | pinned=true/false | 半衰期=∞、weight=1、跳过自动淘汰、删除需二次确认 |
| 重要度 importance | Generative Agents 1–10；MemoryBank S；Mem0 Dream pattern | 1–10（写入时 LLM 打）+ 用户可改 | 初值、检索加权、反思触发 |

**建议（D）**：标签不是"展示用的分类"，而是**策略路由**。用一张 `tag_policy` 表把 `(type, source, scope, sensitivity)` 映射到 `(ttl, half_life, retrieval_boost, shareable, delete_mode)`。例如：`constraint + user_explicit + user scope + secret` 至 `ttl=∞, half_life=∞, boost=1.5, shareable=false, delete_mode=hard`；`task_state + observed + project scope + internal` 至 `ttl=30d, half_life=7d, boost=0.8, shareable=team, delete_mode=soft`。这样"标签决定保存周期/遗忘方式/共享范围"就是可执行的，而不是口号。

### 6.3 权重公式 + 半衰期 + 强化

| 机制 | 出处 | 原文/数值 | 我们怎么用（D） |
|---|---|---|---|
| 指数时间衰减 | Generative Agents | `recency = 0.995^hours`（半衰期约 138h ≈ 5.8d） | 作为"时效因子"的一种实现；按标签换半衰期 |
| 保持率 + 强度强化 | MemoryBank | `R = e^(-t/S)`；`S` 初始 1；召回 `S+1`、`t=0` | 作为"权重衰减 + 强化"的主公式 |
| 重要度加权 | Generative Agents | `score = αr，recency + αi，importance + αl，relevance` | 检索分 = 相关性 + 重要度 + 时效的加权和 |
| 重要性 + 强度 | LangMem | "similarity + importance + strength（最近/频率的函数）" | 重要度与强度分开建模：重要度是内容属性，强度是使用行为 |
| 排序乘子（软衰减） | Mem0 Decay | 0.3×–1.5×，floor 0.3，永不筛除 | 权重不要直接决定"删不删"，先做排序偏置；删除由 TTL/策略单独决定 |
| 来源/人工 boost | 货拉拉 GraphRAG | `manual_boost × (w1，x1 + …)` | 允许人工 pin/boost 覆盖自动权重，且可审计 |
| 强化（被召回） | MemoryBank、Mem0 Decay | `S+1`；每次召回小幅 boost | `w ← min(1, w + η，(1-w))`，η≈0.1，重置 `last_access` |
| 失效（被新事实推翻） | Zep | `t_invalid = t_valid` | 旧记忆不删，标 `superseded`，可查历史；检索默认排除 |

**建议公式（D，待用自有 workload 校准）**：

```text
基础权重：w0 = 1.0（用户明确要求记住 / pin）
          w0 ∈ [0.3, 1.0]（其他：按 source 与 importance 给初值）

时间衰减：w(t) = w0 ， 2^(-Δdays / H(tag))
          H(tag) = 该标签的半衰期（天）；pinned 至 H = ∞

强化：    每次被召回/被用户确认：
          w ← min(1, w + η ， (1 - w))，η = 0.1
          last_access ← now

下限：    w < 0.05 且非 pinned 至 进入 archived（软遗忘），不物理删除

检索：    score = RRF(semantic, keyword)
                × (0.5 + 0.5 ， w)
                × tag_boost
                × scope_match
```

半衰期分档建议（D，需 A/B 校准）：

| 标签 | 半衰期 H | 理由 |
|---|---|---|
| `constraint` / `identity` / pinned | ∞ | 用户说"一定记住"、硬约束，不自动衰减 |
| `preference` | 180 天 | 偏好会变，但比任务状态稳定 |
| `project` / `decision` | 90 天 | 项目周期内有效，结项后降权 |
| `task_state` | 30 天 | 任务结束即应淡出 |
| `transient`（临时上下文） | 7 天 | 类似短期记忆 |
| `reflection` / `pattern` | 跟随来源的最高权重 | 抽象层不应比证据层更"长寿"得离谱 |

**注意**：以上半衰期是**我们的建议**，不是任何论文的结论。Generative Agents 的 0.995/小时 ≈ 5.8 天半衰期只适用于它的模拟场景；MemoryBank 的 S 是离散强化，不是半衰期。必须用 Panoptic Super 自己的任务分布做校准。

### 6.4 删除与隐私

| 机制 | 出处 | 做法 | 我们能借鉴什么 |
|---|---|---|---|
| 到期隐藏 ≠ 删除 | Mem0 Expiration | `expiration_date` 到期后不返回，记录仍在，按 ID 可取回 | "软遗忘"用于降低召回，不满足法规删除 |
| 硬删除 + 派生数据 | Cognee `forget()` | 删 graph/vector/relational + 清 session cache；`memory_only` 只删图/向量 | 删除必须级联到 embedding/索引/缓存；原文可保留用于重建 |
| 用户可控删除/不提及 | OpenAI Memory FAQ | "Don't mention this again"（不删原文）vs "Delete and turn off memory"（删记忆、关开关、不删历史聊天） | 产品要区分三种语义：**不展示 / 不引用 / 真删除** |
| 存储与模型解耦 | Claude memory tool | client-side 存储，调用方控制保留；路径必须限制在 `/memories` | 记忆存储不要绑死在模型供应商；路径/租户隔离从第一天做 |
| 备份/回档/权限 | 腾讯云 Agent Memory 产品页 | 备份、回档、记忆资产与实例解耦、记忆库分配回收、团队权限 | 企业版需要"记忆资产"视角的治理，不只是单 Agent 的 CRUD |
| 法规删除面 | 02 文档（GDPR Art.17；EU AI Act） | 需覆盖 embedding/index/cache/log | 设计时列出"派生副本清单"，删除任务逐项确认 |

**建议（D）**：三条独立路径，`suppress`（本次不展示）、`forget`（软遗忘，权重归零/归档，可恢复）、`delete`（硬删除，级联 index/cache/embedding，保留 tombstone + 审计）。pin 记忆的`delete`要求二次确认；团队/全局记忆的删除要有权限与影响面提示。

### 6.5 写入时机（补充）

| 策略 | 出处 | 数值/做法 | 适用 |
|---|---|---|---|
| 每轮写 + LLM 决定操作 | Mem0 | 每对消息后 ADD/UPDATE/DELETE/NOOP | 高价值对话，成本可接受 |
| 每 N 轮批量抽取 | 腾讯 | 每 5 轮抽 L1，单次 ≤20 条；每 50 条生成画像 | 长会话、成本敏感 |
| token 超限刷入长期 | LlamaIndex | token_limit 30000，ratio 0.7，flush 3000 | 通用对话 |
| 上下文压力触发摘要/驱逐 | MemGPT | 70% 警告、100% flush（约 50%） | 长任务、工具结果多 |
| 后台 dreaming/整合 | OpenAI、Mem0 Dream、Letta | 后台 subagent/任务，定期 synthesize/supersede/merge | 跨会话记忆保鲜 |
| 离线建树/建图 | RAPTOR、GraphRAG、HippoRAG | 批处理，不在线 | 知识库/文档，不是对话记忆 |

**建议（D）**：默认"每 N 轮轻量抽取 + 任务结束/会话结束强制抽取 + 夜间后台整合"三段式；高价值事件（用户明确说"记住"、决策、约束）走 hot path 立即写，其余走 background。所有写入都带 `source` 与 `confidence`，低置信度先进"待确认"队列，不直接进画像。

### 6.6 检索层（补充）

| 机制 | 出处 | 做法 |
|---|---|---|
| 混合召回 + RRF | 腾讯（BM25+向量+RRF）；Mem0（semantic/keyword/entity/temporal）；Zep（cosine/BM25/BFS） | 不要只做向量；中文场景必须加 BM25/关键词 |
| 多路重排 | Zep（RRF/MMR/episode-mentions/node-distance/cross-encoder）；货拉拉（混合检索+重排） | 先高召回，再重排；重排可接 cross-encoder，但要控成本 |
| 时效/时间意图 | Mem0 temporal；Zep t_valid/t_invalid；OpenAI "stay current" | 查询解析时间意图（"现在/上次/去年"），对记忆做时间过滤 |
| 分层检索 | 腾讯（Persona至Atom）；RAPTOR（collapsed tree）；GraphRAG（community） | 先高层定位，再下层取证据；避免全量 L0 进上下文 |
| 图检索 | Zep/GraphRAG/HippoRAG；货拉拉 GraphRAG | 多跳/实体关联需求明确时再上，不要第一版就做 |

---

## 7. 可借鉴 / 不可借鉴 / 我们的建议

### 7.1 可直接借鉴（按优先级）

1. **L0–L3 + evidence_refs 的分层**（货拉拉、腾讯）：这是用户"抽象层 + 原始证据"的最直接实现，且两家中国厂商都验证过。
2. **Mem0 Dream 的"pattern memory 链接来源"**：抽象节点必须能点回证据；Synthesis 是 additive、idempotent，不覆盖原始记忆。
3. **MemoryBank 的 `R=e^{-t/S}` + 召回 `S+1`**：最接近"权重随时间衰减 + 强化"的显式公式，可直接作为权重模块的 baseline。
4. **Generative Agents 的三元打分 + 0.995 衰减**：作为"相关性/重要度/时效"加权和的参考实现；`150` 的反思触发阈值也可借鉴。
5. **Mem0 Decay 的"软排序偏置，永不筛除"**：权重首先影响排序，不要直接影响删除；删除走独立策略。
6. **LangMem 的 semantic/episodic/procedural 三分 + hot path/background 两路写入**：最清晰的"按类型决定管理方式"和"写入时机"框架。
7. **Claude 的 client-side memory + 路径穿越防护**：存储与模型解耦，删除/保留由调用方控制；路径校验是必须项。
8. **腾讯的"每 N 轮抽取 + 每 M 条生成画像"默认值**（5 / 50）：给了可落地的成本基线。

### 7.2 不建议直接照搬

1. **不要照搬 MemGPT/Letta 的完整 agent runtime**：它会侵入 agent loop 与架构选型；我们只需要它的"blocks + archival + 自编辑"思想。
2. **不要第一版做 GraphRAG/Zep 式图记忆**：构图/抽取/社区维护成本高，且没有明确多跳需求时收益不确定（与 02 文档"图谱记忆后置"一致）。
3. **不要把 Mem0 的榜单分数当选型依据**：自报 94.4 vs 独立 49.0；必须用自己的 workload 复跑。
4. **不要用 Zep Community Edition 做长期基座**：官方已停止维护（2025-04），只保留 Graphiti。
5. **不要把"到期隐藏"当"删除"**：Mem0 Expiration 不删数据；合规删除必须走 Cognee 式硬删除 + 派生副本清理。
6. **不要照搬 A-MEM 的"无淘汰"**：它不处理遗忘，长期会膨胀；标签/权重必须补上。
7. **不要照搬 OpenAI/Claude 的封闭实现细节**：只能借鉴产品语义（summary、don't mention、delete），拿不到公式。

### 7.3 我们的建议（面向 Panoptic Super，D）

**数据模型**：
- `L0 event`：append-only，字段 `id, ts, source, kind, payload, hash, tombstone`。
- `L1 atom`：`id, type, text, tags{source,scope,sensitivity}, importance, confidence, evidence_refs[], status, pinned, weight, last_access, ttl`。
- `L2 scene`：项目/任务/场景聚合，`evidence_refs[]` 指向 L1。
- `L3 profile`：用户/团队画像，带 `evidence_refs[]` 与版本。

**权重与遗忘**：
- 用 6.3 的 `w(t)=w0，2^{-Δdays/H(tag)}` + 召回强化；pin 的 `H=∞, w=1`。
- 软遗忘阈值 `w<0.05` 至 archived；硬删除只由 `delete` 或 TTL 策略触发。
- 半衰期按标签分档，先用 6.3 的建议值，跑 4 周后用真实数据校准。

**检索**：
- `score = RRF(semantic, keyword) × (0.5+0.5w) × tag_boost × scope_match`；
- 先 L2/L3 定位，再 L1 取证据；L0 默认不进上下文。
- 时间意图解析 + `t_valid/t_invalid` 式状态（active/superseded）过滤。

**删除与隐私**：
- `suppress / forget / delete` 三态；delete 级联 index/cache/embedding，保留 tombstone；
- 记忆资产与运行实例解耦（借鉴腾讯云），支持导出/迁移；
- 第一天就写"派生副本清单"与删除 SLA。

**指标**（建议）：
- 记忆命中率/精确率（自有任务集）、token 节省、过期错误率（stale rate）、删除完成时间、用户纠正率、pin 回忆成功率。
- 不要只看 LoCoMo/LongMemEval；用产品内真实任务做回归。

---

## 8. 冲突数字与空白项

### 8.1 冲突数字（并列，不取平均）

| # | 数字 A | 数字 B | 说明 |
|---|---|---|---|
| 1 | Mem0 自报 LongMemEval **94.4**、LoCoMo **92.5** | 独立评测同 benchmark **49.0** | 差 45.4 分；来源见 02 文档第 15–16 条；厂商与第三方无裁定 |
| 2 | Zep LoCoMo **84** | Mem0 复现 **58.44**；Zep 反驳 **75.14** | 三方争议，见 02 文档第 17 条 |
| 3 | 腾讯 PersonaMem **48% 至 76%**（博文/README） | 产品页 **47.85% 至 76.10%**；事实召回 **29.63% 至 79.07%** | 方向一致，口径/精度不同 |
| 4 | 货拉拉 Naive RAG 准确率 **55%**（3.3 节） | 同文 3.5 节"从 **56%** 提升至 78%" | 同一篇文章内部不一致 |
| 5 | TencentDB Agent Memory **30,591 stars**（GitHub API 2026-11-07） | 知乎文章称 **19.8k stars**（未标日期） | 时间快照差异，不是造假 |
| 6 | Mem0 Decay "**0.3× floor，永不筛除**" | "闲置数月/数年 ≈0.3×" | 文档自身一致；但"floor 0.3"与"永不归零"是同一件事的两种表述 |

### 8.2 没查到的空白（明确列出）

1. **货拉拉没有公开代码/仓库/许可证**，L1/L2/L3 的字段 schema、抽取 prompt、权重公式均未公开；只有架构图与实验表。
2. **TencentDB Agent Memory 没有公开权重/衰减公式**，也没有公开 L1/L2/L3 的抽取 prompt、RRF 的 k 值/权重、记忆淘汰策略。
3. **Mem0 Decay 没有公开公式**，只有分档乘子；OSS 版本是否支持 Decay 未在文档中明确（文档标 Platform）。
4. **OpenAI memory 的底层存储、检索打分、dreaming 的具体算法未公开**；本次也没找到把 dreaming 作为公开 API 的文档。
5. **Claude memory tool 没有公开的效果评测**；只有 API 文档与最佳实践。
6. **Letta/MemGPT 没有时间衰减**；其 "dreaming" 是 2026 文档的新能力，未找到独立评测。
7. **没有跨全部方案的独立、可复现横向评测**；LoCoMo 本身有标注缺陷（02 文档第 18 条），LongMemEval 也被不同 judge/配置污染。
8. **WeKnora 是否有独立长期记忆模块未核实**；目前官方定位是知识管理框架。
9. **T-Mem 与腾讯的关系未核实**；arXiv 作者列表未显示腾讯，不能归为"腾讯方案"。
10. **Hy-Memory 没有公开权重/衰减公式**；L7 有效期是唯一显式时效机制，具体时长与过期策略未在 README 中给出。

---

## 9. 来源清单

| ID | 来源 | URL | 日期 | 类型/等级 |
|---|---|---|---|---|
| S1 | 货拉拉技术《记忆即智能》 | https://juejin.cn/post/7703850980559667234 | 2026-11-04 | 公司技术号原文 / A（架构）、C（指标） |
| S2 | 货拉拉技术《从 RAG 到 GraphRAG》 | https://juejin.cn/post/7618261670406438964 | 2026-03-18 | 公司技术号原文 / A（架构）、C（指标） |
| S3 | TencentDB Agent Memory 仓库 | https://github.com/TencentCloud/TencentDB-Agent-Memory | 创建 2026-04-07；快照 2026-11-07 | GitHub / A |
| S4 | 腾讯云《TencentDB Agent Memory 正式开源》 | https://cloud.tencent.com/developer/article/2668579 | 2026-05-13 | 官方博文 / A（机制）、C（指标） |
| S5 | 腾讯云 Agent Memory 产品页 | https://cloud.tencent.com/product/agm | 访问 2026-11-07 | 官方产品页 / C（指标） |
| S6 | WeKnora 仓库 | https://github.com/Tencent/WeKnora | 创建 2025-07-22；快照 2026-11-07 | GitHub / A |
| S7 | WeKnora 官方文档 | https://weknora.weixin.qq.com/docs/01-getting-started/01-introduction | 访问 2026-11-07 | 官方文档 / A |
| S8 | T-Mem 论文 | https://arxiv.org/abs/2606.15405 | 2026-06-13 | 论文 / A（但非腾讯，见 2.3） |
| S9 | MemGPT 论文 | https://arxiv.org/abs/2310.08560 | 2023-10-12 | 论文 / A |
| S10 | Letta 仓库 | https://github.com/letta-ai/letta | 快照 2026-11-07 | GitHub / A |
| S11 | Letta memory blocks | https://docs.letta.com/guides/agents/memory-blocks | 访问 2026-11-07 | 官方文档 / A |
| S12 | Letta archival memory | https://docs.letta.com/guides/agents/archival-memory | 访问 2026-11-07 | 官方文档 / A |
| S13 | Letta MemFS / dreaming | https://docs.letta.com/configuration/memory | 访问 2026-11-07 | 官方文档 / A |
| S14 | Mem0 论文 | https://arxiv.org/abs/2504.19413 | 2025-04-28 | 论文 / A |
| S15 | Mem0 仓库 | https://github.com/mem0ai/mem0 | 快照 2026-11-07 | GitHub / A |
| S16 | Mem0 How it works | https://docs.mem0.ai/core-concepts/how-it-works | 访问 2026-11-07 | 官方文档 / A |
| S17 | Mem0 Memory Decay | https://docs.mem0.ai/platform/features/memory-decay | docs 更新 2026-08-14 | 官方文档 / A |
| S18 | Mem0 Dream | https://docs.mem0.ai/platform/features/dream | 访问 2026-11-07 | 官方文档 / A |
| S19 | Mem0 Memory Expiration | https://docs.mem0.ai/platform/features/memory-expiration | 访问 2026-11-07 | 官方文档 / A |
| S20 | Zep 论文 | https://arxiv.org/abs/2501.13956 | 2025-01-20 | 论文 / A |
| S21 | Graphiti 仓库 | https://github.com/getzep/graphiti | 快照 2026-11-07 | GitHub / A |
| S22 | Zep CE 停维护公告 | https://www.getzep.com/blog/announcing-a-new-direction-for-zeps-open-source-strategy | 2025-04-02（更新 2026-06-03） | 官方博客 / A |
| S23 | A-MEM 论文 | https://arxiv.org/abs/2502.12110 | 2025-02-17 | 论文 / A |
| S24 | A-MEM 仓库 | https://github.com/WujiangXu/A-mem | 快照 2026-11-07 | GitHub / A |
| S25 | MemoryBank 论文 | https://arxiv.org/abs/2305.10250 | 2023-05-17 | 论文 / A |
| S26 | MemoryBank 仓库 | https://github.com/zhongwanjun/MemoryBank-SiliconFriend | 快照 2026-11-07 | GitHub / A |
| S27 | Generative Agents 论文 | https://arxiv.org/abs/2304.03442 | 2023-04-07 | 论文 / A |
| S28 | Generative Agents 仓库 | https://github.com/joonspk-research/generative_agents | 快照 2026-11-07 | GitHub / A |
| S29 | MemOS 论文 | https://arxiv.org/abs/2507.03724 | 2025-07-04 | 论文 / A |
| S30 | MemOS 仓库 | https://github.com/MemTensor/MemOS | 快照 2026-11-07 | GitHub / A |
| S31 | Cognee 仓库 | https://github.com/topoteretes/cognee | 快照 2026-11-07 | GitHub / A |
| S32 | Cognee Architecture | https://docs.cognee.ai/core-concepts/architecture | 访问 2026-11-07 | 官方文档 / A |
| S33 | Cognee Remember/Forget | https://docs.cognee.ai/core-concepts/main-operations/remember | 访问 2026-11-07 | 官方文档 / A |
| S34 | LangMem 仓库 | https://github.com/langchain-ai/langmem | 快照 2026-11-07 | GitHub / A |
| S35 | LangMem Conceptual Guide | https://langchain-ai.github.io/langmem/concepts/conceptual_guide/ | 访问 2026-11-07 | 官方文档 / A |
| S36 | LlamaIndex Memory | https://developers.llamaindex.ai/python/framework/module_guides/deploying/agents/memory/ | 访问 2026-11-07 | 官方文档 / A |
| S37 | LlamaIndex 仓库 | https://github.com/run-llama/llama_index | 快照 2026-11-07 | GitHub / A |
| S38 | RAPTOR 论文 | https://arxiv.org/abs/2401.18059 | 2024-01-31 | 论文 / A |
| S39 | RAPTOR 仓库 | https://github.com/parthsarthi03/raptor | 快照 2026-11-07 | GitHub / A |
| S40 | GraphRAG 论文 | https://arxiv.org/abs/2404.16130 | 2024-04-24 | 论文 / A |
| S41 | GraphRAG 仓库 | https://github.com/microsoft/graphrag | 快照 2026-11-07 | GitHub / A |
| S42 | HippoRAG 论文 | https://arxiv.org/abs/2405.14831 | 2024-05-23 | 论文 / A |
| S43 | HippoRAG 仓库 | https://github.com/OSU-NLP-Group/HippoRAG | 快照 2026-11-07 | GitHub / A |
| S44 | HippoRAG 2 | https://arxiv.org/abs/2502.14802 | 2025-02-20 | 论文 / A |
| S45 | Claude memory tool | https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool | 访问 2026-11-07 | 官方文档 / A |
| S46 | OpenAI Dreaming | https://openai.com/index/chatgpt-memory-dreaming | 2026-06-04 | 官方博客 / A（功能）、D（机制） |
| S47 | OpenAI Memory FAQ | https://help.openai.com/en/articles/8590148-memory-faq | 访问 2026-11-07 | 官方帮助中心 / A |
| S48 | 本项目《能力底座调研》 | .ome/research/02-capabilities.md | 2026-11-05 | 内部研究 / B（二手汇编） |
| S49 | Hy-Memory 仓库 | https://github.com/Tencent-Hunyuan/Hy-Memory | 创建 2026-10-15；快照 2026-11-07 | GitHub / A |
| S50 | Hy-Memory 官网 | https://memory.hunyuan.tencent.com/en | 宣称 2026-10-16 发布 2.0 | 官方站点 / C |

---

### 附：GitHub 星数快照（2026-11-07）

| 仓库 | Stars | Forks | 许可证 |
|---|---:|---:|---|
| mem0ai/mem0 | 68,543 | 8,149 | Apache-2.0 |
| run-llama/llama_index | 52,837 | 8,530 | MIT |
| microsoft/graphrag | 36,585 | 3,872 | MIT |
| Tencent/WeKnora | 36,708 | 5,030 | MIT（含第三方例外） |
| topoteretes/cognee | 33,119 | 3,475 | Apache-2.0 |
| getzep/graphiti | 32,615 | 3,351 | Apache-2.0 |
| TencentCloud/TencentDB-Agent-Memory | 30,591 | 2,982 | MIT |
| letta-ai/letta | 25,373 | 2,668 | Apache-2.0 |
| joonspk-research/generative_agents | 22,355 | 3,133 | Apache-2.0 |
| MemTensor/MemOS | 12,307 | 1,112 | Apache-2.0 |
| OSU-NLP-Group/HippoRAG | 4,104 | 439 | MIT |
| parthsarthi03/raptor | 1,779 | — | MIT |
| langchain-ai/langmem | 1,750 | 206 | MIT |
| Tencent-Hunyuan/Hy-Memory | 1,993 | 143 | Apache-2.0 |
| WujiangXu/A-mem | 1,014 | — | MIT |
| zhongwanjun/MemoryBank-SiliconFriend | 458 | 60 | MIT |

> 采集方式：GitHub REST API `/repos/{owner}/{repo}`，2026-11-07。星数只反映热度，不代表质量或可维护性。
