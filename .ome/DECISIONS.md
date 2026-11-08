# DECISIONS ， 决策唯一登记（Panoptic Super）

> 目的：所有"已确认决策"的唯一权威来源。BRIEF §7、ARCH-DECISIONS §8、HANDOFF §3、STATUS 只引用本表，不再各自复制条目。
> 版本：v1.0 ， 2026-11-07 ， 维护者：Lead ， 状态：持续更新（新增决策必须登记）
> 编号规则：**DEC-xx** 为决策；**ADR-xxxx** 为架构决策记录；**D1–D17** 为 DESIGN 中的设计决策（与 ADR 对应）；**M01–M13** 为 SCOPE 模块；**M0–M6** 为协作模式；**M-001…** 为任务卡。

## 1. 编号约定（避免双义）

| 前缀 | 含义 | 示例 |
|---|---|---|
| DEC-xx | 已确认决策（本表） | DEC-05 |
| ADR-xxxx | 架构决策记录 | ADR-0006 |
| D1–D17 | DESIGN 设计决策 | D16 |
| M01–M13 | SCOPE 纳入模块 | M13 |
| M0–M6 | 协作模式 | M2 |
| MM1–MM4 | 记忆子系统里程碑（原 M1–M4，已改名避免与 M1 拓扑混淆） | MM1 |
| M-001 / P-001 / U-001 / G-001 / C-001 | 任务卡编号 | M-001 |

## 2. 决策清单

| ID | 决策 | 状态 | 日期 | ADR/文档 | 影响文档 |
|---|---|---|---|---|---|
| DEC-01 | 指标口径与资源上限现在锁；目标值分档、基线后锁 | 已确认 | 2026-11-07 | BRIEF §4 | BRIEF/SPEC/metrics |
| DEC-02 | 评测集：基线 20 条，P1 出口扩到 30 条 | 已确认 | 2026-11-07 | BRIEF §4、metrics §0 | BRIEF/SCOPE/SPEC/metrics |
| DEC-03 | 定位：按 B（研究 + 代码/文档交付）推进，A 后置 | 已确认（标假设） | 2026-11-07 | BRIEF §3/§6 | BRIEF/SCOPE/SPEC |
| DEC-04 | 形态：开源（MIT）个人工具；无多租户、无计费、无云端账号 | 已确认 | 2026-11-07 | SCOPE §0/§2 | BRIEF/SCOPE/README |
| DEC-05 | 二次开发：基于源码升级（fork 后在本仓库演进，不跟进上游） | 已确认 | 2026-11-07 | ADR-0002 | SCOPE/ARCH/README |
| DEC-06 | LICENSE：MIT（DeepSeek + 山川不念旧双版权） | 已确认 | 2026-11-07 | SCOPE §0 | README/NOTICE |
| DEC-07 | 会话格式不动；项目独立成 storage 域，不写 SessionHeader | 已确认 | 2026-11-07 | ADR-0003 | SPEC/SCOPE/DESIGN |
| DEC-08 | 记忆：五层金字塔 + 标签策略 + 权重/衰减/pin + 睡眠整合 | 已确认 | 2026-11-07 | ADR-0005 | memory/SCOPE M06 |
| DEC-09 | 记忆参数：保守默认 + 影子模式 + P1 前一次小规模标定 | 已确认 | 2026-11-07 | ADR-0005 D4/D7 | memory |
| DEC-10 | 交互：图优先（图谱默认、看板页签、收件箱、产物双视图） | 已确认 | 2026-11-07 | interaction.md | DESIGN/projects/U-001 |
| DEC-11 | 计划确认：默认风险自适应，首次确认一次 | 已确认 | 2026-11-07 | BRIEF §7、projects §3.4 | projects |
| DEC-12 | 模型：BYOK（自填地址与密钥）+ 按角色分层 + 失败升级 | 已确认 | 2026-11-07 | ADR-0004 | SPEC/DESIGN |
| DEC-13 | 沙箱：首版本地隔离（OS 级限制），云沙箱后置 | 已确认 | 2026-11-07 | ADR-0001 D4 调整 | SCOPE/tools |
| DEC-14 | 不记预算、不计量费用；开发完成后以订阅接入 | 已确认 | 2026-11-07 | BRIEF §4、ADR-0004 D4 | 全仓 |
| DEC-15 | 协作演进：三层上下文 + 黑板 + 协调策略层；最小充分范式、按证据升级 | 已确认 | 2026-11-07 | ADR-0006 D1–D5 | evolution/projects/SCOPE M13 |
| DEC-16 | 上下文包（Context Broker）：共享决策、不共享轨迹 | 已确认 | 2026-11-07 | ADR-0006 D6 | context |
| DEC-17 | M2+ 拓扑需自家 pass^k A/B 证据（D9 门槛） | 已确认 | 2026-11-07 | ADR-0006 D9 | ADR/projects/metrics |
| DEC-18 | Run 身份与能力声明（角色/工具白名单/来源/审批人） | 已确认 | 2026-11-07 | ADR-0006 D10 | projects/治理 |
| DEC-19 | 黑板视图是只读投影；操作走命令 + 审计 | 已确认 | 2026-11-07 | ADR-0006 D8、interaction §3.6 | U-003 |
| DEC-20 | 文档审计修复：以 09-project-audit 为清单，P0 全部、P1 关键项已修 | 已确认 | 2026-11-07 | research/09 | 全仓 |
| DEC-21 | 可演进性契约：内核冻结、四层契约、状态可迁移、升级带证据；新功能只加 provider/边缘服务 | 已确认 | 2026-11-07 | ADR-0007、design/extensibility.md | DESIGN/SCOPE M14/PLAN |
| DEC-22 | 四阶段生命周期：问询 至 任务 至 交付 至 迭代；迭代继承已有资产快速重启 | 已确认 | 2026-11-07 | ADR-0008、design/lifecycle.md | SCOPE M15/projects/UI |
| DEC-23 | 任务范式路由：任务类型决定 playbook，规模与证据决定拓扑；六类预置 + 技能包可插拔 | 已确认 | 2026-11-07 | ADR-0008、design/task-paradigms.md | SCOPE M16/PLAN Z-001 |
| DEC-24 | 事件驱动运行时：触发器 + Router/Worker + 订阅直通 + 全双工 + Watchdog；存算分离预留 | 已确认 | 2026-11-07 | ADR-0009、design/runtime.md | SCOPE M17/PLAN W-001 |
| DEC-25 | P1 完整度定义：一条窄旅程无断点、七界面六态齐全、数据可导出可删除、交付物 8 项；范围收窄、闭环做深 | 已确认 | 2026-11-07 | design/p1-release.md | SCOPE M18/PLAN R-002/验收 |
| DEC-26 | 三循环分离（交互、执行、学习）；执行账本与幂等语义；检查点与恢复；第一阶段发布门槛加入崩溃恢复演示 | 已确认 | 2026-11-08 | ADR-0010、contracts/agent-runtime.md | SCOPE M19/PLAN P-003 |
| DEC-27 | 能力授权替代简单读写分级；项目工作区内已授权写可连续执行，越界与不可逆操作审批；权限在可信代码判定 | 已确认 | 2026-11-08 | ADR-0010、contracts/capability-approval.md | tools.md/SCOPE M08 |
| DEC-28 | 第一阶段本地优先存储，PostgreSQL/pgvector 延后；OpenTelemetry 纳入第一阶段 | 已确认 | 2026-11-08 | ADR-0010 D6/D7 | SCOPE M20/PLAN O-001 |

## 3. 未决（不计入已确认）

| ID | 问题 | 责任方 | 备注 |
|---|---|---|---|
| OPEN-01 | 项目与 Git 仓库的关系（一项目一目录？多仓库？） | Lead | projects §15 |
| OPEN-02 | 项目模板是否进 v0.1 | Lead | projects §15 |
| OPEN-03 | 项目数据可移植性边界 | Lead | projects §15 |
| OPEN-04 | 供应商内置预设（v0.1 不做） | 用户 | BRIEF §6 |

## 4. 引用规则

- 新增/修改决策：先改本表，再改受影响文档，最后在 STATUS 追加一行变更记录；
- 任何文档引用"已确认决策"时写 ID（如 DEC-15），不复制正文；
- 决策反悔：状态改"已撤销（日期，原因）"，保留历史行，不删除。
