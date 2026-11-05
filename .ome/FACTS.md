# FACTS — 事实清单与假设值（P0 · v0.2）

> v0.2（2026-11-05）：并入 3 份调研报告（`.ome/research/`）。
> 「已核」= Lead 亲自 fetch 到原文确认关键句；「报告转述」= 报告给了 URL+日期但未逐句核。
> 规则不变：每个数字有出处，不推导；二手标「待核」；假设值集中登记。

## 1. 事实（有出处）
| # | 事实 | 数值/结论 | 出处 | 日期 | 核验 |
|---|---|---|---|---|---|
| F-01 | 2026 为智能体规模化落地临界点；企业级成熟应用 2026–2028；Agent 原生生态还需 3–5 年 | 定性 | 新华《环球》https://www.xinhuanet.com/globe/20260402/39ce4b6b703843a6aef41257f02976e0/c.html | 2026-04-02 | 已核原文（受访者观点） |
| F-02 | 长程任务能力量级 | Claude Opus 4.6 完成 14h30m 任务，50% 准确率 | 同上（转述） | 2026-04-02 | 报告转述，待一手 |
| F-03 | 工程共识：简单可组合模式优于复杂框架；workflow 与 agent 分开 | 定性 | Anthropic《Building effective agents》https://www.anthropic.com/engineering/building-effective-agents | 2024-12-19（2026-05 加注） | 已核原文 |
| F-04 | Anthropic 解耦 brain/hands/session；session 为 harness 外持久事件日志（wake 重放/getEvents 切片）；execute(name,input)→string | 定性 | https://www.anthropic.com/news/managed-agents | 2026-04-08 | 已核标题与目录；−60%/−90% 为报告转述 |
| F-05 | MCP 2026-07-28 规范：无状态核心、MRTR、header routing、列表结果可缓存、授权加固、Sampling/Roots/Logging 弃用 | 定性 | https://blog.modelcontextprotocol.io/posts/2026-07-28 | 2026-07-28 | 已核原文 |
| F-06 | 高级工具用法：Tool Search + Programmatic Tool Calling + Tool Use Examples；50+ 工具约 72K tokens；PTC 43,588→27,297（−37%） | 定性+数字 | https://www.anthropic.com/research/advanced-tool-use | 2025-11-24 | 已核页面；数字为报告转述 |
| F-07 | MAST：7 个开源多智能体失败率 41%–86.7%，14 种失败模式/3 类，κ=0.88 | 41–86.7% | https://arxiv.org/abs/2503.13657 | 2025-03（v3 2025-10） | 已核论文存在 |
| F-08 | APB：plan-first 不总优于直接执行（Qwen3-VL-235B 79.1<80.7）；plan+外部诊断修订稳定增益（GPT-4o 76.3→79.2→83.3） | 定性 | https://arxiv.org/abs/2606.04874 | 2026-06-03（v4 2026-10） | 已核论文存在 |
| F-09 | 公开基准饱和/失真：GAIA 头部 92.36% 追平人类 92%；SWE-bench Pro 23.3%（私有子集 14.9–17.8%）；OSWorld 2.0 最好 20.6% | 见左 | 报告 03 证据 #1–#4（leaderboard.steel.dev / scale.com / osworld-v2.xlang.ai） | 2026-04~06 | 二手汇总，口径待核 |
| F-10 | 多智能体成本 ≈15× chat token；单 agent ≈4× | 15× / 4× | Anthropic multi-agent research system（报告 01 引） | 2025-06-13 | 报告转述 |
| F-11 | τ²-bench 头部 pass^1 87.9%；τ³-Banking 55.2% | 87.9% / 55.2% | https://taubench.com | 抓取 2026-11-05 | 已核页面存在；数字报告转述 |
| F-12 | NVD 中 MCP 相关 CVE 156 条；EchoLeak（CVE-2025-32711）9.3 零点击外泄；mcp-remote（CVE-2025-6514）9.6 命令注入 | 156 条 | NVD（报告 03 证据 #10 #11） | 2025-06~2026-11 | 报告转述 |
| F-13 | Manus 2.0（2026-09-28）发布，Cascade harness；厂商自测 token −23.2%、耗时 −28.2%、成本 −32% | 见左 | https://manus.im/blog/introducing-manus-2-0 | 2026-09-28 | 已核页面存在；数字为厂商自测 |
| F-14 | Cloudflare Agents Week 2026 发布 Agent Memory、AI Search、Sandbox 等智能体原语 | 产品清单 | https://blog.cloudflare.com/zh-cn/agents-week-in-review | 2026 | 厂商博客 |
| F-15 | 沙箱商品化：E2B Pro $150/mo 含 500 小时；Daytona $0.0504/vCPU-hr；Modal Team $250/mo | 见左 | 各定价页（报告 02 证据 #26–#28） | 2026 | 报告转述，待核 |
| F-16 | 记忆收益主要在成本/延迟：Mem0 论文 p95 1.44s vs 17.12s（−91%）、token −90%（1.8K vs 26K） | 见左 | https://arxiv.org/abs/2504.19413 | 2025 | 报告转述 |

## 2. 假设值（开发方假设，必须显式标注，待确认）
| 编号 | 假设 | 依据 | 状态 |
|---|---|---|---|
| A-01 | 首版用户＝你本人（个人开发者），非企业多租户 | 当前只有想法，无客户 | 待确认 |
| A-02 | 部署＝本地优先（Web UI + 本地内核），代码执行走云沙箱 | 成本与安全折中 | 待确认 |
| A-03 | 首版主场景＝「研究 + 代码/文档交付」的窄闭环 | F-03 简单优先 + 评测现实 | 待确认 |
| A-04 | 预算＝开发 ≤ 2 周、API 成本 ≤ ¥500/月 | 个人项目常见量级 | 待确认 |
| A-05 | 技术栈＝TypeScript 为主（Web 前端 + Node 内核），Python 仅评测脚本 | 生态与招人成本 | 待确认 |
| A-06 | 模型＝多模型可切换（默认中档，难任务升档） | 成本/能力平衡 | 待确认 |
| A-07 | 单任务时长 ≤ 30 分钟，超时转人工 | 长任务断崖（F-09） | 待确认 |
| A-08 | v0.1 不含开放网页/桌面 GUI 自主操作 | 真实站点仅 ~64% | 待确认 |

## 3. 待核清单（P0 门禁前）
- [ ] F-02 长程任务数据找 Anthropic/METR 一手来源（METR 页面 2026-09 起停更）
- [ ] F-09 逐个打开官方 leaderboard 确认分数与脚手架
- [ ] F-12 NVD API 复核 156 条的口径（关键词/时间窗）
- [ ] Claude Agent SDK 许可正文（npm 仅指向 README）
- [ ] Manus / Genspark 定价（JS 渲染，未取到）
- [ ] pass^k 公开可比数据（榜单只报 pass^1）
