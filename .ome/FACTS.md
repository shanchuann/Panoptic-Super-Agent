# FACTS — 事实清单与假设值（P0）

> 规则：每个数字有出处，不推导。二手来源标「待核」，P0 结束前必须一手核实。
> 更新时间：2026-11-05

## 1. 事实（有出处）
| # | 事实 | 数值/结论 | 出处 | 日期 | 可信度 |
|---|---|---|---|---|---|
| F-01 | 2026 被称为智能体爆发年；企业级成熟应用集中在 2026–2028 | 定性 | 新华《环球》圆桌 https://www.xinhuanet.com/globe/20260402/39ce4b6b703843a6aef41257f02976e0/c.html | 2026-04-02 | 中（受访者观点） |
| F-02 | 长程任务能力量级 | Claude Opus 4.6 可完成 14h30m 长程任务，50% 准确率 | 同上（转述） | 2026-04-02 | 低（引用二手，待一手核实） |
| F-03 | 工程共识：简单可组合模式优于复杂框架；workflow 与 agent 要分开 | 定性结论 | Anthropic《Building effective agents》https://www.anthropic.com/engineering/building-effective-agents | 2024-12-19（2026-05 加注） | 高（原文） |
| F-04 | 官方现行做法已转向托管 agent | 文中指向 Claude Managed Agents | 同上 | 2026-05 | 高（原文注记） |
| F-05 | MCP SDK 累计下载量约 10 亿、月下载近 5 亿 | 约 10 亿 / 月 ~5 亿 | https://aibuzz.blog/model-context-protocol-explained | 2026 | 低（二手，待核） |
| F-06 | Fortune 500 中约 28% 已部署 MCP | 28% | 同上 | 2026 | 低（二手，待核） |
| F-07 | 多智能体生产失败率 41%–86.7% | 41–86.7% | https://growthengineer.ai/blog/single-agent-vs-multi-agent（引 Maxim AI 2026） | 2026 | 低（二手，待核） |
| F-08 | GAIA test 最高 94.0%（多模型系统） | 94.0% | https://decodethefuture.org/en/ai-agent-benchmarks-2026 | 2026-10-12 | 低（二手榜单，待核） |
| F-09 | Cloudflare Agents Week 2026 发布 Agent Memory、AI Search、Sandbox 等智能体原语 | 产品清单 | https://blog.cloudflare.com/zh-cn/agents-week-in-review | 2026 | 中（厂商博客） |

## 2. 假设值（开发方假设，必须显式标注，待确认）
| 编号 | 假设 | 依据 | 状态 |
|---|---|---|---|
| A-01 | 首版用户＝你本人（个人开发者），非企业多租户 | 当前只有想法，无客户 | 待确认 |
| A-02 | 部署＝本地优先（Web UI + 本地内核），代码执行走云沙箱 | 成本与安全折中 | 待确认 |
| A-03 | 首版主场景＝「研究 + 代码/文档交付」的窄闭环 | F-03 简单优先 | 待确认 |
| A-04 | 预算＝开发 ≤ 2 周、API 成本 ≤ ¥500/月 | 个人项目常见量级 | 待确认 |
| A-05 | 技术栈＝TypeScript 为主（Web 前端 + Node 内核），Python 仅用于评测脚本 | 生态与招人成本 | 待确认 |
| A-06 | 模型＝多模型可切换（默认中档，难任务升档） | 成本/能力平衡 | 待确认 |

## 3. 待核清单（P0 门禁前必须完成）
- [ ] F-02 长程任务数据找 Anthropic 一手来源
- [ ] F-05/F-06 找 MCP 官方或可信统计一手来源
- [ ] F-07 找 Maxim AI 原文或 MAST 论文原始数据
- [ ] F-08 找 benchmark 官方 leaderboard 原始页面
