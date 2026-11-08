# 交接说明

## 当前状态

设计 v1.2 已确认，P1 处于开工准备。基座仓库的构建、类型检查与聚焦测试已通过，本仓库的复验任务 B-005 尚未执行。客户端品牌替换已经完成，产品功能代码尚未开始。

v1.2 相对 v1.1 的变化集中在运行模型与边界。三个循环分离，执行账本与检查点进入设计，能力授权替代简单读写分级，记忆增加作用域与有效性，P1 收敛为可恢复闭环。

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

1. 执行 B-005，拿到本仓库的构建、类型检查与聚焦测试证据。
2. 做 P1a 纵切：建项、问询、单任务执行、产物、节点详情、导出。
3. 写 P-003 执行账本与恢复的最小实现，先覆盖文件写入与外部请求两类副作用。
4. 建立恢复演示：修改文件、杀进程、重启、恢复、继续、验证，检查副作用是否重复。
5. 补契约测试，至少覆盖非法状态迁移、越权写入、重复幂等键与上下文裁剪。

## 接手规则

先读 [README.md](../README.md) 与 [DESIGN.md](DESIGN.md)，再读 [contracts](contracts/README.md) 与相关 ADR。改代码前确认写域与契约，改设计前先改 [DECISIONS.md](DECISIONS.md)。任何对外可见的行为变化都要留下测试或证据，没有证据的完成不算完成。
