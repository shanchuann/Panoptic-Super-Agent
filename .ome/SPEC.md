# SPEC — 超级智能体 v0.1 需求规格（P0 草案 · 未签字）

> 版本 v0.1 · 2026-11-05 · 依据 BRIEF v0.2 / SCOPE v0.2 / .ome/research/00-synthesis.md
> 所有「假设」均标 A-xx（见 FACTS.md §2），未签字前不作为承诺。
> 定位（假设 A-03）：面向个人开发者的「研究 + 代码/文档交付」窄场景智能体；形态 Web UI + CLI 内核（A-02）。

## 1. 用户与场景
目标用户：需要把「查资料 / 读代码 / 出文档 / 做表」串成一条自动流水线的个人开发者（A-01）。
三个用户故事（每条都要能被下面的 FR 支持）：
- US-1：我说「调研 X 并与 Y 对比，给我一页结论」，10 分钟内拿到带来源的文档产物。
- US-2：我说「仓库里这个测试挂了，修好并且别弄坏别的」，拿到 diff + 通过的测试输出。
- US-3：我让它在已有产物上继续（换数据重跑、改格式），它能复用上一步的上下文与文件，而不是从零开始。

## 2. 功能需求（每条带验收判据）
| ID | 需求 | 验收判据（可执行/可复核） | 优先级 |
|---|---|---|---|
| FR-01 | 任务接入：一条命令或 Web 表单提交目标，生成 taskId | `superagent run "..." ` 返回 taskId，事件日志出现 task.created | P0 |
| FR-02 | 计划：执行前产出显式计划（步骤、工具、预期产物） | 事件流含 plan.created；计划可被用户查看 | P0 |
| FR-03 | 执行循环：单 agent 循环，工具调用可中断 | 每步产生 tool.call/tool.result 事件；Ctrl-C 后状态可恢复 | P0 |
| FR-04 | 工具层：内置工具 ≥6（fs.read/write、shell、fetch、search、artifact.put、finish） | 工具清单可列出；每个工具有 schema 与最小权限声明 | P0 |
| FR-05 | MCP 客户端：可接入远程 MCP server（2026-07-28 规范） | 用 1 个公开 server 成功调用工具并记录 trace | P0 |
| FR-06 | 沙箱：代码执行在隔离环境，网络默认拒绝 | 默认断网时 `curl` 失败、白名单域名成功；凭证不出现在沙箱文件 | P0 |
| FR-07 | 交付物：artifact 落盘，可预览/下载/回溯版本 | artifact.list 返回版本；同任务重跑生成新版本而非覆盖 | P0 |
| FR-08 | 轨迹：全链路事件可回放 | `superagent replay <taskId>` 按序打印事件；事件含 token/耗时/重试标记 | P0 |
| FR-09 | 审批门：写/付款/外发三类动作需人工确认 | 未 approval 时动作挂起；approve/reject 都写审计事件 | P0 |
| FR-10 | 预算熔断：任务级 token/费用上限 | 超限任务状态为 budget_exceeded 并保留中间产物 | P0 |
| FR-11 | 记忆：项目级文件式长期记忆，可关闭/可删除 | 关闭后不写记忆；删除后检索不到（测试用例证明） | P1 |
| FR-12 | 评测入口：跑 held-out 集并输出五项指标 | `superagent eval --set .ome/evals/tasks.jsonl` 产出 report.json | P0 |

## 3. 非功能需求
| ID | 类别 | 要求 | 判据 |
|---|---|---|---|
| NFR-01 | 可靠性 | 同任务连续 3 次全对（pass^3）| 20–30 条 held-out 集报告 |
| NFR-02 | 时延 | P95 完成时长按任务时长分档报告 | report.json 含分档 |
| NFR-03 | 成本 | 单任务 ≤¥2 目标、¥10 硬熔断 | 事件日志累计成本 |
| NFR-04 | 安全 | 5 类攻击用例全拦截 | evals/attack 测试输出 |
| NFR-05 | 可观测 | 每步事件含：工具名、参数哈希、结果摘要、token、耗时 | schema 校验脚本通过 |
| NFR-06 | 隐私 | 默认本地存储；未授权不外发用户文件 | 审计：网络出口白名单 + 配置项 |
| NFR-07 | 可维护 | 新工具接入 ≤1 天；不需要改循环内核 | 工具注册接口单测 |

## 4. 数据与状态模型（事件日志 schema v1）
```ts
type Event = {
  id: string; taskId: string; seq: number; ts: string;   // ISO8601
  type: "task.created" | "plan.created" | "step.started" | "tool.call" | "tool.result"
      | "approval.requested" | "approval.decided" | "artifact.put" | "task.finished" | "task.failed";
  payloadHash: string; payloadRef: string;               // 大对象入文件，事件只存引用
  tokens?: { in: number; out: number; cached?: number };
  costCny?: number; durationMs?: number; retry?: number;
};
type Artifact = { id: string; taskId: string; path: string; mime: string; version: number;
                  sha256: string; provenance: { eventIds: string[] } };
type Approval = { id: string; taskId: string; action: "write"|"pay"|"send"; target: string;
                  risk: "low"|"medium"|"high"; evidenceRef: string; decision: "pending"|"approved"|"rejected" };
```
规则：事件 append-only；compaction 只生成视图文件，不删除事件；payloadRef 指向 `.ome/sessions/<taskId>/`。

## 5. 接口契约（CLI 先行，Web 后置）
| 命令 | 作用 | 成功判据 |
|---|---|---|
| `superagent run "<goal>" [--budget 2] [--max-min 30]` | 创建任务并执行 | 退出码 0 且有 artifact |
| `superagent status <taskId>` | 查看状态与当前步骤 | 输出状态 + 最后 5 条事件 |
| `superagent approve <approvalId> --yes` | 审批挂起动作 | 任务继续或按决策终止 |
| `superagent replay <taskId>` | 回放事件 | 输出与事件日志条数一致 |
| `superagent eval --set <jsonl> [--k 3]` | 跑评测 | 生成 report.json，五项指标齐全 |
| `superagent tools list` | 列工具与权限 | 输出 JSON，schema 校验通过 |
工具执行统一接口：`execute(name: string, input: unknown) => Promise<string>`（返回字符串摘要，细节进 artifact）。

## 6. 排除（继承 SCOPE v0.2）
多智能体、开放桌面/网页 GUI 自主操作、图谱记忆、多租户、企业 RBAC、自研模型、移动端、插件市场、私有化部署、语音多模态。

## 7. 追溯矩阵（FR ↔ 评测任务 ↔ 证据）
| FR | 评测任务 | 证据位置 |
|---|---|---|
| FR-01/02/03 | TASK-001, TASK-014 | `.ome/evidence/T-005/` |
| FR-04/05/06 | TASK-003, TASK-016 | `.ome/evidence/T-005/` |
| FR-07/08 | TASK-020 | `.ome/evidence/T-005/` |
| FR-09/10 | TASK-017 + attack 用例 | `.ome/evidence/T-007/` |
| FR-12/NFR-01/02 | 全部 20 条 | `.ome/evidence/T-006/report.json` |

## 8. 待定（TBD，必须有 owner）
| # | 问题 | 影响 | Owner |
|---|---|---|---|
| TBD-1 | 定位 A/B/C 最终选择 | 场景、评测集、定价 | 用户 |
| TBD-2 | 首版模型档位与供应商 | 成本/质量 | Lead（P1 基线后） |
| TBD-3 | 沙箱供应商（E2B/Daytona/Modal） | 成本、锁定风险 | Lead（ADR-0002） |
| TBD-4 | 记忆供应商或自写 | 架构耦合 | Lead（ADR-0003） |
