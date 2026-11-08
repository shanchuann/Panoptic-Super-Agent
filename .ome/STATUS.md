# STATUS ， 万象超级智能体（Panoptic Super）

- 当前阶段：**P1 开发中**（品牌替换已完成；记忆/项目/协作等产品能力未开工；设计已确认，SCOPE 未签）
- 日期：2026-11-07
- 项目库：`D:\Code\SuperAgent`（远端 **https://github.com/shanchuann/Panoptic-Super-Agent.git**）
- 基座：已 squash 导入本仓库（基座 HEAD `22ddee3792`，上游历史未并入；`D:\Code\deepseek-harness` 保留为只读参照）

## 已完成
- 架构落 **ADR-0002**（Fork + 内容层重构；Web至桌面至移动远程；不跟进上游；MIT + 品牌替换）
- **基线验证 B-001..B-004 通过（证据来源：基座仓库 `D:\Code\deepseek-harness`，2026-11-05；本仓库尚未复验）**：
  - 构建 `pnpm run build`：10 gates PASS，63.38s
  - 类型检查 `pnpm run typecheck`：5 gates PASS，16.28s
  - focused 测试 `packages/core/session`：574 用例 PASS，2.85s
  - Web 冒烟 `pnpm dsh web --no-open`：3080 端口，token 鉴权 401至200，HTML 39KB
  - 证据：`.ome/evidence/B-001/`
- 品牌替换：PR #60（客户端品牌与独立基线）、#63（依赖与回归修复）已合并；证据 `.ome/evidence/branding/`；
- 文档更新：BROWNFIELD-BASELINE §4 已回填；SCOPE/PLAN/SPEC/STATUS 同步

## 下一步（2026-11-07 起）
1. 先在本仓库复验基线（build/typecheck/focused test），确认 fork 仓库可构建；
2. 按任务卡开工：G-001（模型网关+BYOK）至 M-001（记忆最小闭环）至 P-001（项目域）至 C-001（协调策略层）至 U-001（图谱）至 U-003（黑板视图）；
3. 每张卡按判据留证据到 `.ome/evidence/<编号>/`。

## 阻塞/风险
- U1：会话格式，已定不动（ADR-0003）；
- U5：LICENSE，已定 MIT 双版权；
- 远程控制（P3）需独立 ADR；
- 本仓库基线未复验（见上）。

## 交付物一致性
| 项 | 状态 |
|---|---|
| 代码 | 基座代码已导入（19,215 个文件）；基座仓库已完成安装/类型检查/构建；本仓库品牌替换已合并（PR #60/#63）；产品能力未开工 |
| 文档 | + ADR-0002、基线证据、SPEC §9/§10 |
| 部署 | 无 |
| 版本号 | v0.2.1-p1-baseline |

## 基座导入（2026-11-05）
- 方式：**A ， squash 导入**（用户确认：不跟进上游；合规靠 MIT 许可证 + DeepSeek 版权声明）
- 导入提交：`ad2de09`；跟踪文件 19,215；.git pack ≈ 40.7MB
- 许可：LICENSE 双版权（DeepSeek + 山川不念旧）；NOTICE 记录来源 commit `22ddee37`
- 基座 README 存档于 `docs/upstream/`（根 README 保留本项目版本）
- 注意：B-001..B-004 基线是在 `D:\Code\deepseek-harness` 验证的；本仓库需 `pnpm install` 后重跑基线。

## 远端推送（2026-11-05）
- 推送失败一次（HTTPS 大包 connection reset）至 改用 SSH push 成功：`22645f7b..375d3e19`；
- 远端 main 含全部代码与文档（19,215 个跟踪文件），本地/远端一致；
- 推送 URL 已设为 SSH，fetch 仍走 HTTPS。

## 用户报告（2026-11-05）
- 本仓库（D:\Code\SuperAgent）已执行 `pnpm install` 且运行成功（**用户口头报告，未由我复验**；按用户指示暂不执行任何下一步命令）。
- 等待用户提供设计文档与相关内容（记忆存储/模型调用/会话管理/UI 等），到位后再开始开发。
- 开发启动顺序（设计文档 至 扩展点映射 至 ADR/任务卡 至 实现）见 HANDOFF。

## CI 现状（2026-11-07）
- 已删除继承的 27 个 workflow（PR #46）；现有自建 .github/workflows/ci.yml（windows-latest），见 CI-POLICY.md。

## 分支保护（2026-11-05）
- `main` 已开启保护：要求 PR、0 个必需审批、enforce admins、禁 force push、禁删除、要求对话解决。
- 副作用：直接 push 被禁，文档/代码变更一律走 PR。

## PR 处理（Dependabot 涌入；快照 2026-11-05，之后合并见 git log：#31/#33/#46/#47/#52/#53/#60/#63）
- 已合并 18 个依赖升级 PR（#1、#2、#6–#19、#22、#24 等），主分支随之推进。
- 剩余：
  - #3/#4/#5（GitHub Actions 升级）：合并被拒，根因是 gh OAuth token 缺 `workflow` 作用域（改动 `.github/workflows/*` 需要）；需 `gh auth refresh -s workflow` 后重试。
  - #20/#25/#26：冲突，已请求 Dependabot rebase。
  - #21/#23：major 版本升级（@types/big.js、which），需本地 typecheck/build 验证后再合。
- 根因：导入基座 `.github/dependabot.yml`（每日 04:00 扫描、30 天冷却）触发历史依赖积压；CI 工作流继承自上游、缺 secrets/runners，检查结果不可信。
- 建议：CI 策略确定前，先给 Dependabot 加分组/限流，避免 PR 洪水。

## GitHub MCP（2026-11-05）
- 已在 desktop profile 配置远程 GitHub MCP（`mcp__github__*`），详见 `.ome/MCP-GITHUB.md`；
- 端点用同 token 实测 `initialize` 返回 200；YAML 已解析校验；备份 `cordis.patch.yml.bak-before-github-mcp`；
- 生效需 DSH 重载配置或重启；token 仅存本机 profile，不在仓库。

## 设计文档 v0.1（2026-11-07）

- 产出：[`.ome/DESIGN.md`](DESIGN.md)（总体：架构/原则/模块边界/路线）+ 四份子系统设计
  - [`design/memory.md`](design/memory.md)：五层记忆（L0 证据至L4 画像）、标签策略表、权重公式与半衰期/衰减/强化、写入/检索/遗忘/删除、睡眠整合、数据模型与评测
  - [`design/context.md`](design/context.md)：上下文分段配额、C0–C4 分层压缩、压缩后重建清单、工具结果治理
  - [`design/tools.md`](design/tools.md)：统一 execute()、工具注册表、权限/审批、MCP 2026-07-28、PTC、工具发现
  - [`design/projects.md`](design/projects.md)：Project至Goal至Task至Run至Artifact 状态机、自然语言建项、角色预设与单次 Run 分工、L0/L1/L2 验证闭环、人在环
- 依据（并行调研）：
  - [`research/04-memory-landscape.md`](research/04-memory-landscape.md)：货拉拉四层/腾讯 TencentDB Agent Memory/Hy-Memory/MemoryBank/Generative Agents 等方案与公式
  - [`research/05-superagent-landscape.md`](research/05-superagent-landscape.md)：Claude Projects、Manus Projects、Deep Agents 等产品与工程实践
  - [`research/06-repo-seams.md`](research/06-repo-seams.md)：DSH 基座扩展点与不可改动项（记忆=storageDomain 独立域；项目=新 storage 域，不碰 SessionHeader）
- 结论：记忆与项目均为"自建薄层 + 复用基座"，不改会话 JSONL 格式；验证层定为 P0。
- 待用户确认：定位与指标阈值、记忆参数初值、项目 UI 形态；确认后转 ADR-0003/0004/0005 与任务卡。

## 交互改版（2026-11-07）

- 用户要求：不再在对话框中展示聊天记录；默认展示智能体协作/工程进度的网状图，点击节点查看该节点的聊天记录；用户只看结果。
- 产出：新增 [`design/interaction.md`](design/interaction.md)（图优先三层信息架构、节点/边/状态模型、收件箱、实时投影、验收判据、MVP）。
- 同步：[`DESIGN.md`](DESIGN.md) 阅读顺序/架构/模块表、[`design/projects.md`](design/projects.md) 的人在环与 UI 映射已更新。

## 决策落地（2026-11-07）

- 用户确认 6 项设计选择（"均按你的思路进行"），决策记录见 [BRIEF §7](BRIEF.md) 与 [ARCH-DECISIONS §8](ARCH-DECISIONS.md)。
- 新增 ADR：
  - [ADR-0003 会话与项目状态](../docs/adr/ADR-0003-session-project-state.md)：项目独立成 storage 域，不改 SessionHeader 与会话 JSONL；
  - [ADR-0004 模型网关与分层路由](../docs/adr/ADR-0004-model-gateway.md)：统一入口、按角色分层、失败升级、验证者独立；
  - [ADR-0005 记忆权重与遗忘](../docs/adr/ADR-0005-memory-weight-forgetting.md)：五层记忆、标签策略、权重公式、保守默认、影子模式与标定。
- 新增任务卡：[M-001](tasks/M-001.md)（记忆最小闭环）、[P-001](tasks/P-001.md)（项目域与状态机）、[U-001](tasks/U-001.md)（图优先 UI）、[G-001](tasks/G-001.md)（模型网关）。
- 文档同步：BRIEF v0.2（指标分档与决策记录）、SCOPE（决策签字行）、SPEC v0.2（FR-13…FR-20）、PLAN（设计落地任务表）、DESIGN（D10–D13）、interaction.md。
- 建议开工顺序：G-001（网关，低耦合）至 M-001（记忆最小闭环）至 P-001（项目域）至 U-001（图谱 UI）；或按用户指定。

## 补充决策（2026-11-07 晚）

- 模型接入：首版 **BYOK** ， 用户自己填请求地址（baseURL）与密钥；三档（strong/medium/cheap）映射可配置；不内置供应商账号与代计费。已写入 [ADR-0004 D6](../docs/adr/ADR-0004-model-gateway.md)，新增 SPEC FR-21，G-001 增加配置/连通性/密钥安全判据。
- 项目 UI 细节：产物 **双视图**（节点角标 + 项目级产物库，同一数据源）；侧栏 **保留可折叠**（展开 / 图标轨 / 聚焦隐藏）；节点默认折叠 **D1**（里程碑 + 任务；Run/产物/验证默认收起；>40 节点自动聚合）。已写入 [interaction.md §3.5](design/interaction.md)，新增 SPEC FR-22，U-001 增加 3 条判据。
- 更新：BRIEF §6/§7、DESIGN D14/D15、SCOPE/SPEC/PLAN 同步。

## 范围决策（2026-11-07 晚）

- 二次开发方式：**基于源码升级**（fork 源码后在本仓库直接修改与演进，不采用纯插件外挂），见 ADR-0002。
- 本项目 LICENSE：**MIT**（双版权：DeepSeek + 山川不念旧），保留 DSH 版权声明与 THIRD_PARTY_NOTICES。
- 已同步 [SCOPE.md §0/§4](SCOPE.md)、[ARCH-DECISIONS.md §1/§7](ARCH-DECISIONS.md)；SCOPE 仍待签字，签字前按本决策推进。

## 沙箱与范围（2026-11-07 晚）

- 沙箱：**首版本地隔离**（OS 级文件/网络限制 + 工作区白名单），云沙箱后置；已写入 SCOPE §3、ADR-0001 D4 调整、tools.md 待决项、ARCH-DECISIONS §8（第 9 条）。
- SCOPE 仍**未签字**（用户明确"先不进行签字"）；签字前按已确认决策推进，范围改动仍走文档记录。

## 产品形态确认（2026-11-07）

- 本项目为**开源（MIT）个人工具**：用户自带 API 密钥（BYOK）、本地运行；**不考虑多租户与计费**，无云端账号。
- 影响：移除"付费客户/商业模型"相关判断（BRIEF kill criteria 已改）；SCOPE 将"多租户/计费/云端账号"标为永久排除；A-01（首版用户＝你本人）随此确认。
- 不变的部分：单用户仍需要资源上限（时长/步数/重试）防跑飞、审批门、数据本地化与删除能力；费用不计量。

## 文档全面同步（2026-11-07）

- SCOPE 升级 v0.3：纳入清单改为 M01–M13（按设计文档展开：五层记忆、图优先交互、项目域、BYOK、本地隔离、资源上限分档），排除清单标"多租户/计费"为永久排除，边界补项目独立域与本地隔离；仍**未签字**。
- SPEC v0.2 追溯矩阵按 FR ↔ M 模块 ↔ 任务卡 ↔ 证据重写。
- PLAN 增加 R-* 至 M/P/U/G 的映射与 SCOPE 模块对应。
- HANDOFF 重写为当前状态（P1 可开工、决策清单、下一步与风险）；README 当前状态与文档索引更新。
- FACTS 的 A-01…A-08 状态更新（A-04 已关闭：不记预算）；evals/metrics.md 升级 v0.3（分档、资源上限、记忆专项）。
- T-002 状态更新为"部分满足（定位按 B，SCOPE 暂不签）"；cold-start 证据追加状态更新。

## 费用预算移除（2026-11-07）

- 用户确认：**不记预算、不计量费用**；项目开发完成后以订阅方式接入模型 API。
- 全仓产品文档已同步：BRIEF §4 去掉货币指标与金额熔断；SCOPE M10 改为"资源与限制"；SPEC FR-10/FR-18/NFR-03 改为时长/步数/重试上限；ADR-0001/0003/0004 去掉费用计量；DESIGN、projects、interaction、tools、memory、metrics、任务卡同步。
- 保留：时长/步数/重试等**资源上限**（防跑飞与死循环），token/耗时仅作诊断记录，不换算金额。

## 协作演进落地（2026-11-07）

- 用户确认：默认策略"最小充分范式 + 按证据升级"，现在落文档。
- 新增 [design/evolution.md](design/evolution.md)：三条主轴（协作/上下文/交互）、范式菜单 M0–M6、协调策略层、升级触发、四阶段路线、风险与验收指标。
- 新增 [ADR-0006 协作模型与协调策略层](../docs/adr/ADR-0006-collaboration-model.md)：三层上下文、黑板优先、规则优先选择器、默认最小充分范式、上下文包、可解释审计。
- 新增任务卡 [C-001](tasks/C-001.md)（协调策略层 MVP，规则版，判据 8 条）。
- 同步：DESIGN（阅读顺序/模块表/D16–D17）、SCOPE M13、PLAN C-001、BRIEF §7、ARCH-DECISIONS §8、HANDOFF、projects.md §4.4、context.md §2.2。

## 黑板视图（2026-11-07）

- 用户要求：黑板适合看项目进度，给用户留一个查看界面。
- 新增 [interaction.md §3.6](design/interaction.md)：黑板视图（看板 + 事件流 + 决策日志，只读投影），含布局、交互、6 条验收判据、四视图共享同一数据源。
- 新增任务卡 [U-003](tasks/U-003.md)；ADR-0006 增加 D7“黑板视图是只读投影”；PLAN 增加 U-003；SCOPE M07 补充；evolution 路线同步。

## 黑板视图细节确认（2026-11-07）

- 图谱保持默认视图，看板作为页签；
- 看板默认按状态分组（待办/就绪/进行中/待验证/完成/阻塞），可切换里程碑/角色；
- 卡片直接提供暂停/取消/审批/追问操作，全部走命令并写审计（不直接改状态）。
- 已同步 interaction.md §3.6、U-003 判据、ADR-0006 D8、BRIEF §7。

## 复核与前沿调研（2026-11-07）

- 并行调研完成：07 记忆/上下文前沿（145 行，38 条证据）、08 Agent 架构前沿（125 行，38 条证据）。
- 已并入设计：context.md（S0 工具目录段、折叠优先、prompt 布局契约、上下文包字段）、memory.md（L3 资产子类、干扰治理、双保险、增量更新、评测换代）、ADR-0006 复核修订（D1–D10：D9 拓扑 A/B 门槛、D10 Run 身份）、projects/evolution/metrics。
- 新增 [.ome/research/README.md](research/README.md) 调研索引。
- 文档审计（09）进行中；结构体检：45 份 md、断链已清零（含修掉的 1 处伪链接），决策/模块/FR/任务卡交叉引用一致。
- 工作树提示：存在 3 处非本次文档工作的既有改动（packages/boot/hmr 的依赖与测试、pnpm-lock.yaml），提交前需单独核验。

## 复核与审计修复（2026-11-07 晚）

- 三路并行调研：07（记忆/上下文前沿）、08（Agent 架构前沿）、09（文档审计，79 条：P0 21/P1 44/P2 14）。
- 审计 P0 已修：STATUS/README/HANDOFF 状态与基线证据来源、SCOPE 签字与排除项、BRIEF 30 分钟口径与评测集规模、SPEC 事件模型改回 DSH SessionEvent V4、成本字段残留（SPEC/interaction/projects/tools/tasks.jsonl）、DESIGN D1/D16 与模块表 ADR 状态、projects §4.3/§4.4 拓扑表述。
- 决策登记：[DECISIONS.md](DECISIONS.md)（DEC-01…DEC-20）成为唯一权威；BRIEF §7、ARCH-DECISIONS §8、HANDOFF §3 改为引用。
- 评测集：删除 max_cost_cny；分档统一 <15m/15-60m/>60m；timeout ≤30 分钟，长任务用 runs_required；validate-evals 增加金额字段禁止与 30 分钟上限；校验 PASS（20 条）。
- 研究索引 [research/README.md](research/README.md) 收录 00–09；ADR-0006 断链已修。
- 全量复核报告见 [REVIEW-2026-11-07.md](REVIEW-2026-11-07.md)。

## 可演进性（2026-11-07）

- 用户要求：开发完成后仍可迭代升级（Codex 接入、远程控制、GUI、架构级替换）。
- 新增 [design/extensibility.md](design/extensibility.md)、[ADR-0007](../docs/adr/ADR-0007-evolvability-contract.md)、任务卡 [X-001](tasks/X-001.md)。
- 核心约束：内核冻结（循环/事件/工具契约）；记忆/项目/协作/网关/沙箱/交互全部插件化；协议与远程控制/GUI 在边缘；状态版本化 + 导出迁移；升级须有契约测试/回放回归/A-B 证据。
- 同步：DESIGN（阅读顺序、模块表、D18）、SCOPE M14、DECISIONS DEC-21、PLAN X-001、HANDOFF 文件地图、README ADR 索引。

## 生命周期与运行时（2026-11-07）

- 用户要求：增加问询阶段（讲清创意）至 任务阶段（删除/改进/功能管理）至 交付阶段（维护）至 迭代（继承加速）；并希望接入工作流/项目运行时（有人提问，智能体自修自测自推送）。
- 新增 [design/lifecycle.md](design/lifecycle.md)、[design/task-paradigms.md](design/task-paradigms.md)、[design/runtime.md](design/runtime.md)。
- 新增 ADR-0008（生命周期与任务范式）、ADR-0009（事件驱动运行时与 Watchdog）；任务卡 Y-001/Z-001/W-001。
- Super-agent 六特性映射：Router/Worker、事件触发、订阅直通、全双工、Watchdog 采纳（P1/P1.5）；存算分离预留 P2。工程执行引入 oh-my-software-engineering（验证器优先、写域、任务卡、门禁、证据）。

## P1 完整度定义（2026-11-07）

- 新增 [design/p1-release.md](design/p1-release.md)：完整度 = 一条窄旅程无断点 + 七界面六态 + 数据往返 + 交付物 8 项。
- P1 范围收窄：记忆只做 MM1、范式只做 research/code、运行时/黑板视图/时间线进 P1.5/P2。
- 新增 SCOPE M18、DECISIONS DEC-25、PLAN R-002（P1 收口与发布）。

## 说明书与图集（2026-11-07）

- 新增 .ome/manual/manual.md 与 README.md，五张 SVG 图（总体架构、生命周期、分层记忆、协作模式、任务数据流）。
- 图 1 采用 vivid-illustration-skill 的 A/B 流程，用户选定候选 B；交付包位于 .ome/manual/vivid/delivery，含原生可编辑 PPTX、SVG 与 PDF。
- 五张图均渲染 PNG 与 PDF，实际查看并修正遮挡与越界。
- 文档去 AI 味：README 与说明书重写；产品文档完成字符级清理（箭头与破折号）。

## 说明书 PDF（2026-11-07）

- manual.md 扩写为十七节，约八千五百字，补充设计原则、模块清单、状态机、任务范式、交接契约、上下文与记忆细节、治理与演进、路线图与风险。
- 新增排版导出：A4 页面、封面、目录（带页码）、章节分页、表格样式、图注、页脚页码；共二十四页。
- 文件：.ome/manual/manual.pdf、manual.md、print/manual.html；图 1 为选定版 B，交付包在 vivid/delivery。

## v1.2 评审修订（2026-11-08）

- 采纳外部评审与工程报告的核心建议：三循环分离、执行账本与幂等、检查点恢复、能力授权、可观测性、P1 收窄为可恢复闭环。
- 新增 [ADR-0010](../docs/adr/ADR-0010-runtime-loops-and-execution-ledger.md) 与五份契约（Project State、Agent Runtime、Context Assembly、Memory Lifecycle、Capability Approval），位于 .ome/contracts。
- 更新 memory（作用域、有效性、保留与真实性分离）、context（不可裁剪项）、tools（能力授权）、projects（标识与循环）、SCOPE M19/M20、DECISIONS DEC-26 至 DEC-28、DESIGN D21/D22、PLAN P-003 与 O-001、P1 发布判据。
- 未采纳：用 LangGraph 替换 Runtime、第一阶段引入 Temporal/A2A、以 Mem0 作为记忆核心、强制 PostgreSQL。
- 说明：外部报告的网络引用未在本环境逐条核验；结论按设计评审采纳，证据等级标为二手。

## v1.2 文档与 PDF（2026-11-08）

- manual.md 更新为 v1.2，补三循环、记忆作用域与有效性、能力授权、恢复与账本判据；PDF 重新排版为 25 页。
- 新增 .ome/contracts 五份契约与 ADR-0010；SCOPE M19/M20、DECISIONS DEC-26 至 DEC-28、DESIGN D21/D22、PLAN P-003 与 O-001、P1 判据同步。
- 新增 .ome/research/10-report-assessment.md，记录外部评审与技术报告的采纳与不采纳结论。

## 文档总升级与 v1.2 收口（2026-11-08）

- README 重做版式，使用品牌横幅、总体架构图、生命周期图与记忆图装饰，正文按 v1.2 重写。
- BRIEF、HANDOFF 重写，DESIGN 更新至 v1.2 并补三个运行循环与契约索引，SPEC 增加 FR-25 至 FR-28。
- 全部项目文档做字符清理，移除箭头、间隔号、直角引号与长破折号；DOC-STYLE 明确禁用字符与替代写法。
- 说明书 v1.2 重新排版为二十五页，目录页码与页脚同步更新。

## 架构图 v1.2（2026-11-08）

- 总体架构图重绘：新增三个运行循环、执行账本、能力网关与可观测性，替换旧版图 1。
- 重新生成 PNG、PDF 与可编辑 PPTX，说明书同步重排为二十五页。
- 仍待更新：任务数据流图尚未画出账本与恢复分支，生命周期图尚未区分交互循环的直达路径。

## 全部图件 v1.2（2026-11-08）

- 生命周期图补交互循环与执行、学习循环说明；数据流图补能力网关、执行账本、幂等键、检查点与恢复分支。
- 记忆图补作用域与有效性；协作图补能力网关与账本约束；总体架构图补三循环、账本、网关与可观测性。
- 说明书同步更新分层职责与 M19、M20，重新排版为二十五页。
