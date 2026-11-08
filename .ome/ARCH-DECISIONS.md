# ARCH-DECISIONS ， 架构输入（v1.1 ， 2026-11-07 ， 维护者 Lead）

> 用户口述架构已落 ADR-0002；本表为原始输入与仍待细化项。

## 1. 二次开发方式
**基于源码升级（Fork + 内容层重构）**：fork 源码后在本仓库直接修改与演进，保留原有功能与界面，重构“记忆存储、模型调用、会话管理”；其余基座能力复用。不做纯插件外挂。
- 未选：纯外挂插件（改不动内容层）、全面重写（成本过高）。

## 2. 产品形态
- **P1 Web**：先确认界面与基本功能；
- **P2 桌面客户端**：Windows / macOS / Linux；
- **P3 移动端 App**：远程控制桌面客户端（不把完整 agent 跑在手机）。

## 3. “超”的落点
模型自行掌管对话 ， 持续迭代交付升级 ， 插件 ， 长时记忆 ， 多模态配置 ， 长时序规划 ， 跨领域工具面 ， 不区分 Coding/Chat/Work。
至 扩展点映射见 ADR-0002 表。

## 4. 基座复用/替换
- 复用：agent-loop、session 日志、tools、MCP、sandbox、deliverables、插件体系、UI 组件；
- 重构：记忆存储、模型调用、会话管理；
- 移除：无（暂不删基座能力）。

## 5. 品牌与发布
- 名称/logo：万象超级智能体 / Panoptic Super（已登记）；
- UI：尽量沿用官方设计（MIT 允许），**可见品牌标识全部替换**，不暗示背书；
- 许可：本项目沿用 MIT，保留原版权声明 + 追加本项目版权；依赖通告沿用。

## 6. 上游同步
**不跟进**；仅高危安全漏洞时人工评估 cherry-pick。

## 7. 仍待细化（不阻塞开工，但 P1 内要定）
| # | 待定 | 影响 |
|---|---|---|
| U1 | “会话管理”重构是否改动 JSONL 持久化格式 | **已定：不动**（ADR-0003；项目状态独立成域，不写 SessionHeader） |
| U2 | 桌面端是否沿用 Electron（基座是 Electron） | P2 打包与体积 |
| U3 | 移动端与桌面的连接方式（局域网/Tailscale/中继） | P3 安全模型 |
| U4 | 长期记忆的存储后端（SQLite / 向量库 / 文件） | **已定：`storageDomain` 独立域 + SQLite/FTS 主存，向量后端可替换**（ADR-0005） |
| U5 | 本项目 LICENSE 文本（MIT + 双版权行）与 NOTICE 格式 | **已定：MIT + 双版权行**（2026-11-07 用户确认），NOTICE 沿用现有格式 |

## 8. 设计决策记录（2026-11-07）

> 唯一权威登记见 [DECISIONS.md](DECISIONS.md)（DEC-01…DEC-20）；本表仅记录首批 6 项确认（原始答复："需要回的 6 个选择均按你的思路进行"），后续决策不在此重复。


| # | 决策 | 落点 |
|---|---|---|
| 1 | 指标口径与硬熔断现在锁；目标值按任务时长分档、基线后锁定 | [BRIEF §4](BRIEF.md) |
| 2 | 记忆：保守默认参数 + 影子模式 + P1 前一次小规模标定 | [ADR-0005](../docs/adr/ADR-0005-memory-weight-forgetting.md) |
| 3 | 交互：图谱为默认主页、聊天为节点记录、收件箱为唯一主动入口 | [interaction.md](design/interaction.md) |
| 4 | 计划：默认风险自适应，首次建项确认一次，四类情况强制确认 | [projects.md](design/projects.md) |
| 5 | 模型：按角色分层（Lead/Verifier 强、Worker 便宜）+ 失败升级 | [ADR-0004](../docs/adr/ADR-0004-model-gateway.md) |
| 6 | 交互细节：节点粒度任务级（Run 折叠）、新建项目一句话输入 | [interaction.md](design/interaction.md) |
| 7 | 首版模型接入 BYOK：用户自填地址与密钥，三档映射可配置 | [ADR-0004](../docs/adr/ADR-0004-model-gateway.md) |
| 8 | 产物双视图、侧栏保留可折叠、默认折叠 D1 | [interaction.md](design/interaction.md) |
| 9 | 执行环境首版本地隔离（OS 级限制），云沙箱后置 | [ADR-0001 D4](../docs/adr/ADR-0001-harness-architecture.md) |
| 10 | 二次开发方式：基于源码升级；LICENSE：MIT 双版权 | [SCOPE §0](SCOPE.md)、[ADR-0002](../docs/adr/ADR-0002-fork-refactor-and-product-roadmap.md) |
| 11 | 产品形态：开源、个人自用、自带 API（BYOK）；无多租户、无计费、无云端账号 | [BRIEF §0](BRIEF.md)、[SCOPE §2](SCOPE.md) |
| 12 | **不记预算、不计量费用**；开发完成后以订阅方式接入模型 API | [BRIEF §4](BRIEF.md)、[SCOPE M10](SCOPE.md)、[ADR-0004 D4](../docs/adr/ADR-0004-model-gateway.md) |
| 13 | 协作演进：三层上下文 + 黑板 + 协调策略层；默认最小充分范式、按证据升级 | [ADR-0006](../docs/adr/ADR-0006-collaboration-model.md)、[evolution.md](design/evolution.md) |

关联 ADR：[ADR-0003](../docs/adr/ADR-0003-session-project-state.md)（会话/项目状态）、[ADR-0004](../docs/adr/ADR-0004-model-gateway.md)、[ADR-0005](../docs/adr/ADR-0005-memory-weight-forgetting.md)。
