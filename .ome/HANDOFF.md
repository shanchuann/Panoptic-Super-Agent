# 交接说明

## 当前状态

本地项目主对话通过工作区菜单进入，服务会按工作区复用主会话，并恢复计划、明确保存的项目决策和待核对操作。实现范围和用法见 [本地项目主对话](contracts/project-conversation.md)。P1 的其余验收项见 [开发任务计划](PLAN.md)。

## 本轮新增与修改

- [ADR-0010](../docs/adr/ADR-0010-runtime-loops-and-execution-ledger.md)：三循环、执行账本、恢复、能力授权、可观测性、存储与延后项。
- [.ome/contracts](contracts/README.md)：项目状态、Agent Runtime、上下文装配、记忆生命周期、能力授权五份契约。
- [design/memory.md](design/memory.md)：作用域、有效性、保留与真实性分离。
- [design/context.md](design/context.md)：不可裁剪项与压缩保真。
- [design/tools.md](design/tools.md)：能力授权与审批矩阵。
- [DESIGN.md](DESIGN.md) 更新至 v1.2，增加三个运行循环与契约索引。
- [SPEC.md](SPEC.md) 增加 FR-25 至 FR-28。
- [PLAN.md](PLAN.md) 增加 P-003 执行账本与恢复、O-001 可观测性。
- [manual.pdf](manual/manual.pdf) 更新至 v1.2，二十五页。
- [README.md](../README.md) 重做版式，使用品牌图与架构图。

## 文件地图

| 路径 | 作用 | 状态 |
|---|---|---|
| .ome/DECISIONS.md | 决策登记 DEC-01 至 DEC-28 | 已确认 |
| .ome/BRIEF.md | 立项书 | v1.2 |
| .ome/SCOPE.md | 范围与模块 | v0.3，未签字 |
| .ome/SPEC.md | 需求 FR-01 至 FR-28 | v1.3 |
| .ome/PLAN.md | 任务图 | v0.5 |
| .ome/DESIGN.md | 总体设计 | v1.2 |
| .ome/contracts/ | 五份可执行契约 | 新增 |
| .ome/design/ | 十一份子系统设计 | v0.2 至 v0.3 |
| .ome/tasks/ | 十二张任务卡 | 持续更新 |
| .ome/manual/ | 说明书、图集与 PDF | v1.2 |
| docs/adr/ | ADR-0001 至 ADR-0010 | Accepted |

## 下一步

1. 按 [B-005](tasks/B-005.md) 选定开工提交，在独立检出执行 `pnpm install --frozen-lockfile`，接着跑类型、构建与无密钥启动回归。
2. 做 [P-001](tasks/P-001.md) 首段，验证建项、建任务、进程重启读回。这个结果允许 [CL-001](tasks/CL-001.md) 在腾讯云用合成任务验证持久化。
3. 做 [P-003](tasks/P-003.md) 的单文件执行、重启与取消，随后接 U-001 的首个项目任务场景。通过本地写入恢复验收后再做 [CL-002](tasks/CL-002.md)。
4. Instabox 先查余量，再选做单 worker Linux 回归。用独立检出，原有服务继续运行。

## 接手规则

先读 [README.md](../README.md) 与 [DESIGN.md](DESIGN.md)，再读 [contracts](contracts/README.md) 与相关 ADR。改代码前确认写域与契约，改设计前先改 [DECISIONS.md](DECISIONS.md)。任何对外可见的行为变化都要留下测试或证据，没有证据的完成不算完成。
