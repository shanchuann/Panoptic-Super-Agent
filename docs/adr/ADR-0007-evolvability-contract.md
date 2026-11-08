# ADR-0007：可演进性契约（Evolvability Contract）

- 状态：**Accepted**（用户 2026-11-07 要求：开发完成后仍可迭代升级，后续加入 Codex/Claude 类能力、远程控制、GUI 与架构级升级）
- 决策人：用户 ｜ 记录：Lead ｜ 依据：[extensibility.md](../../.ome/design/extensibility.md)、[DESIGN](../../.ome/DESIGN.md)、[06-repo-seams](../../.ome/research/06-repo-seams.md)、[08-agent-architecture-frontier](../../.ome/research/08-agent-architecture-frontier.md)
- 关联：ADR-0001…0006

## 背景

产品是长期演进的个人超级智能体：开发完成后还要加入 Codex 类外部 Agent、Claude 类远程控制与 GUI 操作，以及架构层面的替换（换模型、换记忆后端、换拓扑、换 UI）。若把业务写进 agent-loop、把协议写进核心、把 UI 绑死事件流，后期每次升级都要改内核，成本不可控。

## 决策

### E1 内核冻结、能力插件化

- 内核只保留：Agent 循环、会话事件、工具执行契约、上下文组装钩子；
- 记忆、项目、协作策略、模型网关、沙箱、交互视图均为**插件**，注册即 effect，可独立装卸；
- 业务规则不进入 agent-loop；新增能力通过新插件或 provider，不改循环语义。

### E2 四层契约分级

| 层 | 内容 | 稳定性 |
|---|---|---|
| L0 内核契约 | SessionEvent、Tool execute、agent/pre-step 等 hook | **冻结**：变化必走 ADR + 兼容读端 |
| L1 产品服务 | Memory / Project / Coordination / Context / Gateway | **版本化**：semver + 能力声明 |
| L2 适配器 | 模型、工具、沙箱、存储、记忆后端 | **可替换**：同 seam 多 provider |
| L3 边缘 | MCP/A2A/Codex CLI、Web/桌面/移动 UI、远程控制传输 | **可替换**：协议/视图适配器 |

### E3 协议只在边缘

- MCP、A2A、OpenAI-compatible、Codex CLI 都是 **adapter**，不进入内核数据结构；
- 能力协商 + 版本声明：接入方声明支持的能力，核心按声明选择，不静默降级。

### E4 状态可迁移、可导出

- 会话事件：沿用 DSH V4；新增事件走声明合并 + `ignorable` 语义，不破坏旧读端；
- 业务存储（project/memory）：`defineDomain` 版本号 + 迁移函数；升级必须可演练（dry-run）与回滚；
- 导出/导入格式带版本号；导出包可重建索引；不锁定任何存储后端。

### E5 拓扑与策略可插拔

- 协调策略是 **strategy provider**，模式注册表驱动；新增 M7/新拓扑只注册 provider，不改调度器；
- 上下文包组装是 Broker 策略，可替换（例如换压缩算法/换检索器）；
- 记忆层级与标签策略是数据，不是枚举硬编码：新增类型/子类通过标签注册表扩展。

### E6 功能开关、影子运行与回滚

- 新能力默认 feature flag 关闭；关键替换（新记忆后端、新模型、新拓扑）先 shadow/dual-write 对比；
- 升级路径：开关 至 影子 至 灰度（按项目）至 默认；
- 回滚：保留上一 provider 配置与数据快照；迁移不可逆时先备份。

### E7 升级必须带证据

- 每个 seam 有**契约测试**（provider 替换测试）；
- 架构升级用**回放回归**（录制会话重放）+ pass^k A/B（拓扑类升级按 ADR-0006 D9）；
- 迁移有测试（旧数据 至 新版本 至 读写一致）；
- 无证据的升级不得进默认路径。

### E8 兼容性策略

- L1/L2 契约遵循 semver；破坏性变更提前一个发布周期标记 deprecation；
- 插件 API 分 stable / experimental 两档；experimental 不做兼容承诺；
- 旧数据只增不删：迁移生成新版本文件，不覆盖已发布代。

### E9 外部 Agent 接入（Codex 等）

- 外部 Agent（Codex CLI、其他 Agent SDK）作为 **tool provider 或 subagent provider** 接入：`execute(name, input)` 或 `SubagentProvider`；
- 不把外部 Agent 的事件模型塞进内核；其输出归一化为 `{summary, artifacts, evidence, failures}`；
- 与本地 Run 一样受预算、审批、写域与审计约束。

### E10 远程控制与 GUI 属于边缘能力

- 远程控制 = Host 侧新服务（配对鉴权、命令通道、审计）+ 移动/远程客户端；不改 agent 核心；
- GUI/computer use = tool provider（浏览器/桌面控制包），默认关闭、按项目授权；
- 二者都复用同一套审批、预算、事件与审计。

## 备选与不选

| 备选 | 不选理由 |
|---|---|
| 把新能力直接写进 agent-loop | 每次升级都改内核，回归面不可控 |
| 单一框架绑定（如绑定某 Agent SDK） | 换框架即重写；本项目已基于 DSH 插件体系 |
| 协议进核心数据结构 | MCP/A2A/Codex 演进快，核心会被协议版本绑架 |
| 一次性大重构代替渐进替换 | 风险高、无法回滚；采用 seam + strangler 渐进替换 |
| 只靠文档约定可演进 | 无契约测试与回放，升级必然破坏兼容 |

## 后果与风险

- 收益：新增 Codex/远程控制/GUI/新模型/新拓扑时只加 provider 或边缘服务；内核稳定，回归可测。
- 代价：多一层契约与契约测试维护；provider 拆分带来少量样板代码。
- 风险：契约设计过早固化（缓解：L1 版本化、experimental 档）；provider 过多导致组合爆炸（缓解：能力声明 + 默认组合）；影子运行增加短期成本（缓解：仅关键替换启用）。

## 重议条件

- 某个 seam 连续两次升级都不得不改内核契约（说明分层错误，需重新划分）；
- 外部协议成为事实标准且稳定（可把 adapter 提升为一等契约）；
- 契约测试维护成本超过收益（退回更少的 seam，集中维护）。
