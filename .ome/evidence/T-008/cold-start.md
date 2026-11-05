# T-008 冷启动测试记录

- 日期：2026-11-05
- 方法：独立子代理（零共享上下文）只读 `.ome/HANDOFF.md`、`.ome/STATUS.md`、`.ome/PLAN.md`，回答 A 阶段 / B 下一步 / C 阻塞 / D 文档矛盾。
- 时限口径：HANDOFF 要求「30 分钟内能答对」；实际一次往返完成。

## 子代理结论（摘录）
- A 阶段：P0 收尾，未进 P1（依据 STATUS:3、PLAN:4、PLAN 门禁四项未勾、HANDOFF:4）。
- B 下一步：① 用户定 A/B/C + 交付形态并回填 SCOPE 签字行；② ADR-0001 → Accepted、A-01..A-08 与阈值改「已确认」；③ 校验评测集 PASS 后开 T-005（`src/cli/` 抓 3 URL → 报告 + trace，证据入 `evidence/T-005/`）。
- C 阻塞：SCOPE 未签 + 两个阻塞问题无答复；决策人＝用户。
- D 矛盾（4 条）：HANDOFF 遗留 T-001/T-003 待办；HANDOFF 待决漏 ADR 与阈值；文件地图漏 `evidence/`；「P0 末/收尾」「调研份数」表述不一致。

## 判定
**通过**（正确识别阶段、下一步与阻塞点）。发现的 4 处文档不一致已于 HANHDOFF v1.1 修复。

## 修复项
1. 删除「T-001 收尾」等过期待办，改为已完成说明；
2. §4 待决补 ADR 确认、阈值确认（4 项）；
3. 文件地图补 `.ome/evals/`、`.ome/evidence/`、`.ome/tasks/`、`scripts/`；
4. 统一为「P0 收尾」「3 份调研 + 1 份综合」。
