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
packages/           DSH 基座包（363 个，@deepseek-ai/dsh-*）
apps/               cli / desktop / desktop-host / web / plugin-market-generator
vendor/ native/ python/ benchmarks/ website/ patches/   基座配套
docs/               DSH 文档 + docs/adr/（本项目 ADR）+ docs/upstream/（基座 README 存档）
.ome/               项目治理：立项/范围/规格/计划/状态/交接、调研、评测集、证据
scripts/            DSH 门禁脚本 + 评测集校验（validate-evals.mjs）
AGENTS.md           基座贡献规范（随代码导入，后续按本项目需要调整）
Panoptic Super logo.png   品牌标识
```

> 基座代码已以 **squash** 方式导入（基座 `22ddee37`，上游历史未并入，见 [NOTICE](NOTICE)）；本项目不跟进上游更新。

## 文档索引

- [立项书](.ome/BRIEF.md) · [范围](.ome/SCOPE.md) · [需求规格](.ome/SPEC.md) · [任务图](.ome/PLAN.md)
- [基座现状模型](.ome/BROWNFIELD-BASELINE.md) · [架构决策 ADR-0002](docs/adr/ADR-0002-fork-refactor-and-product-roadmap.md)
- [调研综合](.ome/research/00-synthesis.md)（3 份调研 + 一手核验）

## 许可

本项目采用 MIT 许可，见 [LICENSE](LICENSE)（双版权：DeepSeek + 山川不念旧）。基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（MIT）构建，来源与导入方式见 [NOTICE](NOTICE)，第三方依赖通告见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
