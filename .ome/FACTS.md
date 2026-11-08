# FACTS ， 事实清单与假设值（P0 ， v0.3）

> v0.3（2026-11-05）：执行 T-001 一手核实。核验结果分三档：已核 / 二手（报告转述）/ 无法核实。
> 规则：每个数字有出处，不推导；无法核实不得当结论用。

## 1. 事实（有出处）
| # | 事实 | 数值/结论 | 出处 | 日期 | 核验 |
|---|---|---|---|---|---|
| F-01 | 2026 为智能体规模化落地临界点；企业成熟应用 2026–2028；Agent 原生生态还需 3–5 年 | 定性 | 新华《环球》https://www.xinhuanet.com/globe/20260402/39ce4b6b703843a6aef41257f02976e0/c.html | 2026-04-02 | 已核原文（受访者观点） |
| F-02 | 长程任务能力量级 | “Claude Opus 4.6 可完成 14h30m 任务，50% 准确率” | 新华同文（转述） | 2026-04-02 | **无法核实**：METR 时间视界页（metr.org/time-horizons）确认存在但 2026-09-08 停更、数据仅图表无数值文本；Xinhua 数字未找到一手出处 至 不引用具体时长 |
| F-03 | 简单可组合模式优于复杂框架；workflow 与 agent 分开 | 定性 | https://www.anthropic.com/engineering/building-effective-agents | 2024-12-19 | 已核原文（2026-05 加注指向 Managed Agents） |
| F-04 | brain/hands/session 解耦；session 为 harness 外事件日志（wake/getEvents）；execute() 统一手脚 | 定性 | https://www.anthropic.com/news/managed-agents | 2026-04-08 | 已核标题/章节；性能数字（−60%/−90%）为报告转述 |
| F-05 | MCP 2026-07-28：无状态核心、MRTR、header routing、列表可缓存、授权加固、Sampling/Roots/Logging 弃用 | 定性 | https://blog.modelcontextprotocol.io/posts/2026-07-28 | 2026-07-28 | 已核原文 |
| F-06 | Tool Search + PTC + Tool Use Examples；50+ 工具约 72K tokens；PTC 43,588至27,297（−37%） | 见左 | https://www.anthropic.com/research/advanced-tool-use | 2025-11-24 | 已核页面；数字为报告转述 |
| F-07 | MAST：7 个开源多智能体失败率 41%–86.7%，14 模式/3 类，κ=0.88 | 见左 | https://arxiv.org/abs/2503.13657 | 2025-03（v3 2025-10） | 已核论文存在（摘要与标题） |
| F-08 | APB：plan-first 不总优于直接执行；plan+外部诊断修订稳定增益（GPT-4o 76.3至79.2至83.3） | 定性 | https://arxiv.org/abs/2606.04874 | 2026-06（v4 2026-10） | 已核论文存在 |
| F-09 | 基准饱和/失真：GAIA 头部 92.36%（追平人类 92%）；SWE-bench Verified >70% vs Pro 23.3%（私有 14.9–17.8%）；OSWorld 2.0 108 任务、人工中位 1.6h、均 318 次工具调用、最好 20.6%，>163 分钟全 0 | 见左 | scale.com/blog/swe-bench-pro（已核 23.3/23.1/17.8/14.9）；osworld-v2.xlang.ai（已核 108/1.6h/318/20.6%/>163 为 0）；GAIA 为二手汇总 | 2025-09 / 2026-06 | 部分已核（标注见左） |
| F-10 | 多智能体 ≈15× chat token；单 agent ≈4× | 15× / 4× | Anthropic multi-agent research system（报告 01 引） | 2025-06-13 | 报告转述 |
| F-11 | τ²-bench 头部 pass^1 87.9%；τ³-Banking 55.2% | 87.9% / 55.2% | https://taubench.com | 抓取 2026-11-05 | 页面已核；数字报告转述 |
| F-12 | NVD 中 MCP 相关 CVE 156 条（keywordSearch=model context protocol） | 156 | https://services.nvd.nist.gov/rest/json/cves/2.0 | 2026-11-05 查询 | **已核**（API totalResults=156） |
| F-13 | Manus 2.0（2026-09-28）发布，Cascade harness；token −23.2% / 耗时 −28.2% / 成本 −32%（厂商自测） | 见左 | https://manus.im/blog/introducing-manus-2-0 | 2026-09-28 | 页面已核；数字厂商自测 |
| F-14 | Cloudflare Agents Week 2026：Agent Memory、AI Search、Sandbox 等原语 | 产品清单 | https://blog.cloudflare.com/zh-cn/agents-week-in-review | 2026 | 厂商博客 |
| F-15 | 沙箱商品化：E2B Pro $150/mo 含 500h；Daytona $0.0504/vCPU-hr；Modal Team $250/mo | 见左 | 各定价页（报告 02 证据 #26–#28） | 2026 | 报告转述，待核（定价页未逐条打开） |
| F-16 | Mem0 论文：p95 1.44s vs 17.12s（−91%）、token −90%（1.8K vs 26K） | 见左 | https://arxiv.org/abs/2504.19413 | 2025 | 报告转述 |
| F-17 | Claude Agent SDK 版本 0.3.318；npm license 字段为“SEE LICENSE IN README.md” | 定性 | https://registry.npmjs.org/@anthropic-ai/claude-agent-sdk/latest | 2026-11-05 查询 | **已核元数据**；许可条款实质无法核实（GitHub 不可达）至 不假设可商用 |

## 2. 假设与已确认项（2026-11-07 更新）
| 编号 | 假设 | 依据 | 状态 |
|---|---|---|---|
| A-01 | 首版用户＝你本人（个人开发者），非企业多租户 | 当前只有想法，无客户 | **已确认**（2026-11-07：开源个人工具） |
| A-02 | 部署＝本地优先（Web UI + 本地内核） | 成本与安全折中 | **已确认**（2026-11-07：代码执行首版本地隔离，云沙箱后置） |
| A-03 | 首版主场景＝“研究 + 代码/文档交付”的窄闭环 | F-03 + 评测现实 | **已确认**（2026-11-07，按 B 推进；定位变化则重开） |
| A-04 | 预算＝**不适用**：本项目不记预算、不计量费用；开发完成后接入订阅使用 | 用户 2026-11-07 确认 | **已确认（关闭）** |
| A-05 | 技术栈＝TypeScript 为主（Web 前端 + Node 内核），Python 仅评测脚本 | 生态与招人成本 | **已确认**（沿用基座） |
| A-06 | 模型＝多模型可切换（默认中档，难任务升档） | 成本/能力平衡 | **已确认**（2026-11-07：BYOK + 三档映射） |
| A-07 | 单任务时长 ≤30 分钟，超时转人工 | 长任务断崖（F-09） | **已确认**（熔断已锁） |
| A-08 | v0.1 不含开放网页/桌面 GUI 自主操作 | 真实站点 ~64% / OSWorld 20.6% | **已确认**（SCOPE 排除清单） |

## 3. T-001 核验结论
| 待核项 | 结果 |
|---|---|
| F-02 长程任务数据 | **无法核实**（METR 图表无数值；Xinhua 转述）至 文档不引用具体时长 |
| F-09 官方基准 | SWE-bench Pro 23.3%/23.1%、私有 17.8%/14.9% 已核；OSWorld 2.0 108 任务/1.6h/318 calls/20.6%/>163min 为 0 已核；GAIA 92.36% 仍二手 |
| F-12 NVD 156 条 | **已核**（NVD API totalResults=156，2026-11-05） |
| Claude Agent SDK 许可 | **无法核实条款实质**（npm 元数据仅指向 README；GitHub/raw 不可达）至 不假设可商用 |
| Manus/Genspark 定价 | **无法核实**（JS 渲染/反爬）至 不写具体价格 |

## 4. 基座事实（DSH ， 已核目录/元数据）
| # | 事实 | 值 | 证据 |
|---|---|---|---|
| F-18 | 基座版本与成熟度 | `@deepseek-ai/dsh-root` 0.2.1-rc.3；README 注明“开发者预览，将有破坏性变更” | package.json / README.zh.md |
| F-19 | 许可 | MIT，Copyright (c) 2026 DeepSeek | LICENSE |
| F-20 | 运行时 | Node >= 24.9.0；pnpm 11.28.5（Corepack） | package.json / docs/development.zh.md |
| F-21 | 规模 | `packages/*/*` 363 个包；apps：cli/desktop/desktop-host/web/plugin-market-generator | 目录统计 2026-11-05 |
| F-22 | 当前代码状态 | 分支 master，HEAD 22ddee3792，工作区干净 | git status/log 2026-11-05 |
| F-23 | 架构范式 | Cordis 插件树 + profile/组合包/patch；agent-loop、session 日志、tools、mcp、sandbox、deliverables 均为插件 | docs/architecture.zh.md |
| F-24 | 品牌规范 | 项目名不得使用“DeepSeek Harness”商标；可用“基于…构建”或 DSH 缩写；不得暗示背书 | BRAND_GUIDELINES.zh.md |
