# 可演进性设计：让 SuperAgent 在开发完成后仍能升级

> 状态：设计草案 ， 2026-11-07 ， 上位：[.ome/DESIGN.md](../DESIGN.md)、[ADR-0007](../../docs/adr/ADR-0007-evolvability-contract.md)
> 目标：新增 Codex/Claude 类能力、远程控制、GUI、架构级替换时，**不改内核**，只加 provider 或边缘服务。

## 0. 结论先行

可演进不是"多留接口"，而是四条纪律：

1. **内核冻结**：循环、事件、工具契约不动；业务全在插件；
2. **四层契约**：内核（冻结）/ 服务（版本化）/ 适配器（可换）/ 边缘（可换）；
3. **状态可迁移**：schema 版本 + 迁移 + 导出导入 + 回滚；
4. **升级有证据**：契约测试 + 回放回归 + pass^k A/B（拓扑类）。

## 1. 分层与扩展点

```text
L3 边缘     Web/桌面/移动 UI ， MCP/A2A/Codex 适配 ， 远程控制传输
L2 适配器   模型 ， 工具 ， 沙箱 ， 存储 ， 记忆后端 ， 浏览器/桌面控制
L1 服务     记忆 ， 项目 ， 协作策略 ， 上下文包 ， 网关 ， 治理
L0 内核     Agent 循环 ， 会话事件 ， 工具执行契约 ， 组装钩子（冻结）
```

| 扩展点 | 契约形态 | 新增方式 | 升级影响 |
|---|---|---|---|
| 模型供应商 | `LlmAdapter` + 网关 `resolve()` | 新 adapter 包 + 配置 | 不改内核 |
| 工具 | `ctx.tools.register` + execute | 新工具包 / MCP server | 不改内核 |
| 沙箱 | sandbox provider | 新 provider 包 | 不改内核 |
| 记忆后端 | MemoryService provider（storageDomain 实现） | 新 provider | L1 迁移 |
| 记忆类型/层级 | 标签注册表（type 至 策略） | 注册新标签 | 数据扩展 |
| 项目/任务 | project service | 新字段/新表走域版本 | L1 迁移 |
| 协作策略 | coordination strategy provider | 注册新模式 | 不改调度器 |
| 上下文组装 | Broker 策略 | 替换压缩/检索策略 | 不改内核 |
| 交互视图 | Client 插件（投影） | 新视图/新客户端 | 不改服务 |
| 协议（MCP/A2A/Codex） | adapter | 新 adapter | 不改内核 |
| 远程控制 | Host 服务 + 配对鉴权 + 审计 | 新服务 + 客户端 | 不改内核 |
| GUI/computer use | tool provider（浏览器/桌面包） | 新工具包，默认关闭 | 不改内核 |

## 2. 未来功能怎么落位

| 未来功能 | 落位 | 需要改核心吗 | 备注 |
|---|---|---|---|
| Codex 接入 | Tool provider 或 SubagentProvider（CLI 适配） | 否 | 输出归一化为 summary/artifacts/evidence/failures |
| Claude 类远程控制 | Host 服务：配对鉴权 + 命令通道 + 审计 + 移动客户端 | 否 | 复用审批/预算/事件 |
| GUI / computer use | tool provider（browser-use/computer-use） | 否 | 默认关闭，按项目授权 |
| 新模型/新多模态 | model adapter + 能力声明 | 否 | BYOK 配置即可 |
| 新记忆后端 | MemoryService provider + 迁移 | 否（数据迁移） | 影子/双写验证 |
| 新协作拓扑 | coordination strategy provider | 否 | D9 A/B 门槛 |
| A2A 互操作 | protocol adapter | 否 | 只对齐词表与 AgentCard |
| 换 UI/多端 | Client 插件 + projection wire | 否 | 服务层不变 |

## 3. 版本与兼容

| 对象 | 版本方式 | 兼容承诺 |
|---|---|---|
| 会话事件 | DSH `SESSION_FORMAT_VERSION`（当前 4） | 新事件走声明合并 + `ignorable`；旧读端可跳过 |
| 业务存储域 | `defineDomain({version})` + 迁移函数 | 升级生成新版本；不覆盖已发布数据 |
| 导出格式 | `exportVersion` | 新版本可被旧版本拒绝并提示升级 |
| 插件 API | semver + stable/experimental | stable 破坏性变更提前一个周期弃用 |
| 协议 adapter | 能力声明 + 版本 | 协商失败明确报错，不静默降级 |

## 4. 升级流程（每次架构级替换）

```text
1. 定义/更新契约（L1 或 L2）与契约测试
2. 新 provider 实现 + 单元/契约测试
3. shadow / dual-write（只记录不切换）
4. 回放回归（录制会话重放，对比输出）
5. pass^k A/B（拓扑/记忆类升级按 ADR-0006 D9）
6. feature flag 灰度（按项目）
7. 默认启用；保留上一 provider 与数据快照用于回滚
8. 记录迁移报告与回滚步骤
```

## 5. 反模式（评审必查）

| 反模式 | 后果 | 正确做法 |
|---|---|---|
| 在 agent-loop 里加业务分支 | 每次升级改内核 | 新插件/hook |
| UI 直读会话事件结构 | 事件一变 UI 全崩 | 只读 projection |
| provider 类型泄漏到内核 | 换 provider 要改核心 | 内核只认 L0 契约 |
| 硬编码模型名/协议/端口 | 换供应商/协议要改代码 | 配置 + adapter |
| 全局单例/模块级缓存 | 升级与测试互相污染 | 服务/实例持有状态 |
| 模式枚举写死 | 加新模式要改调度器 | strategy 注册表 |
| 只写文档不写契约测试 | 升级时才发现破坏兼容 | 每个 seam 一个契约测试 |
| 数据格式私有且不可导出 | 换后端即丢数据 | 可导出 + 可重建索引 |

## 6. 升级演练（验收）

| 演练 | 通过标准 |
|---|---|
| 替换记忆后端 | 不改 memory 服务代码，仅换 provider；导出/导入后 Recall 掉点 ≤5pp |
| 换模型供应商 | 只改网关配置；契约测试通过；回放回归无退化 |
| 新增协作模式 | 只注册 strategy；调度器零改动；契约测试通过 |
| 新增工具/MCP server | 只注册工具；内核零改动 |
| 新增远程控制客户端 | 复用 Host 服务；鉴权/审计用例通过 |
| 新增 GUI 工具 | 仅注册 tool provider；默认关闭、按项目授权 |

## 7. 与现有设计的关系

- 本文件是 [evolution.md](evolution.md) 的工程化落地：演进方向回答"往哪走"，本文件回答"怎么保证走得动"；
- 内核冻结与 DSH 插件体系（[06-repo-seams](../research/06-repo-seams.md)）一致；
- 升级证据与 ADR-0006 D9、metrics §8 一致；
- 任务：[X-001](../tasks/X-001.md) 承接本文件。
