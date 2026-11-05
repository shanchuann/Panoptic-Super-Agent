# STATUS — 项目状态

- 当前阶段：**P0 收尾**（调研/规格/评测/交接包完成；等待用户定定位）
- 日期：2026-11-05
- 仓库：D:\Code\SuperAgent（git 已初始化，main）
- 本轮完成：
  - T-001 一手核实：NVD 156 条已核、SWE-bench Pro 23.3%、OSWorld 2.0（108 任务/1.6h/318 calls/20.6%）已核；长程时长、SDK 许可、定价标「无法核实」
  - `.ome/SPEC.md`：FR-01..FR-12 + NFR-01..07 + 事件 schema v1 + CLI 契约 + 追溯矩阵
  - `docs/adr/ADR-0001-harness-architecture.md`：D1–D6 六条决策（Proposed）
  - `.ome/evals/tasks.jsonl`：20 条 held-out（14 条 <45m、6 条 45–163m）；校验 PASS（`.ome/evidence/T-003/validate.log`）
  - `.ome/tasks/T-002.md`、`T-005.md`：任务卡（T-002 阻塞等用户；T-005 为 P1 第一枪）
  - `.ome/HANDOFF.md` v1.1 + 冷启动测试**通过**（`.ome/evidence/T-008/cold-start.md`）
- 待用户回答（4 项，见 HANDOFF §4）：① 定位 A/B/C 与主场景；② 交付形态；③ ADR-0001 确认；④ 五项指标阈值确认
- 下一步：T-002 签字 → ADR 确认 → T-005 纵向切片（P1）

## 交付物一致性检查
| 项 | 状态 |
|---|---|
| 代码 | 仅校验脚本 `scripts/validate-evals.mjs`（P0 工具，已验证 PASS） |
| 文档 | BRIEF/FACTS/SCOPE/SPEC/PLAN/HANDOFF/STATUS + 3 份调研 + 1 份综合 + ADR |
| 截图 | 无 |
| 部署 | 无 |
| 版本号 | v0.0.4-p0-handoff |
