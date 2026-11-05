# 能力底座调研（记忆 / 工具与 MCP / 沙箱 / 浏览器 / 规划）
调研日期：2026-11-05 ｜ 资料范围 2025-11 至 2026-11 ｜ 标注：②③为【事实】（附来源与日期）；①④⑤含【推断】

## ① 一页结论

1. **MCP 已是事实标准，但 2026-07-28 版改成了无状态核心**（去掉 initialize 握手与协议级 session，每请求自带版本/能力），第一版就按此设计，别照 2025 年旧教程写。
2. **MCP 的工具目录开销是真实成本**：50+ MCP 工具定义约 72K tokens，Anthropic 内部见过 134K tokens 的工具定义；官方解法是 Tool Search（按需发现）+ 代码执行（中间结果不进上下文），实测 PTC 使复杂研究任务 token 从 43,588 降到 27,297（−37%）。
3. **MCP 的安全水位低于采用速度**：registry 已 5.3 万+ servers、Tier-1 SDK 近 5 亿下载/月，但审计显示 30%–82% 的实现有可利用缺陷、仅 8.5% 用 OAuth；第三方 server 必须默认不可信。
4. **记忆的公开分数不可直接采信**：Mem0 2026-04 自报 LoCoMo 92.5 / LongMemEval 94.4，独立评测在同一 benchmark 名下给出 49.0，差 45.4 分；选型必须用自己的 workload 复跑，不能看榜单。
5. **记忆的真实收益在成本而非准确率**：Mem0 论文给出 p95 延迟 1.44s vs 全上下文 17.12s（−91%）、token −90%；换句话说记忆层的商业理由是"省 token 和延迟"，不是"更聪明"。
6. **沙箱是商品化组件，自建不划算**：E2B/Datona/Modal 都在按秒计价且量级明确（200 沙箱场景 E2B ≈ $16.8k/月），本地则可用 Anthropic 开源的 sandbox-runtime（Apache-2.0）做文件+网络双隔离；第一版没有任何理由自己写隔离层。
7. **规划与反思要分清"有效"和"噪音"**：无外部反馈的内在自我纠错被 ICLR 2024 证否（性能常下降）；"先出计划 + 一轮外部诊断式修订"才有稳定增益（GPT-4o 76.3→79.2→83.3），单纯 plan-first 并不总优于直接执行。

## ② 证据表

| # | Claim | 来源 URL | 日期 | 可信度 |
|---|---|---|---|---|
| 1 | MCP 2026-07-28 规范：无状态核心、MRTR 取代常开 SSE、列表结果可缓存、RFC 9207 issuer 校验、从 DCR 转向 CIMD、Roots/Sampling/Logging 正式弃用（12 个月弃用期） | https://blog.modelcontextprotocol.io/posts/2026-07-28 | 2026-07-28 | 高 |
| 2 | 2025-11-25 规范加入实验性 Tasks、URL 模式 elicitation、CIMD；表单式 elicitation 自 2025-06-18 起；规范禁止表单模式索取密码/密钥/支付凭证 | https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary | 2025-11-25 | 高 |
| 4 | 官方 MCP Registry 收录 53,545 个 servers（30 天 +42%），67% 为远程 HTTP 端点 | https://gravity.fast/data/mcp-adoption-statistics | 2026-10-31（数据截止） | 中高 |
| 5 | TS SDK npm 87.0M 下载/周（同比 +1059%）；Python mcp 70.8M/周；MCP 项目称 Tier-1 SDK 合计近 5 亿/月 | 同上 | 2026-07~10 | 中（公开下载数据） |
| 6 | MCP 于 2025-12 捐入 Linux Foundation 下 Agentic AI Foundation，现 286 家成员组织 | https://www.digitalapplied.com/blog/mcp-adoption-statistics-2026-model-context-protocol | 2026 | 中 |
| 7 | 企业侧：41% 技术负责人称已有限至广泛生产使用，但仅 11–14% 试点进入生产；28% Fortune 500 早期 2026 部署（厂商/分析师估算） | https://theagentics.co/insights/the-enterprise-mcp-guide-2026 | 2026 | 低中 |
| 8 | 安全：Trend Micro 记录 102 个 MCP 相关 CVE；审计显示 30%–82% 实现有路径穿越等可利用缺陷（Endor Labs 2,614 个）、仅 8.5% 用 OAuth（Astrix 5,200+ servers） | https://www.practical-devsecops.com/mcp-security-statistics-2026-report | 2026 | 中 |
| 9 | OX Security 2026-04 在官方 MCP SDK（Py/TS/Java/Rust）的 stdio 传输发现命令执行问题；CSA 2026-05 记录跨 MCP Inspector/LiteLLM/Cursor/LibreChat/Windsurf 的 7 个高危 CVE | https://labs.cloudsecurityalliance.org/research/csa-research-note-mcp-security-crisis-20260504-csa-styled | 2026-05-04 | 中高 |
| 10 | CVE-2026-45609：Spring AI mcp-security <0.1.9 的 SSRF（OAuth discovery/DCR 未校验内网地址） | https://www.sentinelone.com/vulnerability-database/cve-2026-45609 | 2026 | 高 |
| 11 | 工具目录 token 开销：50+ MCP 工具约 72K tokens，Anthropic 见过 134K；Tool Search 使可用上下文 122,800→191,300；PTC 让复杂研究任务 43,588→27,297 tokens（−37%）；Tool Use Examples 把复杂参数准确率 72%→90% | https://www.anthropic.com/research/advanced-tool-use | 2025-11（日不详） | 高 |
| 12 | Anthropic 工程博客提出"代码执行 + MCP"：把工具当文件系统 API，中间结果留在沙箱；官方未提供参考实现 | https://www.anthropic.com/research/code-execution-with-mcp | 2025-11-04 | 高 |
| 14 | GitHub 官方 MCP server 工具定义开销：17,600 tokens/请求（StackOne）vs 约 55,000 tokens/93 tools（dev.to）——两个口径冲突，并列 | https://www.stackone.com/blog/mcp-token-optimization | 2026 | 低（互相冲突） |
| 15 | Mem0 2026-04 算法自报：LoCoMo 92.5、LongMemEval 94.4、BEAM-1M 64.1、BEAM-10M 48.6，约 6.9K tokens/检索，p50 0.88s/1.09s | https://mem0.ai/blog/state-of-ai-agent-memory-2026 | 2026 | 中（厂商自报） |
| 16 | 独立评测（Vectorize，2026-03-15）在同一 benchmark 名下给 Mem0 LongMemEval 49.0，与厂商 94.4 差 45.4 分；无外部方可裁定 | https://www.digitalapplied.com/blog/open-source-agent-memory-mem0-letta-zep-compared | 2026-08-04 | 中 |
| 17 | Zep：LongMemEval p50 104ms / p95 162ms；LoCoMo 三方争议（Zep 84 → Mem0 复现 58.44 → Zep 反驳 75.14） | https://www.getzep.com/blog/lies-damn-lies-statistics-is-mem0-really-sota-in-agent-memory | 2025（日不详） | 中 |
| 18 | LoCoMo 本身有已知缺陷（speaker 归属错误、问题歧义），分数被争的根因之一 | https://www.developersdigest.tech/blog/best-ai-agent-memory-providers-2026 | 2026 | 中 |
| 19 | 商业助手/长上下文模型在 LongMemEval 上比 oracle 检索低约 30 分（Wu et al., ICLR 2025） | https://preuve.ai/blog/ai-memory-systems-statistics-2026 | 2025（论文）/2026（汇编） | 中 |
| 20 | Mem0 ECAI 2025 论文：p95 1.44s vs 全上下文 17.12s（−91%），token −90%（1.8K vs 26K） | https://arxiv.org/abs/2504.19413 | 2025 | 高 |
| 21 | 许可证：Mem0 / Letta / Graphiti 均 Apache-2.0；Zep 已停止维护 Community Edition，只保留 Graphiti 开源；LangMem MIT 但依赖 LangGraph | https://www.getzep.com/blog/announcing-a-new-direction-for-zeps-open-source-strategy | 2025（日不详） | 高 |
| 23 | 云记忆已有大厂入场：AgentCore Memory GA 2025-10，Google Memory Bank 2026-09 重新定价，Foundry memory 仍 preview | https://www.maximem.ai/blog/best-ai-agent-memory-platforms-2026 | 2026-09 | 中 |
| 24 | Claude 平台 2025-09 上线 memory tool + context editing；2026 提供服务端 compaction（阈值触发与按需两种） | https://platform.claude.com/docs/en/build-with-claude/compaction | 2026 | 高 |
| 25 | 隐私：GDPR Art.17 删除需覆盖 embedding/index/cache/log 等派生副本；EU AI Act 高风险日志留存义务与删除权直接冲突，高风险义务 2026-08 全面生效 | https://tianpan.co/blog/2026/05/13/agent-memory-compliance-surface-records-management | 2026-05-13 | 中 |
| 26 | E2B：Hobby 免费 100 沙箱小时、Pro $150/mo 含 500 小时、按秒计费、Firecracker microVM、无 GPU；2 vCPU/512MiB ≈ $0.0000303/s | https://e2b.dev/pricing（经 https://www.beam.cloud/blog/e2b-pricing-explained 转述） | 2026-06~10 | 中 |
| 27 | Daytona：$0.0504/vCPU-hr、$0.0162/GiB-hr、$200 信用、创建 <90ms、网络支持 CIDR/域名白名单、密钥以占位符+出站代理替换、默认 15 分钟空闲停止；2026-06 起生产代码闭源 | https://www.daytona.io/pricing | 2026-10-20 | 中高 |
| 28 | Modal：gVisor 隔离、默认最长 5 分钟可调至 24h、Team $250/mo、沙箱费率约标准算力 3×、入站默认拒绝 | https://northflank.com/blog/daytona-vs-modal | 2026 | 中 |
| 29 | 成本量级：200 沙箱场景 E2B $16,819/mo、Northflank $7,200、Vercel Sandbox $31,069（2026-04 报价）；1K 任务/天×10 分钟 E2B ≈ $545/mo；5% 占空比闲置月费 E2B/Daytona 各 $120.89 vs Fly Sprite $6 | https://northflank.com/blog/e2b-vs-vercel-sandbox | 2026-04 / 2026-10 | 中 |
| 30 | Anthropic 开源 sandbox-runtime（@anthropic-ai/sandbox-runtime，Apache-2.0）：macOS sandbox-exec/Seatbelt、Linux bubblewrap+netns、Windows WFP+NTFS ACL；明确"文件与网络隔离必须同时" | https://github.com/anthropics/sandbox-runtime | 2025-11（日不详） | 高 |
| 31 | 2026-08 研究者披露 Codex 的 Heapjack/Overpatch 两处沙箱逃逸（第三方研究，未见官方确认） | https://aviatrix.ai/threat-research-center/openai-codex-sandbox-escape-heapjack-overpatch-2026 | 2026-08 | 低中 |
| 32 | WebVoyager 已饱和：Magnitude 93.9%、browser-use 89.1%、Operator 87.0%、Skyvern 85.9%，原始实现 59.1% | https://github.com/magnitudedev/webvoyager | 2026（日不详） | 中 |
| 33 | OSWorld 2.0 重置后：上线时最好 20.6%（500 步预算、约 244K 输出 token/任务）；2026-09 榜 Claude Fable 5.1 77.9%、GPT-6 Astra 72.6%；OSWorld-Verified 人类基线 72.36% | https://o-mega.ai/articles/the-2025-2026-guide-to-ai-computer-use-benchmarks-and-top-ai-agents | 2026-09 | 中（二手汇编） |
| 34 | 真实站点更难：Skyvern 自家 WebBench（5,750 任务、500+ 站点）64.4% | https://michaellivs.com/blog/state-of-browser-use-2026 | 2026-05 | 中 |
| 35 | 浏览器 agent 成本：browser-use cloud $0.02/步，默认 25 步上限即 $0.50/run，另加 $0.10/浏览器小时；声明 computer toolset 每题约 +4,500 input tokens | https://browser-use.com/posts/best-browser-agent-mcp-servers | 2026 | 中 |
| 36 | APB（4,209 案例/22 领域）：GPT-4o 于 ToolSandbox 直接 76.3 → plan-first 79.2 → refine 83.3；但 plan-first 不总优于直接执行（Qwen3-VL-235B 79.1 < 80.7），需一轮外部诊断式 critique 才稳定增益 | https://arxiv.org/abs/2606.04874 | 2026-10-05 | 高 |
| 37 | 无外部反馈时 LLM 无法自我纠错，多数情况性能下降；此前 Reflexion 类增益源于 oracle 标签（ICLR 2024） | https://arxiv.org/abs/2310.01798 | 2023-10（v2 2024-03） | 高 |
| 38 | DeepPlanning（约束型长程规划）：最好 62.3%（Qwen3.7 Plus），第二名 41.5% —— 长程约束规划仍是瓶颈 | https://benchlm.ai/benchmarks/deepplanning | 2026-10-29 | 中 |

## ③ 候选方案对比

### 表 A：记忆层

| 方案 | 许可 / 费用 | 主要代价 | 主要风险 |
|---|---|---|---|
| Mem0 自托管 | Apache-2.0；云 $19/$249 月 | 需自建向量库+抽取管道，抽取质量决定上限 | 自报 94.4 vs 独立 49.0，效果不确定性最大 |
| Zep / Graphiti | Graphiti Apache-2.0；Zep 云 $25/$475 月；CE 已停止维护 | 要跑图数据库，schema 与抽取开销重 | 锁在单一厂商的开源引擎上，CE 弃维护是前车之鉴 |
| Letta（MemGPT） | Apache-2.0；自托管免费，云 $20–200/mo | 是完整 agent runtime，会侵入架构选型 | 框架耦合强，替换成本高 |
| LangGraph Store + LangMem | MIT；费用=自托管成本 | 只能在 LangGraph 内用，能力偏薄（无图谱） | 与编排层绑定，后续迁移受限 |
| 自写"文件+摘要+检索"最小记忆 | 0 | 需自设计读写时机与遗忘 | 长期重复造轮子，可控性最高 |

### 表 B：代码执行沙箱

| 方案 | 费用量级 | 代价 | 风险 |
|---|---|---|---|
| E2B | $0–150/mo + 按秒；2vCPU/512MiB ≈ $0.0000303/s；200 沙箱 ≈ $16.8k/mo | 无 GPU，长会话受并发与时长限制 | 供应商锁定；跨区延迟 |
| Daytona | $0.0504/vCPU-hr + $0.0162/GiB-hr，$200 信用 | 生产代码闭源，深度定制受限 | 闭源路线变化风险 |
| Modal | Team $250/mo + 沙箱费率约 3× 标准算力 | gVisor 下部分系统调用/内核特性不可用 | 冷启动与 5 分钟默认上限 |
| 本地隔离（sandbox-runtime / Firecracker 自建） | 仅服务器成本；>2000 沙箱小时/月时自建 $100–200/mo 级 | 运维、补丁、逃逸响应全自负 | 逃逸风险最高（Codex 2026-08 已有实例） |

### 表 C：工具层（MCP vs 自研 function calling）

| 方案 | 代价 | 风险 |
|---|---|---|
| 全量 MCP，工具定义全量入上下文 | 50+ 工具约 72K tokens 固定税，每轮都付 | 上下文被挤占；第三方 server 不可信（8.5% 用 OAuth） |
| MCP + Tool Search + 代码执行（PTC） | 需沙箱与代码执行能力配合，实现复杂度高 | 官方博客无参考实现，要自己搭 |
| 纯自研 function calling（自建 schema + 执行器） | 每个集成都要写适配；生态红利为零 | 错过 5.3 万 server 的现成供给；协议层自己维护 |
| CLI / 文件系统式工具 | token 最省，模型最熟（编程模型） | 只适用于有 CLI 的场景；权限与审计更难统一 |

### 表 D：浏览器 / GUI 操作

| 方案 | 许可 / 费用 | 代价 | 风险 |
|---|---|---|---|
| browser-use（自托管） | 开源；自付模型 token | 需自建浏览器池、反爬、验证码 | WebVoyager 89.1% 但真实站点显著更低 |
| 自研 Playwright + 确定性脚本 | 0（工程量大） | 只覆盖固定流程，不通用 | 站点改版即失效，但可回归测试 |
| 商业 CUA 模型（Claude computer use / OpenAI CUA） | 按 token；每题约 +4,500 input tokens | 每步一次推理，慢且贵 | OSWorld 类基准仍远未可靠（2.0 重置后最好 ~78%） |
| Skyvern 等垂直方案 | AGPL-3.0 + 商业授权 | AGPL 传染性影响闭源商业产品 | 许可合规成本 |

## ④ 对本项目的启示

**必须现在定（改起来贵）**
1. **协议层按 MCP 2026-07-28 写**：无状态、每请求带能力/版本、不实现 Sampling/Roots/Logging。这一层做错，后面所有 server 接入都要返工。
2. **工具目录的上下文策略**：默认"Tool Search 按需发现 + 代码执行编排"，不要把全量工具定义塞进系统提示。这是 72K→少量 token 的差别，直接决定单任务成本。
3. **沙箱的隔离模型**：文件隔离与网络隔离必须同时存在（Anthropic 明确结论），且默认拒绝出站、按域名白名单放行。第一版接 E2B 或 Daytona，不自研。
4. **记忆的"写什么/何时写"策略**：写入时机（任务结束 vs 每轮）、遗忘策略、以及"记忆是省 token 的手段"这一定位，必须在架构上定死；选哪家供应商反而可以后定。
5. **规划范式**：默认"轻量计划 + 执行中修订"，并把 critique 建立在**外部可验证信号**（测试、schema 校验、工具返回）上，而非模型自评。

**可以后置（先留接口）**
- 记忆供应商选型（先自写"文件 + 摘要 + 向量检索"，接口留成可替换）；图谱/时序记忆（Zep 路线）在有明确多跳/时效需求前不做。
- 多智能体、任务队列、A2A。
- GUI 全桌面操作：先用浏览器 + API，桌面控制在有具体付费场景前不做。
- 细粒度企业治理（SSO、审计、租户隔离）——但删除接口（GDPR Art.17）要第一天就留。

**第一版必须自建 vs 接现成（含许可与费用）**

| 能力 | 结论 | 说明 |
|---|---|---|
| Agent loop / 规划器 | 自建 | 是产品差异点，无现成组件能替你定策略 |
| 上下文管理（compaction / 裁剪） | 接现成 | 模型侧 compaction 已商品化（Claude 服务端 compaction）；自己只做策略 |
| 工具协议层 | 接 MCP（开源，0 费用） | 别自研协议 |
| 工具发现/编排 | 自建（薄层） | Tool Search + 代码执行是策略，不是组件 |
| 记忆存储 | 接现成（Mem0/Letta Apache-2.0 自托管 0 费用） | 但写入策略自建 |
| 代码沙箱 | 接现成（E2B $0–150/mo 起 / Daytona 按秒） | 自建不划算 |
| 浏览器自动化 | 接现成（browser-use 开源 + 自付 token） | 可靠性不足处用确定性脚本兜底 |
| 评测/回归 | 自建 | 直接决定"能不能改"，见 task-3 |

**MVP**：模型 + MCP 客户端 + 5–8 个一等公民工具（文件、shell/代码执行、抓取、搜索、完成信号）+ 云沙箱 + 会话级压缩 + 文件式长期记忆 + 单层计划与外部校验重试 + 全链路 trace。**不含**：图谱记忆、多智能体、桌面 GUI、企业 SSO。

## ⑤ 未解决问题

1. **记忆效果的真实基线查不到**：厂商自报与独立评测差 45 分，缺一个第三方、可复现、公开 harness 的横向评测。原因是各家用不同 judge/检索配置，且 benchmark 本身（LoCoMo）有标注缺陷。
2. **MCP 企业部署比例没有一手数据**：41%、28%、11–14% 三个数字来自二手汇编且口径不同（"试点"vs"生产"vs"Fortune 500"），未找到 MCP/AAIF 官方调查。
3. **MCP 工具目录开销的准确值查不到**：72K（Anthropic 厂内 50+ 工具）、17.6K（GitHub server/请求）、55K（93 tools）三个口径互相冲突，无统一测量方法。
4. **沙箱逃逸的行业发生率查不到**：只有个案（Codex Heapjack/Overpatch），没有公开的逃逸统计或 CVE 归类，无法量化"自建 vs 托管"的风险差。
5. **规划范式的 2026 生产级证据薄弱**：APB 只验证了"一轮诊断式修订"，没有多轮、也没有长任务（小时级）的对照实验；plan-first 何时劣于直接执行仍无判据。
