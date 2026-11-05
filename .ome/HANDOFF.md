# HANDOFF — 万象超级智能体（Panoptic Super）

## 1. 30 秒现状
**P0 · 基座已接、架构待定、开发暂停**。
- 产品：万象超级智能体 / Panoptic Super（释义与品牌见 BRIEF §0）；
- 基座：DeepSeek Harness（MIT，v0.2.1-rc.3，HEAD `22ddee3792`，`D:\Code\deepseek-harness`）；
- 已做：调研、P0 文档、DSH 只读勘察、品牌与许可核对；
- 未做：任何构建/测试/代码改动（用户要求等架构）。

## 2. 文件地图
| 路径 | 作用 |
|---|---|
| `.ome/BRIEF.md` | 立项书：身份/释义/logo/基座、目标、成功指标、kill criteria |
| `.ome/ARCH-DECISIONS.md` | **等用户填的架构决策清单**（6 类），填完才开工 |
| `.ome/BROWNFIELD-BASELINE.md` | 基座现状模型：事实/结构/ADR 映射/风险/未验证项 |
| `.ome/FACTS.md` | 事实清单（含 F-18..F-24 基座事实）+ 假设值 |
| `.ome/SCOPE.md` | 范围、排除、基座与法务边界、签字状态 |
| `.ome/SPEC.md` | 需求规格/事件 schema/CLI 契约/追溯矩阵（待按 DSH 扩展点重写接口节） |
| `.ome/PLAN.md` | 任务图 T-001..T-008 + B-001..B-004 基线任务 |
| `.ome/research/` | 3 份调研 + 综合（D1–D6） |
| `.ome/evals/` | 20 条 held-out + 指标口径 |
| `docs/adr/ADR-0001-*.md` | 六条架构决策（与基座映射见 BROWNFIELD-BASELINE §3） |
| `Panoptic Super logo.png` | 品牌 logo（713×509） |

## 3. 常用命令
```powershell
node scripts/validate-evals.mjs .ome/evals/tasks.jsonl
git log --oneline
# 基座（放行后才跑）：
# cd D:\Code\deepseek-harness ; pnpm run build ; pnpm run typecheck ; pnpm dsh web --no-open
```

## 4. 待决（阻塞开工，决策人＝用户）
1. 架构输入：二次开发方式（fork / 外挂插件+profile / 混合）、形态、超阶能力落点、复用替换、上游同步 → 填 ARCH-DECISIONS；
2. 定位 A/B/C 与主场景（BRIEF §3）；
3. 五项指标阈值确认（metrics.md）。

## 5. 下一步
架构输入 → ADR-0002（二次开发方式）→ B-001..B-004 基线 → 扩展点映射 → T-005 纵向切片。

## 6. 冷启动测试
新会话只读本文件 + STATUS + PLAN + ARCH-DECISIONS，应能答出：现在什么阶段？为什么不开发？下一步等什么？

## 7. 当前暂停点（2026-11-05）
- 基座代码已 squash 导入并推送；本仓库已由用户完成 `pnpm install` 与运行（用户报告，未复验）。
- **暂停开发**，等待用户设计文档（记忆存储 / 模型调用 / 会话管理 / UI / 其他）。
- 收到设计文档后的顺序：① 通读并映射到 DSH 扩展点（插件/profile/patch）；② 落 ADR + 任务卡（含可执行判据）；③ 按写域单线程实施；④ 每个任务留证据。
