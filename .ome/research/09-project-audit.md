# 09 ， 项目文档全量审计（Panoptic Super）

> 审计对象：`D:\Code\SuperAgent` 的 `.ome/`（BRIEF/SCOPE/SPEC/PLAN/DESIGN/STATUS/HANDOFF/ARCH-DECISIONS/FACTS/BROWNFIELD-BASELINE、design/、tasks/、evals/、research/）、`docs/adr/ADR-0001…0006`、`README.md`。
> 快照：2026-11-07 20:15（Asia/Shanghai）；git HEAD `ae4e9e7b`，工作区 dirty（17 个文档已修改、10 个未跟踪）。审计期间 Lead 正在并发编辑核心文档，**行号以该快照为准**；修复前先按“问题”列关键词定位，不要只信行号。
> 方法：逐份通读 + 脚本校验（49 个文件 210 条本地链接与锚点、标识符盘点、评测集 JSON 校验；其中 5 条断链见 P1）+ 仓库事实抽查（git log、GitHub issue #59 / PR #60、`.github/workflows/ci.yml`）。只读审计，除本文件外未改动任何文件。

## 0. 结论摘要

- **总问题数 79 条**：P0 21 条、P1 44 条、P2 14 条（P0 编号 1–21，P1 从 22 起，P2 从 66 起）。
- **结构健康度：良好（B）。** 文档体系完整（立项至范围至规格至计划至总体设计至6 份子系统至6 份 ADR至9 份调研（00–08）至9 张任务卡至评测集至证据），编号连续，本地链接除 ADR-0006 一处外全部可达，ADR/任务卡/证据目录三层对应关系成形，评测集 20 条齐全且校验 PASS。
- **最大风险在“状态层”而不是“内容层”**：BRIEF/SCOPE/SPEC/DESIGN 的决策内容基本自洽，但 STATUS、HANDOFF、README、PLAN 仍混用多轮决策前的状态（基线在基座仓库验证、品牌未动、P0 收尾、M01–M12），冷启动会话会据此做出错误下一步。
- **五类系统性问题**：① 决策登记不唯一（6/12/13/17 四套计数）；② “不计量费用”在被删后仍残留在 4 处类型契约与评测集字段；③ 协作拓扑在 D1/§4.3 与 D16/§4.4/ADR-0006 之间自相矛盾；④ 评测集的规模（20/30）、分档（<45m vs <15m）与报告键脱节；⑤ SPEC 的事件模型与“复用 DSH 会话事件”的架构决策冲突。
- **研究索引已补齐**：`research/` 现有 00–06 与 07/08（并发产出）、本文件 09，并新增 `research/README.md`；审计时 07/08 刚落地，其结论尚未被 BRIEF/DESIGN 引用（后续需补引用或标注不改结论）。

### 建议修复顺序

1. 先修 P0 中的“状态与证据”6 条（#1–#6）：STATUS/HANDOFF/README/PLAN 统一阶段、基线来源与品牌状态；这是所有后续文档的引用基线。
2. 再修 P0 中的“成本字段”4 条（#8–#12）：一次提交清掉 SPEC/interaction/projects/tools/tasks.jsonl 的金额字段，并加评测集校验。
3. 再修 P0 中的“决策登记”与“拓扑”5 条（#13–#17）：建立唯一决策表，统一 D1 与 D16、SCOPE 排除项与 M13。
4. 最后修“评测口径”与“事件模型”4 条（#18–#21）：20/30、分档、五项指标、SPEC §4 与 DSH 事件的关系。
5. P1 按表逐条处理；P2 可在 P1 文档同步批次里一并清理。


## 1. P0 问题（决定口径、证据或架构，先修）

| # | 级别 | 文件:行 | 问题 | 建议修复 | 责任方 |
|---|---|---|---|---|---|
| 1 | P0 | `.ome/STATUS.md:10` | 同一文件自相矛盾：断言 B-001..B-004“全部通过”，但第 41 行注明基线是在 `D:\Code\deepseek-harness` 验证、本仓库尚未重跑；README 基线表与 SPEC §9 据此把基线标为已完成，等于把未在本仓库复验的证据当结论。 | 在“已完成”表加“证据来源仓库”列；本仓库复验前统一写“基座仓库已验证 / 本仓库未复验”，并同步 README 基线表与 SPEC §9 勾选状态。 | Lead |
| 2 | P0 | `README.md:10` | 公开 README 声称“产品代码尚未改动”，但品牌替换已由 PR #60（issue #59 已关闭）落地，`.ome/evidence/branding/validation.md` 记录 26+15+49 个用例与 16+8 份快照更新，STATUS 也写“已完成品牌聚焦测试”；HANDOFF §1“未做：任何产品代码改动”同错。对外当前状态失真。 | 改为“基座已导入并完成品牌替换（issue #59 / PR #60、#63）；记忆、项目、协作等产品能力尚未开工”，并链 `.ome/evidence/branding/`。 | Lead |
| 3 | P0 | `.ome/STATUS.md:3` | 与 HANDOFF“P1 可开工”、PLAN 全部落地任务“待开始”、README“产品代码尚未改动”冲突；阶段口径决定下一步动作。 | 统一为“P1 准备/开工（设计已确认；品牌替换已完成；产品功能未开工）”，HANDOFF/README/PLAN 引用同一句。 | Lead |
| 4 | P0 | `.ome/HANDOFF.md:15` | 冷启动入口的文件地图整表过期：BRIEF 已是 v0.3/12 项决策；同表还有 SCOPE“M01–M12”（缺 M13）、design“五份子系统设计”（实为 6 份，缺 evolution）、research“00–06”（缺 07–09）、tasks 仅 4 张卡（实为 6 张，缺 C-001/U-003）、ADR“0001…0005”（缺 0006）、evals“指标口径 v0.2”（实为 v0.3）。按此文档冷启动会拿错版本。 | 整表按当前文件重写；每行加“版本 + 最后更新日期”；补 `.ome/evidence/`、`.ome/evals/metrics.md`、`.ome/design/evolution.md` 三行。 | Lead |
| 5 | P0 | `.ome/SCOPE.md:62` | 签字记录仍写定位“未定”，但 BRIEF §3/§6 与 HANDOFF 都写“2026-11-07 已确认按 B 推进”。签字表是用户决策的唯一凭据，不能与立项书冲突。 | 改为“已确认（2026-11-07，按 B 推进；SCOPE 本身仍未签）”，并注明出处 BRIEF §3。 | Lead + 用户 |
| 6 | P0 | `.ome/SCOPE.md:37` | 排除清单“多智能体拓扑（v0.1）”与同文件 M13“按任务规模选 solo/orchestrator/blackboard”、ADR-0006（M2 黑板、M4 层级）直接冲突，无法判断并行 Worker 到底做不做。 | 改为“自由多智能体/群聊式协作（v0.1 排除）；受控拓扑（orchestrator/blackboard）按 M13 与 ADR-0006 分阶段启用”。 | Lead |
| 7 | P0 | `.ome/BRIEF.md:45` | 同文件 §4 硬约束“单次运行 ≤30 分钟”与下方目标档“中任务 15–60 分钟、长任务 >60 分钟”冲突，也未说明 30 分钟是单 Run 还是任务累计；评测集 6 条任务 timeout 为 60/90 分钟，直接违反该约束。 | 明确“≤30 分钟 = 单 Run 上限；中/长任务由多次 Run + checkpoint 续跑，档位按累计时长计”，并同步 metrics §1 与 tasks.jsonl 的 timeout_min。 | Lead |
| 8 | P0 | `.ome/evals/tasks.jsonl:1` | 20 条任务全部带 `max_cost_cny`（1–10 元），与“不记预算、不计量费用”（BRIEF §4、SCOPE M10、ADR-0004 D4）正面冲突；评测 harness 会按金额熔断。 | 删除 `max_cost_cny`；`scripts/validate-evals.mjs` 增加“禁止金额字段”校验；以 `timeout_min`/`max_steps` 取代。 | Lead |
| 9 | P0 | `.ome/evals/tasks.jsonl:12` | 分档为 `<45m`（14 条）/ `45-163m`（6 条），而 BRIEF §4、metrics §2/§4 用 `<15m`/`15-60m`/`>60m`；report.json 的 byDurationBand 键对不上任务标签。且本行 timeout_min=90，超过“单次运行 ≤30 分钟”硬约束。 | 统一三档 `<15m`/`15-60m`/`>60m`（超 30 分钟任务加 `runs_required`），timeout_min 改 ≤30；tasks.jsonl、validate-evals.mjs、metrics §4 同一提交改完。 | Lead |
| 10 | P0 | `.ome/SPEC.md:59` | 事件模型仍保留 `costCny` 字段，与“不计量费用”冲突；同类字段还出现在 `interaction.md`（`cny`）、`projects.md`（`cny`）、`tools.md`（`moneyCny`）。四处相加等于把已删的成本模型写回接口。 | SPEC §4 删除 `costCny`，改 `usage?: { tokens, steps, durationMs, retry }`；interaction/projects 的 `cost` 改名 `usage` 并删 `cny`；tools.md `costHint` 删 `moneyCny`。 | Lead |
| 11 | P0 | `.ome/design/interaction.md:225` | 图节点详情接口带 `cny`（人民币），与“不记预算、不计量费用”冲突，且是给 Client 的类型契约。 | 改 `usage?: { tokensIn, tokensOut, steps, ms, retries }`，并注“不换算金额”。 | Lead |
| 12 | P0 | `.ome/design/projects.md:254` | `SubagentResult` 契约带 `cny`，子智能体交接数据结构会把金额一路传下去。 | 改 `usage: { tokensIn, tokensOut, steps, ms }`；同步 projects §10 与 SPEC 追溯矩阵。 | Lead |
| 13 | P0 | `.ome/DESIGN.md:140` | D1“不做多智能体拓扑”与 D16“协作演进：黑板 + 协调策略层”、ADR-0006 M2/M4/M5 冲突；同一张决策表内两条互斥。 | D1 改为“默认单 agent/单 Lead（M0/M1）；拓扑由协调策略层按证据升级（ADR-0006）”，D16 注明对 D1 的补充关系。 | Lead |
| 14 | P0 | `.ome/design/projects.md:223` | §4.3“没有自由黑板 + 拓扑唯一允许的形态”与紧随其后的 §4.4“按任务规模选择 solo/orchestrator/blackboard”、ADR-0006 D2“黑板优先”矛盾；项目制的核心机制有两种相反表述。 | §4.3 限定为“P1 默认拓扑 M1”；“没有自由黑板”改“不开放自由消息总线；协作状态只经项目域（黑板）读写”；§4.4 说明何时升级到 M2。 | Lead |
| 15 | P0 | `.ome/DESIGN.md:99` | 模块表仍写 ADR-0003“待写”、治理“安全 ADR 待写”、R-LLM/R-SESS“ADR-0004/0003 待写”，§11 还写“需要新写 ADR：0003/0004/0005”；这些 ADR 均已 Accepted 并被 SCOPE/STATUS 引用。 | 逐处改为“ADR-0003（Accepted）”等实际状态；删除 §11 末条；治理层补“安全：G-002 承载，无独立 ADR”。 | Lead |
| 16 | P0 | `.ome/ARCH-DECISIONS.md:42` | 同段自称“6 项”，紧接的表格有 13 行；BRIEF §7 有 12 行、DESIGN 有 D1–D17、HANDOFF 列 9 条、STATUS 写“6 项”，没有单一决策清单，任何“已确认决策”引用都不可核对。 | 建立唯一决策登记（建议以 DESIGN D1–D17 为 ID 源，或新建 DECISIONS.md），每项含状态/日期/ADR/影响文档；BRIEF §7、ARCH-DECISIONS §8、HANDOFF §3、SCOPE §4 改为引用，不再各自复制条目。 | Lead |
| 17 | P0 | `.ome/evals/metrics.md:3` | 评测集规模 20/30 两套且无唯一口径：BRIEF“20 条”、SCOPE M09“30 条”、metrics“20 条、另扩到 30 条”、SPEC §9“30 条”、DESIGN §9“30 条”、memory §13“30 条”、PLAN T-003“20 条”。发布门槛与 baseline 计算依赖此数。 | 锁定“P1 基线 = 20 条；30 条为 P1 出口扩展门槛”，写入 BRIEF §4 已锁项与 metrics §0；其他文档统一引用。 | Lead |
| 18 | P0 | `.ome/PLAN.md:35` | P0.5 基线表 B-001..B-004 全部标“blocked（等放行）”，而 STATUS 写“全部通过”、BROWNFIELD §4 写“已验证”。任务图是调度依据，不能同时说阻塞与完成。 | 状态改“完成（基座仓库 D:\Code\deepseek-harness，2026-11-05）”，另加一行“本仓库复验”任务，避免重跑与已完成混淆。 | Lead |
| 19 | P0 | `.ome/BROWNFIELD-BASELINE.md:4` | 文件头写“未跑构建/未改代码”，§4 却写“能跑吗（已验证）”并列出构建/类型检查/测试/Web 四条 PASS；§7 又写“未运行任何构建/测试/服务”。同一文件的三个结论互相否定。 | 文件头改“只读勘察 + 已跑基线（2026-11-05，对象为基座仓库）”；§7 改“未在本仓库（D:\Code\SuperAgent）复验”并列未验项。 | Lead |
| 20 | P0 | `.ome/evidence/T-008/cold-start.md:26` | 证据文件写“待确认：A-04 月预算”，但 FACTS A-04 已标“已确认（关闭）：不记预算、不计量费用”。证据层污染会把已关闭项重新变成待决。 | 改“已关闭：A-04（不记预算，2026-11-07）”，并在证据顶部标“2026-11-05 记录，2026-11-07 已更新”。 | Lead |
| 21 | P0 | `.ome/SPEC.md:66` | SPEC §4 定义一套自建事件日志（Event/Artifact/Approval schema v1、`.ome/sessions/` 目录），与 ADR-0001 D2、ADR-0003 D1、SCOPE M02“复用 DSH SessionEventMap、不改会话 JSONL”冲突；`.ome/sessions/` 不存在。 | 二选一：① 删除 §4 自建 schema，改“字段映射到 DSH SessionEvent（V4）”；② 若确定自建，须新写 ADR 并改 SCOPE M02/ADR-0003。建议①。 | Lead |

## 2. P1 问题（一致性与可落实性）

| # | 级别 | 文件:行 | 问题 | 建议修复 | 责任方 |
|---|---|---|---|---|---|
| 22 | P1 | `.ome/STATUS.md:18` | 该节仍写“读实现至写重构设计”“开始 R-001”，但下文已产出 DESIGN、ADR-0003/0004/0005/0006 与任务卡；冷启动读者会执行过期下一步。 | STATUS 拆为“当前状态（≤30 行）”+“变更日志（日期倒序）”；删除此节，下一步统一引用 HANDOFF §4。 | Lead |
| 23 | P1 | `.ome/STATUS.md:24` | 阻塞项 U1/U5 仍列“待确认/待起草”，但 ARCH-DECISIONS U1 已定“不动”、LICENSE 已落库（同文件第 39 行与 SCOPE §0）。 | 改为“已关闭：U1=不动（ADR-0003）；U5=MIT 双版权（已落库）”。 | Lead |
| 24 | P1 | `.ome/STATUS.md:58` | PR 台账停在 2026-11-05，之后已合并 #31/#33/#46/#47/#52/#53/#60/#63（git log），“剩余 #20/#25/#26 冲突”也已过期。 | 改为链接 GitHub 实时视图，或标“快照 2026-11-05，之后见 git log”，删除可远端查询的重复台账。 | Lead |
| 25 | P1 | `.ome/STATUS.md:63` | 与 `.ome/CI-POLICY.md` 及仓库现状冲突：已删除 27 个继承 workflow（PR #46），现有自建 `.github/workflows/ci.yml`（windows-latest，随 #60 引入）；STATUS 仍按继承上游 CI 叙述。 | 改“CI 已替换为自建 Windows ci.yml（见 CI-POLICY）”并同步 CI-POLICY 现状。 | Lead |
| 26 | P1 | `.ome/STATUS.md:127` | SCOPE v0.3 实际含 M01–M13（新增 M13 自适应协作）；DESIGN §11、HANDOFF 文件地图同样截断为 M12。 | 统一为 M01–M13，全仓替换“M01–M12”。 | Lead |
| 27 | P1 | `.ome/STATUS.md:5` | 本轮文档改动全部未提交（git status 37 项 dirty）；STATUS/HANDOFF 未记录 commit，阶段结论与证据无法对应可复现基线，且并发编辑使行号/版本引用漂移。 | 文档落定后立即提交并打 tag；STATUS/HANDOFF 头部加“基线 commit”，引用文档带版本号。 | Lead |
| 28 | P1 | `.ome/SCOPE.md:59` | 文件标题已是 v0.3，签字表仍写“草案 v0.2”；“签字的是哪一版”无法回答。 | 改“未签（草案 v0.3，2026-11-07）”，并加“签字须注明 commit hash”。 | Lead |
| 29 | P1 | `.ome/SCOPE.md:79` | 内容层重构表仍写“JSONL 持久化格式与迁移链（建议不动）…（U1 待定）”；U1 已定，措辞停在建议阶段。 | 改“已定不动（ADR-0003，U1 关闭）”，删“U1 待定”。 | Lead |
| 30 | P1 | `.ome/SCOPE.md:70` | SCOPE §6（本机起 Web、核心链路可演示、品牌替换）与 DESIGN §8（一句话建项至3 任务至产物、记忆跨会话命中）、PLAN 阶段门禁是三套 P1 出口判据，验收无法判定过关。 | 以 DESIGN §8 为唯一 P1 出口，SCOPE §6 改为引用；PLAN 门禁补对应任务 ID 与判据编号。 | Lead |
| 31 | P1 | `.ome/HANDOFF.md:41` | “下一步”仍在等用户确认“先不签 SCOPE 但按决策推进”，而 SCOPE/STATUS 已记录用户明确“先不签”并按决策推进。 | 删该条，改“基线复验 至 G-001 至 M-001 至 P-001/U-001”。 | Lead |
| 32 | P1 | `.ome/DESIGN.md:188` | 设计文档与 SCOPE 的对应表漏 M13（自适应协作），§4 模块表却已含“协调策略（Coordination）”；C-001 因此失去上位依据。 | 改“M01–M13”，补“M13至协调策略层/evolution.md/ADR-0006”映射。 | Lead |
| 33 | P1 | `.ome/DESIGN.md:58` | §3 总体架构图无“协调策略层/黑板”，§4 模块表与 D16 却已列为一等模块；C-001/U-003 在图中无来处。 | 编排层与项目层之间加“协调策略层：模式选择 ， 上下文包路由 ， 决策审计”，项目层标“黑板=项目域（唯一权威）”。 | Lead |
| 34 | P1 | `.ome/DESIGN.md:171` | 指标数不一致：此处“四项”，BRIEF/SCOPE/metrics 均为“五项”（第五项为用量诊断）；ADR-0001 D6 标题写“五项”正文列 4 项。 | 统一五项：任务成功率、pass^k、人工接管率、P95 时长、用量（诊断不换算金额），并在 BRIEF §4 列表化。 | Lead |
| 35 | P1 | `.ome/SPEC.md:1` | 标题写 v0.1/P0 草案，第 3 行写“版本 v0.2”且依据 BRIEF v0.2 / SCOPE v0.2（现为 v0.3）；三处版本/阶段口径不一致。 | 标题改“v0.2（P1 基线 ， 未签字）”，依据改“BRIEF v0.3 / SCOPE v0.3 / DESIGN / ADR-0001…0006”。 | Lead |
| 36 | P1 | `.ome/SPEC.md:27` | FR-11 仍定义“项目级文件式长期记忆”，与 M06/ADR-0005 的五层记忆 + `storageDomain` 独立域不一致（文件式只是 memory §15 的候选/补充）。 | 改“记忆：五层记忆域（L0–L4）+ 显式读写删 + 可关闭”，判据沿用 FR-16/FR-17。 | Lead |
| 37 | P1 | `.ome/SPEC.md:87` | 追溯矩阵把工具/MCP/执行环境挂到 G-001（模型网关）与 P-001（项目域），二者判据均不含 MCP/沙箱；FR-06 沙箱无任务卡承接。 | 改“FR-04 工具层至新建 tools 任务卡；FR-05 MCP至基座复用；FR-06 沙箱至M05 本地隔离任务卡”，并补卡或注明由基座承担。 | Lead |
| 38 | P1 | `.ome/SPEC.md:86` | 矩阵引用 P-002、U-002、G-002 三张“待写卡”与 `.ome/evidence/P-001/`、`U-001/`、`M-001/`、`G-001/` 五个不存在的证据目录；矩阵不可点击、不可核对。 | 在 PLAN 为 P-002/U-002/G-002 补卡（或标“P1 不交付”）；证据目录改为“开工时创建”，统一 `.ome/evidence/<任务ID>/`。 | Lead |
| 39 | P1 | `.ome/SPEC.md:104` | 阶段验收勾选“基座基线通过”，但证据在基座仓库；“品牌替换”未勾，实际已完成（PR #60）。勾选状态与事实相反。 | 基线改“[~] 基座仓库已验证、本仓库待复验”；品牌替换改 [x] 并链 `.ome/evidence/branding/validation.md`。 | Lead |
| 40 | P1 | `.ome/SPEC.md:80` | §6 排除“多智能体”，但 M13/C-001/ADR-0006 明确 P1 交付 orchestrator/blackboard 受控拓扑；同一文档 FR 与排除项矛盾。 | 改“自由多智能体（群聊/自由协商）；受控拓扑按 M13 交付”，与 SCOPE §2 同步。 | Lead |
| 41 | P1 | `.ome/SPEC.md:38` | FR 编号止于 FR-22，未覆盖 P1 新增的协调策略层（M13/C-001）与黑板视图（U-003）；SCOPE M07/M13 有范围，SPEC 无需求条目与验收判据。 | 新增 FR-23（协调策略层：模式选择/决策审计/人工覆盖）与 FR-24（黑板视图：只读投影/四视图同源），或注明由 DESIGN/ADR-0006 承载。 | Lead |
| 42 | P1 | `.ome/PLAN.md:4` | 状态与事实不符：定位已确认（按 B）、设计已产出、README/HANDOFF 均写“P1 可开工”；PLAN 是调度入口，状态过期使下一步无法执行。 | 改“P1 开工（SCOPE 未签，按已确认决策推进）；P0 任务 T-001/T-003/T-004 已完成”。 | Lead |
| 43 | P1 | `.ome/PLAN.md:42` | 品牌替换已由 PR #60/#63 落地（含截图证据），PLAN 仍写“待清点”，且 P1 门禁要求它。 | 改“R-005至已完成（#60/#63，证据 .ome/evidence/branding/）”，从 P1 出口判据移除或标已完成。 | Lead |
| 44 | P1 | `.ome/PLAN.md:13` | T-005 写域为 `src/cli/`、产物为 `node dist/cli.js`，与“基于源码升级”的仓库结构（`packages/*`，无 `src/`）冲突；SPEC §5 又用 `superagent` CLI 名。按 PLAN 开工会在错误目录建代码。 | 改“在 `packages/<group>/` 新建 CLI/profile 插件”并确定命令名（建议 `panoptic`），同步 SPEC §5 与任务卡。 | Lead |
| 45 | P1 | `.ome/PLAN.md:64` | “计量”与“不计量费用”冲突；G-001 任务卡标题、证据目录（“计量样例”）也沿用该词。 | 全部改“用量记录（token/步数/耗时，不换算金额）”。 | Lead |
| 46 | P1 | `.ome/tasks/G-001.md:20` | 把“用量优化缓存策略”归给 G-002，但 PLAN 中 G-002 是“审批门与安全策略”；依赖图指向错误任务。 | 改“缓存优化另立任务卡（如 G-003）”，或删该括注。 | Lead |
| 47 | P1 | `.ome/tasks/P-001.md:18` | 引用不存在的任务 P-003（PLAN/任务目录均无），“不做”清单成为悬空指针。 | 在 PLAN 增补 P-003（并发调度器，P1.5），或改“并发调度器（P1.5，暂不建卡）”。 | Lead |
| 48 | P1 | `.ome/design/projects.md:168` | §1 写“Role[]（Lead / Worker / Verifier / Human）”，§4.1 却是 Lead/Researcher/Builder/Verifier/Writer，ADR-0004 又用 Builder/Researcher/Writer；“Worker”在 ADR-0006 里是执行实体，不是角色。 | 统一角色词表：Lead / Researcher / Builder / Writer / Verifier（Human 单列为审批者）；ADR-0004 与 BRIEF 二选一。 | Lead |
| 49 | P1 | `.ome/design/projects.md:379` | §8 写“项目记忆采用索引文件 + 按需打开（MEMORY.md）”，与 ADR-0005 D6/memory §10“`storageDomain` 独立域 + SQLite/FTS 主存”是两种工程形态；会让实现者另写一套文件记忆。 | 改“项目记忆存 memory 域；`MEMORY.md` 仅作可选的 L4 索引投影（可重建）”。 | Lead |
| 50 | P1 | `.ome/design/projects.md:493` | §15 待决 1/2/3 已被关闭：模型分层（ADR-0004 D2）、计划确认策略（BRIEF 决策 4）、验证器独立性（ADR-0004 D2 + §4.1）。 | 1/2/3 标“已定（ADR-0004/决策 4）”并移到“已决”小节；待决只留 4–8。 | Lead |
| 51 | P1 | `.ome/design/projects.md:439` | §11 写项目域为“projectRecord + sessionAccount 两表”，与 §9 数据模型（七表）和 ADR-0003 D1 的表清单不一致。 | 改“七表（见 §9）”或说明两表是基座侧映射；二者择一并互链。 | Lead |
| 52 | P1 | `.ome/design/tools.md:29` | 工具注册项带 `moneyCny`，与不计量费用冲突（与 SPEC/interaction/projects 同类字段一并处理）。 | 改 `usageHint?: { tokens?, latencyMs? }`，删 `moneyCny`。 | Lead |
| 53 | P1 | `.ome/design/tools.md:11` | 事件命名分隔符不统一：tools 用 `tool/call`、memory 用 `memory/recalled`、context 用 `context/assembled`、ADR-0003 用 `task.state_changed`、SPEC §4 用 `tool.call`。实现时会出现两套事件名。 | 统一为 DSH 规范 `domain/action`（斜杠）并写入 SPEC §4 命名约定，或反向统一点号并说明理由。 | Lead |
| 54 | P1 | `.ome/design/interaction.md:150` | 术语未收敛：`黑板`（协作状态/项目域）与`看板`（视图）在 interaction §3.6、ADR-0006 D2/D8、SCOPE M07、BRIEF §7 混用，无法判断“黑板视图”是看板视图还是协作状态本身。 | 在 DESIGN 或 glossary 增术语表：黑板=项目域（唯一权威）、看板=只读视图、图谱=依赖/并行投影、协调策略层=模式选择器。 | Lead |
| 55 | P1 | `.ome/tasks/T-002.md:15` | T-002 状态在 PLAN“阻塞（等用户）”、任务卡“部分满足”、SCOPE 签字行“未签”三处不一致；T-003 又依赖 T-002。 | 统一“部分满足：定位已按 B（用户确认）；SCOPE 签字待用户”，同步 PLAN 行状态。 | Lead |
| 56 | P1 | `docs/adr/ADR-0001-harness-architecture.md:3` | ADR-0001 仍标 Proposed，但 DESIGN/README/BRIEF 都把它当已确认依据，PLAN P0 门禁还留“ADR-0001 由用户确认”；D4 已在 2026-11-07 被用户调整，事实上在生效。 | 若已确认则改 Accepted 并记日期；若未确认，则 DESIGN 引用处标“Proposed，待确认”且保留 P0 门禁。二者必须一致。 | Lead + 用户 |
| 57 | P1 | `docs/adr/ADR-0006-collaboration-model.md:4` | 新增的 5 条链接写成 `../.ome/...`，从 `docs/adr/` 解析为 `docs/.ome/...`（不存在）：evolution/projects/context/07/08 五处全部断链。 | 全部改 `../../.ome/design/...` 与 `../../.ome/research/...`，并把链接校验纳入文档门禁（doc-sync 或脚本）。 | Lead |
| 58 | P1 | `docs/adr/ADR-0004-model-gateway.md:9` | 背景段仍写“成本计量”，与同文档 D4“不计量费用”矛盾（应为“用量记录”）。 | 改“用量记录（不计费）”。 | Lead |
| 59 | P1 | `.ome/research/00-synthesis.md:32` | 研究综合仍把“v0.1 云沙箱”作为决策（同文件 §3 执行层、§4 D4），ADR-0001 D4 已于 2026-11-07 改为“首版本地隔离”；BRIEF/DESIGN 又把 00-synthesis 当依据引用。 | 顶部加勘误“2026-11-07：沙箱决策已被 ADR-0001 D4 调整；不记预算；协作模型见 ADR-0006”，§4 D4 标“已被取代”。 | Lead |
| 60 | P1 | `.ome/research/00-synthesis.md:45` | “预算熔断”与不记预算冲突（同文件 §6 第 4 条“单任务成本上限”同理）。 | 改“资源上限熔断（时长/步数/重试）”；§6 第 4 条同步删除金额上限。 | Lead |
| 61 | P1 | `.ome/BROWNFIELD-BASELINE.md:3` | 基座现状模型的对象仍是 `D:\Code\deepseek-harness`，而项目仓库是 `D:\Code\SuperAgent`（squash 导入）；读者会以为勘察对象就是本仓库。 | 改“对象：基座仓库 D:\Code\deepseek-harness（squash 导入至 D:\Code\SuperAgent）”，§4 标“本仓库复验前结论不外推”。 | Lead |
| 62 | P1 | `.ome/BROWNFIELD-BASELINE.md:47` | 事件日志格式写“JSONL v1”，而 06-repo-seams E1/E12 与 ADR-0003 确认 `SESSION_FORMAT_VERSION = 4`（generation v4 文件名）；版本号写错会影响“不改格式”判断的基准。 | 改“JSONL（generation v4，`session.v4.jsonl`）”。 | Lead |
| 63 | P1 | `.ome/CI-POLICY.md:3` | 现状段停在 2026-11-06（已删 27 个 workflow、已禁用 Actions），但仓库现有自建 `.github/workflows/ci.yml`（随 #60 引入），品牌证据也声称有 Windows CI；策略与仓库状态不一致。 | 补“2026-11-07 更新：新增自建 ci.yml（windows-latest/pwsh/typecheck/build/品牌测试）”，删除或修正“已禁用 Actions”。 | Lead |
| 64 | P1 | `README.md:55` | 文档索引 ADR 行只列 0003–0006；ADR-0001 全文无链接，ADR-0002 不在索引行。 | 索引行改为“ADR-0001…0006”并逐项链接。 | Lead |
| 65 | P1 | `.ome/STATUS.md:15` | 证据索引不完整：仓库有 4 个证据目录（B-001/T-003/T-008/branding），入口文档只链 B-001；品牌替换与评测集验证证据未被引用。 | 在 STATUS“交付物一致性”加证据索引表：B-001（基线）、T-003（评测集 PASS）、T-008（冷启动）、branding（品牌替换），各附一行结论。 | Lead |

## 2.1 P2 问题（版本、排版与细节）

| # | 级别 | 文件:行 | 问题 | 建议修复 | 责任方 |
|---|---|---|---|---|---|
| 66 | P2 | `.ome/DESIGN.md:1` | DESIGN 与 6 份子系统文档仍标“v0.1 草案”，但 D1–D17 已被 ADR 采纳、任务卡已按下发；版本号停留在草案会削弱权威性。 | 统一升版（DESIGN v1.0、子系统 v0.2），头部加“状态：已确认/草案”与对应 ADR。 | Lead |
| 67 | P2 | `.ome/SPEC.md:79` | 小节标题仍写“继承 SCOPE v0.2”。 | 改 v0.3。 | Lead |
| 68 | P2 | `.ome/SPEC.md:115` | §10 仍写“待按实现核实”，但 06-repo-seams 已逐条读源码确认落点，ADR-0003/0005 据此 Accepted。 | 改“基座落点（已核对 06-repo-seams，2026-11-07）”并链具体小节。 | Lead |
| 69 | P2 | `.ome/design/tools.md:148` | “待决问题”第 3 条自身已写“已定首版本地隔离”，已决项仍列在待决清单。 | 移到“已决”或删除该条。 | Lead |
| 70 | P2 | `.ome/design/evolution.md:8` | 以“当前设计=单 Lead”开篇，但 ADR-0006 已把 Lead 降为仲裁者、M1 为当前默认；“单 Lead”作为旧形态描述易与 D16 已定状态混淆。 | 改“P1 前的基线形态是单 Lead + 受控 subagent；ADR-0006 已确认演进方向”。 | Lead |
| 71 | P2 | `.ome/ARCH-DECISIONS.md:1` | 头部日期停在 2026-11-05，但 §8 记录 2026-11-07 的 13 项决策；§7 标题“仍待细化”下 U1/U4/U5 已定；文档无版本/状态/负责人。 | 头部补“v1.1 ， 2026-11-07 ， 维护者 Lead”；§7 改“已关闭的待定项”，未决（U2/U3）单列。 | Lead |
| 72 | P2 | `.ome/evidence/T-008/cold-start.md:14` | 文件名拼写错误 HANHDOFF至HANDOFF；该证据还引用已废弃的 `src/cli/` 路径。 | 修正拼写；`src/cli/` 表述改为“按 PLAN 的 P1 任务”。 | Lead |
| 73 | P2 | `.ome/MCP-GITHUB.md:7` | 仓库文档写入本机绝对路径（含用户名），不可移植且泄露本机信息。 | 改为 `%USERPROFILE%\.dsh\profiles\desktop\cordis.patch.yml`（或 `~/.dsh/...`）。 | Lead |
| 74 | P2 | `.ome/evals/metrics.md:61` | 术语误用：held-out 指不参与调参的任务集，“held-out 子集 ≥30%”指在其内部再留 30%，应表述为“在 20 条任务集中保留 ≥30% 作为最终验证集”。 | 改“20 条中保留 ≥6 条作为最终验证集，不参与调参与基线迭代”。 | Lead |
| 75 | P2 | `.ome/FACTS.md:32` | A-03 状态“已确认（按 B 推进，标假设）”自相矛盾；§2 标题仍“假设值…待确认”，但 A-01…A-08 全已确认。 | 状态改“已确认（2026-11-07；定位变化则重开）”；§2 标题改“假设与已确认项”。 | Lead |
| 76 | P2 | `.ome/design/evolution.md:102` | 同一指标两种口径：evolution“≤任务时长 2%（规则版 <10ms）”，SCOPE M13/C-001“决策 <10ms”；2% 在不同任务时长下数值差异极大。 | 统一“规则版 P95 <10ms；如启用边界带小模型，P95 ≤ 任务时长 2%”，两处同文。 | Lead |
| 77 | P2 | `.ome/tasks/C-001.md:22` | 引用不存在的 C-002（与 P-003/U-004 同类悬空引用）。 | 改“LLM 边界判断（P2，暂不建卡）”或补卡。 | Lead |
| 78 | P2 | `.ome/PLAN.md:69` | 写域约定把 U-* 限定为 client/host，但 U-003 需写 `packages/api` 看板投影接口，与约定不符。 | 改“U-* 写 client/host/api 投影；C-* 写 coordination 包 + project 读取接口”。 | Lead |
| 79 | P2 | `.ome/DEPENDENCY-POLICY.md:1` | 策略文档无日期、无负责人、无适用范围版本；与 CI-POLICY 同属治理文档但未纳入 README/.ome 索引。 | 头部加“v1.0 ， 日期 ， 维护者 Lead ， 适用：fork 仓库”；在 README/.ome 索引补治理文档三件套。 | Lead |

## 3. 已核实无问题（清单）

1. **链接与锚点**：脚本扫描 `.ome/`、`docs/adr/`、`README.md` 共 49 个 Markdown 文件、210 条本地链接，除 `docs/adr/ADR-0006-collaboration-model.md:4` 的 5 条 `../.ome/...` 断链（已列 P1）外全部可达；所有 `#锚点` 均可解析（含 `DESIGN 至 design/memory.md#14-里程碑`）。
2. **编号完整性**：DESIGN D1–D17、SPEC FR-01–FR-22、SCOPE M01–M13、FACTS F-01–F-24 与 A-01–A-08、ADR-0001–0006 均连续无缺号；ADR 目录与 README/文档引用无缺号。
3. **关键路径存在**：LICENSE、NOTICE、THIRD_PARTY_NOTICES.md、`Panoptic Super logo.png`、`docs/upstream/`、`scripts/validate-evals.mjs`、`.ome/evidence/T-003/validate.log`、6 份 ADR、6 份 design 文档均存在。
4. **评测集基本盘**：`tasks.jsonl` 20 条 JSON 全部可解析，每条含 `criteria`/`verifier`/`duration_band`；`validate.log` = PASS 且 total=20，与 PLAN T-003“20 条”一致（字段口径问题已列 P0）。
5. **记忆公式与阈值**：`memory.md §4` 与 ADR-0005 D3/D4 公式一致（`w=I，exp(−Δt/S)`、`S=S0，(1+ρ，n_use)，conflict_penalty`、`T_retain=S，ln(I/θ_archive)`）；`S=180 至 H≈125 天` 换算正确；θ 阈值 0.15/0.35/0.06/0.02/0.5 两处一致。
6. **上下文配额**：`context.md §1` 八段配额 5+8+7+15+10+20+20+15 = 100%，记忆注入 15% 与 ADR-0005/§6.3 一致。
7. **交互验收指标**：3 秒测试、≤2 次点击到结果、≤3 次到记录、200 节点 ≤1s、>40 节点聚合、更新 ≤1s，在 interaction §7、U-001、U-003、SCOPE M07 口径一致。
8. **状态词表**：ADR-0003 D2 与 projects §2.2 的 Project/Goal/Task/Run/Artifact/Approval 六类迁移完全一致，无名称漂移。
9. **术语主链路一致**：`上下文包（Context Packet/Broker）`、`协调策略层`、`资源上限`、`记忆 L0–L4`、`协作模式 M0–M6` 在 ADR-0006、evolution、context、SCOPE M13、memory、ADR-0005 中含义一致（仅“四层”一处笔误与缺少术语表，已列问题）。
10. **成本清理主文档已干净**：BRIEF §4、SCOPE M10、SPEC FR-10/NFR-03、ADR-0004 D4、HANDOFF、README 均无金额指标；残留只在类型契约与评测集字段（已列 P0）。
11. **品牌证据与外部事实一致**：GitHub issue #59（品牌与独立基线）已由 PR #60 关闭，仓库含自建 Windows CI（`.github/workflows/ci.yml`），与 branding 证据描述一致。
12. **研究报告质量**：00–06 均含日期、可点击来源与证据等级；06-repo-seams 逐条标“已读/推断”并给出文件行号，可复核。
13. **任务卡要素**：M-001/P-001/U-001/U-003/G-001/C-001 六张卡均含编号、目标、可执行判据、验证器、写域、依赖、证据目录七要素（T-002/T-005 为 P0 遗留格式，标准不同）。

## 4. 审计方法与可复跑检查

- **逐份通读**：.ome 核心文档 10 份、design 6 份、tasks 9 份、evals 2 份、research 00–06、ADR 6 份、README；重点比对决策/模块/FR/任务/证据五条链。
- **链接与锚点**：脚本遍历 49 个 Markdown，按 GitHub slug 规则计算标题锚点并解析相对路径（结果见 §3 第 1 条）。
- **标识符盘点**：正则提取 T-/B-/M-/P-/U-/G-/C- 编号、M01–M13、FR-01–FR-22、ADR-0001–0006、D1–D17，核对“被引用但不存在”与“存在但从未引用”。
- **评测集校验**：`node scripts/validate-evals.mjs`（T-003 证据）与人工字段审计（金额字段、分档、timeout、criteria）。
- **仓库事实抽查**：`git log --oneline`、`git status --porcelain`、GitHub MCP 读取 issue #59/PR #60、读取 `.github/workflows/ci.yml`。
- **行号口径**：所有“文件:行”为 2026-11-07 20:15 工作区快照；审计期间 Lead 并发编辑了 ADR-0006、context.md、memory.md 与 research/README.md，若行号漂移请按“问题”列关键词检索。

## 5. 未覆盖项与说明

- `research/07-memory-context-frontier.md` 与 `08-agent-architecture-frontier.md` 在审计期间刚落地，仅核对存在性与索引，未逐条核对其结论；建议在下一轮审计中检查它们对 ADR-0005/ADR-0006 的修正建议是否已回写。
- 本次未审计 `docs/` 下 DSH 继承文档（553 个 Markdown）与 `.github/AGENTS.md`；后者仍描述 `ci-windows.yml`/`ci-python.yml`/`ci-master.yml`，而本 fork 只有 `ci.yml`，建议单列“继承文档本地化”任务。
- 本文件为只读审计产物，未修改任何其它文件；修复由 Lead 按责任方分派。
