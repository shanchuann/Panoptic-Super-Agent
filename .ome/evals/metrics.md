# 评测口径：五项指标与 pass^k（v0.1）

> 配套：`.ome/evals/tasks.jsonl`（20 条 held-out）、SPEC §3 NFR、ADR-0001 D6

## 1. 五项指标
| 指标 | 定义 | 计算 | v0.1 目标（假设，待确认） |
|---|---|---|---|
| 任务成功率 | 交付物通过人工判据的任务占比 | passed / total | ≥60% |
| pass^3 | 同一任务连续 3 次全部通过的比例（可靠性，不是最好成绩） | 3 次全过任务数 / total | ≥50% |
| 人工接管率 | 需人介入（审批之外）才能继续的任务占比 | taken_over / total | ≤20% |
| 单任务成本 | 模型 + 沙箱 + 工具费用（含重试） | Σ costCny / total | ≤¥2 均值，¥10 硬上限 |
| P95 完成时长 | 从 run 到 artifact 完成，按时长分档统计 | p95(durationMs) | 分档报，不报总平均 |

## 2. 报告格式（report.json）
```json
{ "runId": "...", "set": "tasks.jsonl", "k": 3, "startedAt": "...",
  "summary": { "successRate": 0.0, "passK": 0.0, "humanTakeoverRate": 0.0,
               "avgCostCny": 0.0, "p95DurationMs": 0 },
  "byDurationBand": { "<45m": {}, "45-163m": {}, ">163m": {} },
  "tasks": [ { "id": "TASK-001", "runs": [ { "ok": true, "costCny": 0.3, "durationMs": 120000 } ] } ],
  "failures": [ { "id": "TASK-014", "reason": "缺来源链接", "evidence": "..." } ] }
```

## 3. 判分规则
- 判据以 tasks.jsonl 的 `criteria` 为准，逐条二元判定；缺一条即失败；
- 涉及脚本的判据优先用脚本判定（verifier=script/script+human），人工只判风格/完整性；
- 同一任务 3 次跑完才算 pass^3；中途人工接管按失败计（但单列接管率）；
- 失败必须归因到类别：规划 / 工具 / 上下文 / 验证 / 超时 / 成本 / 安全。

## 4. 反作弊
- 任务集不得在 prompt 里泄露实现细节或期望输出；
- 每次评测前重跑基线（防止模型/工具变化漂移）；
- 保留 held-out 子集（≥30%）不参与日常调参。
