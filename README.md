# 万象超级智能体 · Panoptic Super

> 万象超级智能体，以全维观照之心，推演世间万象。
> 遍观万有，推演万象。

**Panoptic Super** 是一个通用超级智能体：模型自行掌管对话、长时序规划、跨领域工具面、长时记忆与多模态配置，不再区分 Coding / Chat / Work。它基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（MIT）二次开发，保留其成熟的功能与界面，重构内容层。

## 当前状态

**P1 启动**：基座基线已验证通过（构建 / 类型检查 / focused 测试 / Web 冒烟），架构决策已落档；内容层重构（记忆 / 模型调用 / 会话管理）尚未开始。

| 基线项 | 结果 |
|---|---|
| `pnpm run build` | 10 gates PASS，63.38s |
| `pnpm run typecheck` | 5 gates PASS，16.28s |
| `pnpm run test`（focused: core/session） | 574 用例 PASS |
| `pnpm dsh web` | 3080 端口，token 鉴权 200 |

详见 [`.ome/STATUS.md`](.ome/STATUS.md)、[`.ome/BROWNFIELD-BASELINE.md`](.ome/BROWNFIELD-BASELINE.md)。

## 产品路线

1. **P1 Web**：确认界面与基本功能（会话 / 任务 / 工具 / 插件 / 交付物）；
2. **P2 桌面**：Windows / macOS / Linux 客户端；
3. **P3 移动端**：App 远程控制桌面客户端（单独立项做安全设计）。

## 「超」的落点

模型自行掌管对话 · 持续迭代交付升级 · 插件 · 长时记忆 · 多模态配置 · 长时序规划 · 跨领域工具面 · 不区分 Coding/Chat/Work。

扩展点映射见 [ADR-0002](docs/adr/ADR-0002-fork-refactor-and-product-roadmap.md)。

## 仓库结构

```
.ome/               项目治理：立项/范围/规格/计划/状态/交接、调研、评测集、证据
docs/adr/           架构决策记录（ADR-0001 六条架构决策、ADR-0002 二次开发与路线）
scripts/            仓库级工具（评测集校验）
Panoptic Super logo.png   品牌标识
```

> 基座代码（`packages/`、`apps/` 等）暂未导入本仓库；导入方式见 `.ome/STATUS.md` 与 ADR-0002（保留上游历史）。

## 文档索引

- [立项书](.ome/BRIEF.md) · [范围](.ome/SCOPE.md) · [需求规格](.ome/SPEC.md) · [任务图](.ome/PLAN.md)
- [基座现状模型](.ome/BROWNFIELD-BASELINE.md) · [架构决策 ADR-0002](docs/adr/ADR-0002-fork-refactor-and-product-roadmap.md)
- [调研综合](.ome/research/00-synthesis.md)（3 份调研 + 一手核验）

## 许可

本项目采用 MIT 许可，见 [LICENSE](LICENSE)。基于 DeepSeek Harness（MIT，Copyright (c) 2026 DeepSeek）构建；导入基座代码后将保留其版权声明与第三方依赖通告。
