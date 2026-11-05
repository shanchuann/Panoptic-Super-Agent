# HANDOFF — 交接说明（P0 末）

## 1. 30 秒现状
超级智能体项目，目前 **P0（立项/范围/规格草案完成，待用户确认定位）**。无产品代码；已有调研 3 份、综合 1 份、SPEC/ADR/评测集/任务图。
仓库：`D:\Code\SuperAgent`，git 已初始化，分支 main。

## 2. 文件地图
| 路径 | 作用 |
|---|---|
| `.ome/BRIEF.md` | 立项书：为什么做、成功指标、kill criteria |
| `.ome/FACTS.md` | 事实清单（含已核/待核/无法核实）+ 假设值 A-01..A-08 |
| `.ome/SCOPE.md` | 纳入 M01–M10、排除清单（三件套）、边界、签字状态 |
| `.ome/SPEC.md` | 需求规格：FR-01..FR-12 / NFR / 事件 schema / CLI 契约 / 追溯矩阵 |
| `.ome/PLAN.md` | 任务图 T-001..T-008（判据/写域/验证器/依赖） |
| `.ome/research/00-synthesis.md` | 调研综合：D1–D6 决策、MVP 清单、冲突数字 |
| `.ome/research/01–03` | 架构 / 能力 / 评测三份调研（79 条证据） |
| `.ome/evals/tasks.jsonl` | 20 条 held-out 评测任务（含人工判据） |
| `.ome/evals/metrics.md` | 五项指标与 pass^3 口径、报告格式 |
| `docs/adr/ADR-0001-*.md` | 六条架构决策（D1–D6） |
| `.ome/STATUS.md` | 当前阶段、下一步、交付物一致性 |

## 3. 常用命令
```powershell
# 校验评测集格式（Node 路径见 DSH load_workspace_dependencies）
node scripts/validate-evals.mjs .ome/evals/tasks.jsonl
# 查看任务板
git log --oneline
```

## 4. 待决（阻塞开工）
1. 定位 A/B/C 与主场景（BRIEF §3）；
2. 交付形态 Web/CLI/桌面（假设 Web+CLI）。

## 5. 下一步（按顺序，均已写成任务卡判据）
T-002 签字 → T-001 收尾（FACTS 待核项）→ ADR-0001 确认 → T-003 评测集复核 → T-005 纵向切片（CLI 端到端）→ T-006 pass^3 报告 → T-007 安全用例 → T-008 交接。

## 6. 冷启动测试（每次交接前做）
新会话只读本文件 + `.ome/STATUS.md` + `.ome/PLAN.md`，回答：现在什么阶段？下一步命令是什么？卡在哪？——30 分钟内能答对即通过。
