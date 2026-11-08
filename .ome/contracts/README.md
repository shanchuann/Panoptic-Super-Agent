# 契约文档索引

本目录把设计说明书中的关键接口落成可执行契约。实现与测试以这些契约为准，设计说明与 ADR 提供背景。

| 优先级 | 文档 | 约束对象 |
|---|---|---|
| P0 | [project-state.md](project-state.md) | 项目、任务、运行、事件、产物、审批的实体关系与状态迁移 |
| P0 | [agent-runtime.md](agent-runtime.md) | 三个循环、运行生命周期、检查点、取消与幂等恢复 |
| P0 | [context-assembly.md](context-assembly.md) | 上下文来源、预算、优先级、不可裁剪项与溯源 |
| P1 | [memory-lifecycle.md](memory-lifecycle.md) | 记忆的作用域、有效性、写入、冲突、失效与删除 |
| P1 | [capability-approval.md](capability-approval.md) | 能力授权的范围、有效期、审批与审计 |

契约变更需要同步更新对应设计文档、[DECISIONS](../DECISIONS.md) 与测试。