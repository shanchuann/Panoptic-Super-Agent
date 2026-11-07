# BROWNFIELD-BASELINE ， 二次开发基座现状模型（v0.1）

> 对象：基座仓库 `D:\Code\deepseek-harness`（DeepSeek Harness，DSH；squash 导入至 `D:\Code\SuperAgent`）｜日期：2026-11-05｜2026-11-07 更新
> 状态：**只读勘察 + 基座仓库基线已跑**（2026-11-05，对象为基座仓库）；**本仓库尚未复验**。
> 规则：本文件只记录“看到的事实”，未验证项明确标“未验证”。

## 1. 基座事实（已核）
| 项 | 值 | 证据 |
|---|---|---|
| 路径 | `D:\Code\deepseek-harness` | 目录存在 |
| 版本 | `@deepseek-ai/dsh-root` 0.2.1-rc.3（**开发者预览**，README 明示将有破坏性变更） | `package.json` |
| 许可 | **MIT**，Copyright (c) 2026 DeepSeek | `LICENSE` |
| 运行时 | Node >= 24.9.0；pnpm 11.28.5（Corepack 固定） | `package.json` / `docs/development.zh.md` |
| git | 分支 `master`，HEAD `22ddee3792`（Merge PR #7075），工作区**干净**（porcelain 0 行） | `git status/log` |
| 规模 | `packages/*/*` 共 **363** 个包，另 vendor/native/python/benchmarks/website | 目录统计 |
| 应用 | `apps/cli`（`dsh` bin）、`apps/desktop`、`apps/desktop-host`、`apps/web`、`apps/plugin-market-generator` | `apps/` |
| 架构范式 | 一切皆插件（Cordis）；profile + 组合包 + patch 叠加；无特权内核 | `docs/architecture.zh.md` |
| 品牌规范 | 项目名**不得**直接使用“DeepSeek Harness”商标；可用“基于 DeepSeek Harness 构建”或缩写成 DSH 说明生态关系；不得暗示官方背书 | `BRAND_GUIDELINES.zh.md` |

## 2. 结构地图（按架构文档，未逐包读实现）
```
apps/cli             dsh 启动器（profile 选择：web / headless / sdk / sdk-minimal / acp / desktop）
apps/desktop(-host)  Electron 壳 + 私有 Desktop Host
apps/web             浏览器应用（Vite）
packages/bundle/*    组合包：base / web-app / headless / sdk-app / acp-app / sdk-minimal
packages/core/*      agent / agent-loop / session / tools / system-prompt / scope
packages/llm/*       模型适配器（deepseek / pi-ai / retry / token-meter）
packages/mcp/*       MCP 客户端与资源
packages/fs/*        文件系统提供方 + 沙箱 + 观察策略
packages/sandbox/*   进程/执行隔离
packages/session-query/*  会话浏览、搜索、导出
packages/client/*    60+ 个 Web 客户端 UI 插件（chat、tools、sidebar、settings…）
packages/experimental/*  实验能力（agent-team、computer-use、browser-use…）
vendor/              vendored Cordis
native/              node-addon-system 原生层
python/              Python SDK runtime
benchmarks/  scripts/  门禁与基准
.agents/             agent 工作流与决策笔记（大量历史 ADR 式 note）
docs/                架构、子系统、cookbook（加包/加工具/加 LLM 适配器/加设置页）
```
一句话：**请求从 `dsh` profile 启动 至 插件树装配 至 agent-loop 领输入 至 session 事件落盘 至 工具经 seam 执行 至 Web/Desktop 渲染事件流**。

## 3. 与 ADR-0001 的映射（重要：很多决策基座已经满足）
| 我们的决策 | DSH 对应物 | 二次开发含义 |
|---|---|---|
| D1 单 agent 循环 | `core/agent` + `core/agent-loop`（默认驱动器） | 直接复用；只有要改循环语义才动它 |
| D2 事件日志 append-only | `core/session`：SessionEvent 日志 + JSONL（generation v4） + generation 迁移 | 直接复用；不要绕过 `SessionEventMap` 自建状态 |
| D3 MCP 工具协议 | `mcp/mcp-client` + `core/tools` 注册表 | 发工具走 `ctx.tools` 注册，勿改 loop |
| D4 沙箱 | `sandbox/*`、`fs/fs-sandbox`、`credentials/*` | 复用；凭证已有独立 seam |
| D5 交付面 | `deliverables/*`、`client/ui-deliverables` | 复用 artifact 语义 |
| D6 评测判据 | `benchmarks/`、`test:expected`、`test:snapshot` | 基座有测试基础设施，但**产品级任务评测仍需自建** |
| 多智能体后置 | `experimental/agent-team`（显式启用） | 默认关闭，与调研结论一致 |

## 4. 能跑吗（已验证 ， 2026-11-05）
| 检查 | 命令 | 结果 | 证据 |
|---|---|---|---|
| 依赖已装 | `node_modules/` | 存在（41 个顶层目录） | ， |
| 构建 | `pnpm run build` | **PASS**：10 gates 全过，63.38s | `.ome/evidence/B-001/build.log` |
| 类型检查 | `pnpm run typecheck` | **PASS**：5 gates 全过，16.28s | `.ome/evidence/B-001/typecheck.log` |
| focused 测试 | `pnpm exec vitest run packages/core/session` | **PASS**：20 文件 / 574 用例，2.85s | `.ome/evidence/B-001/test-core-session.log` |
| 起 Web | `pnpm dsh web --no-open` | **PASS**：3080 监听；无 token 401，带 token 302至200；HTML 39KB，title `DSH Local Build`（品牌未替换） | `.ome/evidence/B-001/web.log`、`web-index.html` |
| 全量测试 | `pnpm run test` | 未跑（AGENTS 要求不默认全量，CI 负责） | ， |
| 构建后仓库状态 | `git status --porcelain` | 0 行（构建产物被 ignore，基座源码未被污染） | git |

**结论：基座在本机可构建、可类型检查、可测、可起 Web。基线成立，允许进入内容层重构（R-001..R-004）。**

## 5. 文档可信度（待交叉验证）
- `docs/architecture.zh.md`：与目录结构一致（core/session、agent-loop、mcp、sandbox 均存在）至 暂判可信；
- `AGENTS.md`：给出 CI 口径（`test:coverage` 才是覆盖率门禁，`test` 不是）至 与 `package.json` scripts 一致；
- README 的 `pnpm install / build / pnpm dsh web` 至 未实跑，标“未验证”。

## 6. 风险（开工前必须定）
| # | 风险 | 说明 | 触发信号 |
|---|---|---|---|
| R1 | 上游漂移 | 开发者预览、破坏性变更频繁；fork 后同步成本高 | 上游周更新 >1 次破坏 API |
| R2 | 二次开发方式不清 | **fork 改核心** vs **外挂插件 + 自定义 profile** vs 混合，决定后续一切 | 架构未定 |
| R3 | 品牌/许可 | MIT 允许 fork 与改名，但须保留 LICENSE/版权声明；项目名不得用 DeepSeek Harness 商标、不得暗示背书 | 发布前法务检查 |
| R4 | 体量 | 363 个包、Host/Client 双 aggregate、覆盖率门禁 per-file 100%，改动成本高 | 改核心包需同步大量测试 |
| R5 | 版本锁定 | Node >=24.9、pnpm 11.28.5、原生 addon | 环境不一致导致“我这里能跑” |

## 7. 未做的验证（诚实记录）
- 未在本仓库（`D:\Code\SuperAgent`）复验 B-001..B-004（待 B-005）；
- 未在基座仓库之外的 Windows 原生链路复验；
- 未读各核心包实现（只按架构文档与目录判断）；
- 未核对 `packages/README.md` 与各 bundle 的 `dsh` 字段细节；
- 未验证 Windows 原生链路（node-pty / 原生 addon）是否已就绪。