# HANDOFF — 交接说明（P0 收尾）

## 1. 30 秒现状
超级智能体项目，目前 **P0 收尾**：调研、立项/范围/规格草案、评测集、任务图、ADR 已完成；等待用户确认定位后进入 P1。尚无产品代码。
仓库：`D:\Code\SuperAgent`，git 已初始化，分支 main，最新提交见 `git log --oneline`。

## 2. 文件地图
| 路径 | 作用 |
|---|---|
| `.ome/BRIEF.md` | 立项书：为什么做、成功指标、kill criteria |
| `.ome/FACTS.md` | 事实清单（已核/二手/无法核实）+ 假设值 A-01..A-08 + T-001 核验结论 |
| `.ome/SCOPE.md` | 纳入 M01–M10、排除清单（三件套）、边界、签字状态 |
| `.ome/SPEC.md` | 需求规格：FR-01..FR-12 / NFR-01..07 / 事件 schema v1 / CLI 契约 / 追溯矩阵 |
| `.ome/PLAN.md` | 任务图 T-001..T-008（状态/判据/写域/验证器/依赖） |
| `.ome/HANDOFF.md` | 本文件 |
| `.ome/STATUS.md` | 当前阶段、下一步、交付物一致性 |
| `.ome/tasks/T-002.md`、`T-005.md` | 任务卡（11 字段；T-002 等用户，T-005 P1 第一枪） |
| `.ome/research/00-synthesis.md` | 调研综合：D1–D6 决策、MVP 清单、冲突数字 |
| `.ome/research/01–03` | 架构 / 能力 / 评测三份调研（79 条证据） |
| `.ome/evals/tasks.jsonl` | 20 条 held-out 评测任务（含人工判据） |
| `.ome/evals/metrics.md` | 五项指标与 pass^3 口径、report.json 格式 |
| `.ome/evidence/` | 任务证据（T-003 校验日志、T-008 冷启动记录） |
| `docs/adr/ADR-0001-*.md` | 六条架构决策（D1–D6） |
| `scripts/validate-evals.mjs` | 评测集格式校验（Node 20+） |

## 3. 常用命令
```powershell
# 校验评测集（本机 node v24.9.0 可用）
node scripts/validate-evals.mjs .ome/evals/tasks.jsonl
# 看历史
git log --oneline
```

## 4. 待决（阻塞进入 P1，决策人＝用户）
1. 定位 A/B/C 与主场景（BRIEF §3；T-002）；
2. 交付形态 Web / CLI / 桌面（假设 Web+CLI，A-02）；
3. ADR-0001 六条决策确认（Proposed → Accepted）；
4. 五项指标阈值确认（BRIEF §4 / metrics.md，当前为假设值）。

## 5. 下一步（按顺序）
T-002 签字 → ADR-0001 确认 → T-003 评测集人工复核（20 条判据是否可判）→ T-005 纵向切片（CLI 端到端，判据见 `.ome/tasks/T-005.md`）→ T-006 pass^3 报告 → T-007 安全用例 → T-008 交接更新。
（T-001 已完成：FACTS §3 有核验结论；无法核实项已显式标注，不再阻塞。）

## 6. 冷启动测试（2026-11-05 已执行）
新会话只读本文件 + `.ome/STATUS.md` + `.ome/PLAN.md`，回答「现在什么阶段？下一步命令？卡在哪？」。
结果：**通过**（正确指出 P0 收尾、3 条下一步、卡在 SCOPE 未签与用户决策）；同时发现 4 处交接文档不一致，已修复。
记录：`.ome/evidence/T-008/cold-start.md`。
