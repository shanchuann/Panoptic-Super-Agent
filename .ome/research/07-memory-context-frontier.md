# 记忆与上下文前沿复核（2025–2026）

> 调研日期：**2026-11-07** ｜ 资料窗口：2024-10 至 2026-11（重点 2025-10 之后）｜ 作者：memory-frontier（task-5）
> 目的：复核 [memory.md](../design/memory.md) 与 [context.md](../design/context.md)，只写**新机制/新证据/新反例**；已覆盖的 MemGPT/Mem0/Zep/A-MEM/MemoryBank/Generative Agents 见 [04-memory-landscape.md](04-memory-landscape.md)，此处不重复。
> 证据等级：**A** 一手已打开（论文原文/官方文档/官方研究博客/GitHub API）；**B** 二手转述或社区 issue；**C** 厂商自述指标，未独立复现；**D** 本文推断。**冲突数字并列，不取平均**。
> 未核实的内容一律标"未找到公开资料"，不补数字。

## 0. 一页结论

1. **"长上下文"已被证伪为方案，"上下文管理"才是方案**：Chroma 2025-07-14 的报告在 18 个前沿模型上确认，输入变长时质量单调下降，且 NIAH（单针）无法预测真实退化（A）。
2. **压缩（compaction）正在从"兜底"变成"主路径"，但它有三个公认缺陷**：有损、需要重建工作集、触发阈值难定。2025-10 之后出现两条替代路线：**折叠（context folding）** 与 **递归子调用（RLM）**，二者都在更小活跃上下文下超过压缩基线（A）。
3. **工具定义本身是最大的上下文黑洞**：Anthropic 自述见过 **134K tokens** 的工具定义先于对话存在；Tool Search 把开工前占用从 ~77K 降到 ~8.7K（−85%），Opus 4 在 MCP 评测上 49%至74%（A/C）。我们 context.md 的 S1–S8 段配额里**没有工具定义段**，这是明确缺口。
4. **缓存不是"开了就省"**：2026-01 的《Don't Break the Cache》在 500+ 会话上测得成本降 41–80%、TTFT 降 13–31%，但**全上下文朴素缓存反而会抬高延迟**；正确做法是动态内容后置、排除动态工具结果（A）。官方 TTL 为 5 分钟与 1 小时两档（A）。
5. **记忆写入范式出现明确分歧**：Mem0 OSS v3（2026）放弃 LLM 驱动的 UPDATE/DELETE，改成**单次 ADD-only 抽取 + 检索侧多信号混合**（语义+BM25+实体），并自报 LoCoMo 71.4至91.6、LongMemEval 67.8至93.4（C）；但社区 issue #4956 记录了直接反例：可变态事实（现雇主/现居地）会**同时留下矛盾条目**（B）。**结论：写入时冲突判定不能砍，只能加兜底。**
6. **记忆评测从"回忆"转向"做事"**：LongMemEval（5 项能力，30% 掉点）、MemoryAgentBench（4 项能力，ICLR 2026）、MemoryArena（2026-02，多会话 agentic，ICML 2026）三连。MemoryArena 的核心发现最扎心：**在 LoCoMo 上接近饱和的 agent，在 agentic 多会话任务上表现很差**（A）。我们 §13 只写 LoCoMo/LongMemEval 已经过时。
7. **新架构的收益普遍无法复现**：ZenBrain（2026-04，7 层神经科学架构）自报在 LongMemEval_S 上 47.7%，Letta 48.4%，Mem0 47.2%，**三者无显著差异**；其 LoCoMo 上"扁平变体反而略高于完整系统"（A，作者自述）。这是本轮调研最重要的一条纪律证据：**层级越复杂 ≠ 越好，必须自带消融**。
8. **"睡眠/遗忘"有了可落地的形式**：SleepGate（2026-03）把"主动干扰（proactive interference）"，而非"权重低"，识别为陈旧记忆的主要伤害源，用冲突感知时间标签 + 门控驱逐 + 合并摘要解决；但它在 **4 层 793K 参数**的小模型 KV cache 上验证（A，规模存疑）。
9. **记忆正在从"服务"变成"资产"**：TencentDB Agent Memory v2.0（2026-08）把记忆拆成 **Chat Memory / Skills / Wiki / CodeGraph** 四类资产 + ACL + 控制面板；Hy-Memory 2.0（2026-10-16）拆成 Chat/Working/Coding 三场景 + 模型/框架/应用三层（A/C）。我们的 L3 概念层没有"技能/知识/代码图"这三类的一等地位。
10. **我们的差异化仍然成立**：截至 2026-11 仍未找到任何公开方案把"标签 至 TTL/衰减/共享/删除"做成完整规则引擎；也仍未找到货拉拉/腾讯/OpenAI/Gemini 公开的权重衰减公式。memory.md §3 的标签策略表是真实空白，值得做。

## 1. 上下文工程（2025–2026）

| 机制 | 一手来源 / 日期 | 关键事实（原文或原数） | 等 |
|---|---|---|---|
| context rot | [Chroma 技术报告](https://www.trychroma.com/research/context-rot) ， 2025-07-14 | 18 个模型；输入越长质量越降；NIAH 单针不能预测真实退化；报告同时用 LongMemEval 做对话 QA 版本 | A |
| 同一现象的复现 | 二手转述 [upsolve](https://upsolve.ai/blog/context-rot) | 报告发现**打乱语序的 haystack 有时优于连贯文本**（未直读原文，标 B） | B |
| 压缩：服务端 compaction | [Claude 文档 compact-threshold](https://platform.claude.com/docs/en/build-with-claude/compaction-threshold) | 服务端在阈值处自动压缩长对话；策略名 `compact_20260112`（策略名来自二手，标 B） | A/B |
| 压缩：阈值僵化 | [claude-code#34202](https://github.com/anthropics/claude-code/issues/34202) ， 2026-03-13 | 自动压缩阈值硬编码 150K，不随 1M 窗口缩放 至 阈值应是比例而非绝对值 | B |
| context editing | [Claude 文档 context-editing](https://platform.claude.com/docs/en/build-with-claude/context-editing) | `clear_tool_uses`（trigger/keep/clear_at_least/exclude_tools）与 `clear_thinking`：**只清工具结果与思考，不清对话** | A |
| Context Folding | [arXiv 2510.11967](https://arxiv.org/abs/2510.11967) ， 2025-10-13 ， ByteDance/CMU/Stanford | 分支进子轨迹至完成后折叠为"结论摘要"；FoldGRPO 训练；Deep Research/SWE 上与 ReAct 持平或更好，**活跃上下文小 10×**，显著优于摘要式压缩 | A |
| AgentFold | [arXiv 2510.24699](https://arxiv.org/abs/2510.24699) ， 2025-10 | 每步执行 folding 操作，支持细粒度凝缩与深度整合两档；30B-A3B 仅 SFT 即达 BrowseComp 36.2% / ZH 47.3% | A |
| RLM（递归语言模型） | [arXiv 2512.24601](https://arxiv.org/abs/2512.24601) ， 2025-12-31 ， Zhang/Kraska/Khattab | 长 prompt 作为**外部环境**，模型用代码检查/分解/递归自调用；可处理超窗口两个数量级；GPT-5 上相对 compaction 中位 +26%、相对 CodeAct 子调用 +130%、相对 Claude Code +13%，成本相当 | A |
| ACE（Agentic Context Engineering） | [arXiv 2510.04618](https://arxiv.org/abs/2510.04618) ， ICLR 2026 | 上下文=**演化 playbook**；generate/reflect/curate 三角色；用**结构化增量 delta 更新**对抗 brevity bias 与 context collapse；+10.6%（agent）/ +8.6%（finance）；无标注、用执行反馈即可 | A |
| prompt caching 官方口径 | [Claude 文档 prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) | 自动或显式 `cache_control` 断点，**5 分钟 / 1 小时**两档 TTL | A |
| prompt caching 实证 | [arXiv 2601.06007](https://arxiv.org/abs/2601.06007) ， 2026-01-09 | 3 家厂商 × 500+ agent 会话 × 10K 系统提示：成本 **−41%~−80%**、TTFT **−13%~−31%**；**朴素全上下文缓存会反常抬高延迟**；有效做法：动态内容放系统提示尾部、排除动态工具结果 | A |
| Tool Search | [Anthropic 研究博客](https://www.anthropic.com/research/advanced-tool-use) ， 2025-11-24 | 工具定义实测可占 **134K tokens**；`defer_loading` 按需加载后开工前 **~77K 至 ~8.7K（−85%）**；Opus 4 MCP 评测 **49%至74%**，Opus 4.5 **79.5%至88.1%**；不破坏 prompt cache（延迟工具不进初始前缀） | A/C |
| Programmatic Tool Calling | 同上 + [PTC 文档](https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling) | 在代码执行容器里调工具，中间结果不进模型上下文；复杂研究任务平均 **43,588 至 27,297 tokens（−37%）** | A |
| 长上下文评测（代际） | [LongMemEval](https://arxiv.org/abs/2410.10813)（ICLR 2025）至 [MemoryAgentBench](https://arxiv.org/abs/2507.05257)（ICLR 2026）至 [MemoryArena](https://arxiv.org/abs/2602.16313)（2026-02，ICML 2026） | 评测对象从"能不能回忆"演进到"能不能用记忆指导下一步动作" | A |

**要点（D）**：我们 context.md 把压缩放在 §4 降级链的第 2–5 步，等于"先塞满再压缩"。前沿的次序是**先折叠/递归，压缩兜底**。另外 §1 的段配额假设"上下文主要被对话和工具结果占满"，但真正在 agent 场景先爆炸的是**工具定义**。

## 2. 记忆新架构（2025–2026）

| 工作 | 来源 / 日期 | 机制要点 | 等 |
|---|---|---|---|
| Memory in the Age of AI Agents（47 作者综述） | [arXiv 2512.13564](https://arxiv.org/abs/2512.13564) ， 2025-12-15 | 断言 **long/short-term 二分已不够用**；改用三视角：形态（token / parametric / latent）、功能（factual / experiential / working）、动态（形成-演化-检索） | A |
| EverMemOS（记忆 OS） | [OpenReview](https://openreview.net/forum?id=h89dqk3VoN) ， 2026-01-04 | 自称"自组织记忆操作系统"，以**engram（记忆印迹）生命周期**组织长期推理；EverOS 于 2026-04 作为产品化长期记忆 OS 发布（C） | A/C |
| SleepGate（睡眠式整合） | [arXiv 2603.14517](https://arxiv.org/abs/2603.14517) ， 2026-03-15 | 问题被重新定义为**主动干扰**而非"权重衰减"；三机制：冲突感知时间标签、轻量遗忘门、合并摘要；熵触发微睡眠周期；PI 深度 5 达 99.5%，5 个基线 <18%，但模型仅 4 层 793K 参数 | A |
| ZenBrain（7 层神经科学架构） | [arXiv 2604.23878](https://arxiv.org/abs/2604.23878) ， 2026-04 | 工作/情景/语义/程序四分 + FSRS 式间隔重复 + 巩固；**自报 LongMemEval_S 47.7%（Letta 48.4%、Mem0 47.2%，无显著差异）**；其 LoCoMo 上扁平变体 F1 0.059 > 完整系统 0.058 | A |
| Mem0 OSS v3 | [迁移文档](https://docs.mem0.ai/migration/oss-v2-to-v3) ， 2026 | 抽取改 **单次 ADD-only**（一次 LLM 调用，不再 UPDATE/DELETE）；检索改**语义+BM25+实体三信号混合**；图记忆移出 OSS、成 Platform 专属；自报 LoCoMo 71.4至91.6、LongMemEval 67.8至93.4（C） | A/C |
| 上条的反例 | [mem0#4956](https://github.com/mem0ai/mem0/issues/4956) ， 2026 | ADD-only 下"我在 A 公司"/"我现在在 B 公司"会并存，检索可能排到旧值 至 **可变态事实必须写入时消解** | B |
| Letta（MemFS v2 / memory subagent） | [Letta changelog](https://docs.letta.com/reference/changelog) ， 2026 | 记忆改 **git 式 MemFS v2 目录**；新增 `memory` 子智能体做整理；`defragmenting-memory` 内置技能带备份/恢复；默认窗口 32k至128k、核心块上限 20k至100k 字符 | A |
| TencentDB Agent Memory v2.0 | [GitHub](https://github.com/TencentCloud/TencentDB-Agent-Memory)（2026-11-07 快照 30,604★，MIT）+ [v2 解读](https://explainx.ai/blog/tencentdb-agent-memory-v2-team-hub-august-2026)（2026-08） | 四类**记忆资产**：Chat Memory / Skills / Wiki / CodeGraph；Memory Hub 控制面板 + ACL + Agent loadout；冷启动导入仓库/文档/历史会话；L0–L3 不变 | A/B |
| Hy-Memory 2.0（腾讯混元） | [官方站](https://memory.hunyuan.tencent.com/en) ， 2026-10-16 | 三场景（Chat/Working/Coding）+ 三层开源（30B-A3B 模型 / 框架 / MemHub 应用）；Working 记忆存"目标、已定做法、阶段结果 + 经验适用条件"；Coding 记忆存"为什么改"；自报 LoCoMo 72.6、MemoryArena 55.31、存储占输入 6.06%（C） | A/C |
| 货拉拉四层 + 离线整理 | [掘金 2026-11-04](https://juejin.cn/post/7703850980559667234)（详见 04 §2.1） | L0 只存不判 至 L1 感知 至 L2 决策 至 L3 画像（每日 2:00 全量重算）；离线轻睡/深睡/REM。**2026-11 仍无公开权重/衰减公式** | A/C |
| 间隔重复调度（FSRS） | [zenbrain](https://github.com/zensation-ai/zenbrain) ， 2026 | FSRS 式调度：稳定性 S、难度 D、可提取性 R 三参数驱动复习间隔，替代固定阈值 | B |

## 3. 工业实践对照（只记"与我们设计相关"的增量）

| 厂商 | 2026 新变化 | 来源，日期 | 对我们意味着 | 等 |
|---|---|---|---|---|
| Anthropic / Claude | ①memory tool 仍为 **client-side 目录**（`/memories`），存储与保留由调用方决定；②context editing 只清工具结果/思考；③服务端 compaction 可配阈值；④Claude App 记忆 2026-07-10 改为**逐条分类条目**（不再是每日摘要），2026-08-25 起跨 chat/Cowork 可逐条编辑 | [memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool) ， [context editing](https://platform.claude.com/docs/en/build-with-claude/context-editing) ， [第三方汇总](https://www.claudedetails.com/claude-ai-cowork/claude-s-memory-now-uses-individual-categorized-entries-what-changed-and-how-to-)（B） | "条目化 + 可编辑 + 客户端存储"与我们 §7/§11 同向；但**它不是记忆服务**，检索与衰减要自建 | A/B |
| OpenAI | Dreaming V3（2026-06-04）：后台持续从历史合成/更新画像，官方称 Free 用户算力约降 5×；用户三种控制：删除 / "不要再提" / 关闭记忆 | [OpenAI 官方博客](https://openai.com/index/chatgpt-memory-dreaming)（04 §3.15 已录） | 我们的"睡眠整合"方向被最大厂商背书；但存储/打分仍未公开 | A/C |
| Google / Gemini | 2026-04-29 英国上线个人化套件，含**记忆导入**（把其他助手的偏好/关系/个人上下文导入 Gemini）；Memory 与 Saved info 两个入口 | [Google 官方博客](https://blog.google/company-news/inside-google/around-the-globe/google-europe/united-kingdom/gemini-launches-new-personalisation-features-in-the-uk) ， 2026-04-29 | "记忆可迁移/可导入"是新的产品面需求；我们 §11.6 导出 jsonl 已覆盖一半 | A/C |
| 腾讯 | TencentDB v2.0 四资产 + Hub/ACL；Hy-Memory 2.0 三场景 + 专用写入模型 | 见 §2 | "技能/知识/代码图"应成为记忆的一等资产 | A/B/C |
| 货拉拉 | 无 2026-11 之后的新公开材料 | — | 维持 04 的结论 | — |
| 开源横评 | Zep/Graphiti 未见 2026 重大机制变更（新增 MCP server）；Mem0 图记忆退出 OSS；Letta 转向 MemFS | [Graphiti 解读](https://www.sentra.app/articles/graphiti-explained)（B） | 图能力在 OSS 侧整体**收缩**，我们"先实体+关联表、图后置"的判断被强化 | B |

## 4. 基准与结论（把"数字"和"结论"分开）

| 基准 | 规模/维度 | 结论 | 等 |
|---|---|---|---|
| [LongMemEval](https://arxiv.org/abs/2410.10813) | 500 题 × 5 能力（抽取/多会话推理/时间推理/知识更新/弃答） | 商业助手与长上下文 LLM 在持续交互上掉 **30%**；论文给出 indexing至retrieval至reading 三阶段优化（会话分解、事实增强键、时间感知查询扩展） | A |
| [LoCoMo](https://arxiv.org/abs/2402.17753) | 平均 300 轮 / 9K token / 最多 35 会话 | 长上下文与 RAG 有提升但仍显著落后人类；**2026 起已被 MemoryArena 指为接近饱和** | A |
| [MemoryAgentBench](https://arxiv.org/abs/2507.05257) | 4 能力：准确检索、测试时学习、长程理解、**选择性遗忘** | 现有系统**没有一家四项全通**；最重要的缺口是"选择性遗忘" | A |
| [MemoryArena](https://arxiv.org/abs/2602.16313) | 多会话 Memory-Agent-Environment 循环，4 类任务 | **LoCoMo 上接近饱和的 agent 在 agentic 任务上表现很差**，记忆必须"用于下一步动作"才算数 | A |
| PersonaMem v2 | Hy-Memory 自报同表 | Hy-Memory-30B-A3B 52.09 vs Opus5 51.58（C，无独立复现） | C |

**冲突并列（不取平均）**：Mem0 自报 LoCoMo 91.6 / LongMemEval 93.4（C）；而 ZenBrain 用统一 harness 测得 **Mem0 在 LongMemEval_S 上 47.2%**（A，小样本臂）。二者设置不同（全量 vs S 子集、judge 不同、版本不同），**不能相互否定，也绝不可混用**。同理 Hy-Memory 的 "4 benchmark #1"（C）与 ZenBrain 的"无显著差异"（A）并存。

## 5. 新增建议（具体到章节）

| # | 建议 | 落点 | 依据 |
|---|---|---|---|
| N1 | 新增"**工具目录段 S0**"与配额：工具定义常驻预算（如 ≤5%），超出即启用渐进披露（defer/search），并给"工具定义 token 数"打点 | context.md §1 段表（S1 之前新增 S0）+ §9 指标 | Anthropic 134K / −85%（A） |
| N2 | 压缩链改为"**折叠优先**"：新增 C1.5 "折叠"，分支进子任务至完成后折叠为{结论 + 判据 + 句柄}，只有折叠失败才升级到 C2/C3 摘要压缩；折叠节点必须记 parent/child 与证据指针 | context.md §2 表（新增 C1.5）+ §4 降级链重排 | Context-Folding 10×（A）、AgentFold（A）、RLM（A） |
| N3 | 新增"**prompt 布局契约**"：稳定前缀（身份/规则/项目章程/工具目录）严格不变；所有动态内容（检索结果、工具结果、时间戳）放在末尾；缓存断点只打在前缀边界；记录 `cache_read_tokens` 与"缓存断裂"事件 | context.md §1.1 组装流水线 + §9 指标 | 2601.06007（A）+ 官方 TTL（A） |
| N4 | 记忆写入改为**双保险**：保留现有 ADD/UPDATE/SUPERSEDE/NOOP 写入时消解，**另加检索侧时效重排**（有效时间过滤 + 新旧版本压制），并强制"可变态事实"（雇主/住址/关系/价格）必须走 supersede 而非 ADD | memory.md §5.3 管线 + §6.2 排序 | Mem0 v3 + issue #4956（A/B） |
| N5 | 睡眠整合增加"**干扰治理**"：①冲突感知时间标签（新事实入上下文时自动压制同主题旧事实）②注入前去冲突（同一 (主语,谓语) 只出一条，其余折叠为"历史值"）③用"冲突率/陈旧命中率"作为触发信号，而非只按时间 | memory.md §7.3 睡眠整合（新增 7.3.1）+ §6.3 注入 | SleepGate（A，规模存疑） |
| N6 | 复习调度从固定阈值改为**三参数模型**：稳定性 S / 难度 D / 可提取性 R，按 `next_review = f(S,D,R)` 排期；现有 `T_next_review = t_access + S，ln(1/θ_review)` 保留为 R 的近似，但 D 与 R 要显式入模 | memory.md §4.4（θ_review 段） | FSRS / zenbrain（B）+ MemoryBank（04） |
| N7 | L3 概念层拆出**资产子类**：`skill`（可复用步骤 + 触发边界 + 验证方式 + 版本）、`wiki`（结构化知识 + 双链）、`code_graph`（符号/调用/影响面）；三者与 fact/preference 同域但不同标签策略与 ACL | memory.md §3 标签表（type 增 3 值）+ §2 分层表（L3 子类） | TencentDB v2 四资产（A/B）、Hy-Memory Coding 记忆（C） |
| N8 | 评测集换代：**主用 MemoryArena + MemoryAgentBench（含 selective forgetting）**，LongMemEval 只作能力分项参照，LoCoMo 降为回归防倒退；新增"记忆是否指导了下一步动作"的成功率指标 | memory.md §13 评测表 + §14 M4 判据 | MemoryArena / MemoryAgentBench（A） |
| N9 | 记忆更新采用**增量 delta 而非整体重写**：L3 概念每次只 append 一条结构化增删（+策略 / −反例 / ~条件）并保留版本链，禁止"用 LLM 重写整个概念卡" | memory.md §5.3 晋升路径 + §8 数据模型（`memory_revision`） | ACE 的 brevity bias / context collapse（A） |
| N10 | 新增"**记忆可迁移**"验收项：导出包必须含 L2/L3 + 证据指针 + 标签策略快照，可在空库重建索引并保持 Recall 掉点 ≤5pp | memory.md §11.6 导出 + §13 指标 | Gemini 记忆导入（A/C）、MemFS git 化（A） |

## 6. 已有但需修正

| # | 现有表述 | 问题 | 修正建议 |
|---|---|---|---|
| M1 | memory.md §4 权重 `w = I，exp(−Δt/S)` 只有"时间衰减 + 强化" | **缺"干扰/冲突"维度**：同一上下文里新旧值并存造成的伤害，远大于权重低 | 增加 `conflict_in_context` 惩罚项（同主题旧版本注入时被压制/折叠），并把"冲突率"列为一级指标 |
| M2 | memory.md §4.4 阈值表（θ_inject 0.15 / θ_warm 0.35 / θ_archive 0.06 / θ_purge 0.02） | 全部无公开依据；且 `T_retain = S，ln(I/θ_archive)` 在 `I < θ_archive` 时为负 | 明标 **D（待校准）**；公式加 `max(0, ，)`；参数改动必须附评测报告（§4.5 前移） |
| M3 | memory.md §7.3 睡眠整合按"会话后/每日/每周"固定节奏 | 前沿用**信号触发**（熵/冲突率/上下文压力）；固定节奏在低频项目白跑、高频项目滞后 | 改"时间触发 + 信号触发"双通道，信号优先 |
| M4 | memory.md §2 读取规则"L0/L1 永不直接注入" | 与 RLM 结论一致，但缺"**程序化访问**"形态：模型应能用代码在外部环境检索 L0，而非只能取摘要 | 增加 `memory.grep(pattern, scope)` / `memory.slice(id, range)` 类工具，PTC 内可直接调用 |
| M5 | memory.md §13 "LongMemEval/LoCoMo 英文子集作参考" | LoCoMo 已接近饱和；两基准都不测"记忆指导动作" | 见 N8 |
| M6 | context.md §2 C1 阈值"结果超 4K token 即压缩" | 拍脑袋常量，无依据 | 标 D；改为按模型窗口比例（如 2%）+ 按工具类型分档 |
| M7 | context.md §9 "缓存命中率 ≥60%" | 单一比率可被"少缓存、少读"刷高；未覆盖缓存断裂成本 | 改双指标：`cache_read/(cache_read+cache_write)` 与 `TTFT p50`，并记录缓存断裂次数 |
| M8 | context.md §4 降级链把压缩放在第 2–5 步 | 顺序反了：前沿是"先折叠/递归，压缩兜底" | 重排为：①减记忆卡 ②**折叠** ③清工具结果（context editing 式）④缩短近况 ⑤压缩 ⑥停止 |
| M9 | memory.md §1 "没有一家把标签至策略做成规则引擎" | 结论在 2026-11 仍成立，但需**限定语** | 加"截至 2026-11 的公开资料范围内"，避免被后续证据推翻时失去可信度 |

## 7. 不采纳及理由

| # | 方案 | 不采纳理由 | 替代 |
|---|---|---|---|
| X1 | **KV-cache 级睡眠门控**（SleepGate 本体） | 需改模型内部/训练流程；实验仅 4 层 793K 参数，无法外推到 frontier 模型；我们是应用层 harness | 只借其三机制的应用层抽象（N5） |
| X2 | **放弃写入时冲突判定**（Mem0 v3 ADD-only） | 可变态事实上有可证伪反例（#4956）；我们的 `decision/constraint` 类记忆对矛盾零容忍 | 写入消解 + 检索重排双保险（N4） |
| X3 | **图记忆交给商业平台**（Mem0 把图移出 OSS） | 与"全部本机、可自托管、BYOK"的产品定义直接冲突 | 实体 + 关联表 + 可重建索引（memory.md §8 已有） |
| X4 | **parametric / latent 记忆**（综述三形态之一） | 需微调或改权重；memory.md §0 已列为非目标 | 不做；仅在 §0 非目标里补"已评估并排除" |
| X5 | **7 层神经科学架构**（ZenBrain） | 其自身实验显示与 Letta/Mem0 无显著差异，复杂度不划算 | 维持 5 层；用标签策略做区分度 |
| X6 | **RLM 全量递归推理作为默认执行模式** | 默认路径要可预测、可计步、可审批；递归子调用会把"步数/停止条件"打散 | 只在"超长材料分析"任务上按需启用（挂 PTC），默认仍走单循环 |
| X7 | **ACE 式在线自动演化 playbook** | 无监督自改系统提示与 §11"防污染 + 不可信内容不驱动高危动作"冲突 | 只借"增量 delta + 版本链"（N9）；playbook 变更需人工确认 |
| X8 | **把 context rot 当作"必须用超长窗口"的理由** | 方向相反：长窗口不解决腐化，只放大它 | 配额 + 折叠 + 检索 |

## 8. 空白项（未找到公开资料，明确不编造）

1. **货拉拉 / 腾讯 / OpenAI / Gemini 的权重或衰减公式**：截至 2026-11 仍无任何公开公式（四家均只有分层/生命周期/覆盖式更新）。
2. **Claude Code 的 150K 压缩阈值**：只来自 GitHub issue（B），Anthropic 官方文档未给出该数值。
3. **Claude App"逐条分类记忆"的存储结构、检索方式、遗忘机制**：只有二手产品解读（B），无官方技术文档。
4. **Gemini Memory 的抽取与检索实现**：官方博客只描述用户可见行为（导入/编辑/关闭），无机制说明。
5. **"记忆注入应占上下文多少比例"的实证**：memory.md §6.3 的 15% 无任何公开实验支撑，属 D。
6. **MemoryAgentBench 上主流系统的完整公开分数表**：论文有汇总，但未找到可复现的全量榜单，仅见零星转述（B）。
7. **"标签 至 TTL/衰减/共享/删除"完整规则引擎**：仍无公开先例（本轮复核未推翻 04 的结论）。

## 9. 方法

- 检索：`web_search` 取线索 至 `web_fetch` 打开一手页（arXiv abs/html、官方文档、官方研究博客、GitHub API/issue、官方产品站）；论文结论只从 arXiv 摘要或原文摘录，不从第三方博客转抄数字。
- 判定规则：官方文档与论文原文 = A；社区 issue / 第三方汇编 = B；厂商自报评测数字 = C（无论多权威）；本文综合 = D。
- 冲突处理：同一指标出现多个数字时**并列 + 标注设置差异**，不取平均、不择优。
- 页面可读性限制：Chroma 报告页与 Claude 文档页为前端渲染，部分正文无法直读，相应结论已降级标注（见 §1 表内 B 标注）。

## 10. 与既有文档的关系

- 不重复：[04-memory-landscape.md](04-memory-landscape.md)（MemGPT/Mem0/Zep/A-MEM/MemoryBank/Generative Agents/MemOS/Cognee/LangMem/LlamaIndex/RAPTOR/GraphRAG/HippoRAG 的七问横评与公式摘录）；
- 本文补充的是 04 未覆盖的 **2025-10 之后的上下文工程路线**（folding / RLM / ACE / tool search / PTC / 缓存实证）、**2026 新记忆架构**（SleepGate / ZenBrain / EverMemOS / Mem0 v3 / Letta MemFS / 腾讯 v2 / Hy-Memory 2.0）与**新评测层**（MemoryAgentBench / MemoryArena）；
- 建议的落点已在 §5/§6 逐条指到 memory.md / context.md 的章节号；本文件**不修改** DESIGN.md、design/* 与源码。
