# Panoptic Super 记忆子系统设计（v0.1 草案）

> 状态：设计草案 ， 2026-11-07 ， 归属：.ome/design/ ， 上位文档：[.ome/DESIGN.md](../DESIGN.md)
> 一句话：模型只读"抽象概念 + 证据指针"，原始数据永远在底层可回溯；标签决定这条记忆怎么管，权重决定它还能活多久。

## 0. 设计目标与非目标

目标：
1. 跨会话连续性：同一项目/同一用户的稳定背景不必重复交代；
2. 用量可控：注入的是提炼后的概念卡，不是历史原文，显著降低 token 与延迟；
3. 可追溯：任何一句"模型记住的事"都能下钻到原始证据（消息、工具输出、文件、diff）；
4. 可治理：可关闭、可纠正、可删除；删除后检索不到，且派生副本一并清理；
5. 会衰老：权重随时间和使用变化，权重变化直接改变保留周期与注入方式；
6. 项目隔离：默认按项目分域，跨项目只共享用户级偏好与可复用经验。

非目标（v0.1 不做）：
- 图谱数据库独立部署（先做事实间的轻量关联与实体索引，图能力后置）；
- 参数化记忆/微调写回模型权重；
- 多模态记忆的完整编码（先存附件引用与文字描述）；
- 向量库供应商锁定（接口可替换，默认本地 SQLite + 向量扩展）。

## 1. 参考方案与取舍

| 方案 | 分层 | 衰减/遗忘 | 对本案的价值 | 出处 |
|---|---|---|---|---|
| 货拉拉四层渐进式记忆 | L0 数据底座（只存不判）至 L1 感知层至 L2 决策层至 L3 画像层 | 未公开显式公式；画像 24h 全量重算 | "原始数据至当时观察至当下判断至长期认知"的分层与刷新节奏 | [掘金 2026-11-04](https://juejin.cn/post/7703850980559667234) |
| 货拉拉记忆系统（在线侧） | 事实主记录 + 检索派生索引；实体链接 / 关联记忆 / 概念标签 | 离线"轻睡/深睡/REM"整理 | 事实独立可理解、三路召回+两阶段排序、主记录与索引分离 | [掘金](https://juejin.cn/post/7673223160665227274) |
| 腾讯 TencentDB Agent Memory | L0 对话至L1 原子事实至L2 场景至L3 画像；短期用 Mermaid 符号记忆 | 渐进披露 + 下钻链 | "低层保证据、高层保结构"；symbol至node_id 回原文 | [GitHub](https://github.com/TencentCloud/TencentDB-Agent-Memory)（MIT） |
| 腾讯混元 Hy-Memory | Chat：L0–L7（原始对话/原子事实/会话摘要/心智图式/前瞻意图）；Working/Coding：事实层+经验层 | 冲突 reconcile、意图有效期、版本链 | 原子事实版本化不可变；经验层带 confidence 与适用边界；L7 意图过期转事实 | [GitHub](https://github.com/Tencent-Hunyuan/Hy-Memory)（Apache-2.0），[论文](https://arxiv.org/abs/2606.09483) |
| MemoryBank | 记忆片段 + 用户画像 | 艾宾浩斯遗忘曲线：按时间与重要性遗忘、按使用强化 | 权重随时间衰减、被检索强化，是本设计权重模型的直接依据 | [arXiv 2305.10250](https://arxiv.org/abs/2305.10250) |
| Generative Agents | 记忆流 + 反思 + 计划 | 检索分 = 相关性/时近性/重要性加权 | 三因子打分与"反思"生成更高层记忆 | [arXiv 2304.03442](https://arxiv.org/abs/2304.03442) |
| MemGPT / Letta | 核心记忆 + 归档记忆 + 召回记忆（虚拟上下文分页） | 由模型自编辑 | 分层驻留与换入换出的接口形态 | [arXiv 2310.08560](https://arxiv.org/abs/2310.08560) |
| Mem0 | 抽取 至 ADD/UPDATE/DELETE/NOOP | 冲突决策由 LLM 判定 | 写入时的冲突消解操作集 | [arXiv 2504.19413](https://arxiv.org/abs/2504.19413) |

取舍结论：
- 采用"四层语义金字塔 + 双存储 + 权重/半衰期 + 睡眠整合"的组合；不采用单一扁平向量库（截至 2026-11 公开资料范围内）。
- **差异化机会**：调研显示没有一家把"标签 至 TTL/衰减/共享/删除策略"做成完整规则引擎（标签多数只是分类），这正是本设计的重点（§3–§4）。
- 分层命名对齐业界共识：L0 证据 / L1 情节 / L2 事实 / L3 概念 / L4 项目画像。
- 模型侧只注入 L2–L4 的"概念卡"，L0/L1 通过证据 ID 按需下钻（对齐腾讯"下钻链"）。
- 权重模型采用"艾宾浩斯保持率 × 内在重要性"的形式，并把"用户钦定"映射为权重 1 的不衰减记忆。

## 2. 分层模型

```text
        ┌────────────────────────────────────────────┐
 L4     │ 项目画像 / 用户画像：目标、约束、关键决策    │  ← 模型默认读取
        ├────────────────────────────────────────────┤
 L3     │ 概念与图式：偏好、模式、经验、教训、反模式    │  ← 模型默认读取
        ├────────────────────────────────────────────┤
 L2     │ 原子事实：主-谓-宾 + 条件 + 时间 + 置信度     │  ← 检索命中后读取
        ├────────────────────────────────────────────┤
 L1     │ 情节：会话片段、步骤摘要、任务/决策过程        │  ← 下钻读取
        ├────────────────────────────────────────────┤
 L0     │ 证据：原始消息、工具输出、文件、diff、网页快照 │  ← 只读、不参与注入
        └────────────────────────────────────────────┘
```

| 层 | 内容 | 不可变性 | 写入时机 | 生命周期 |
|---|---|---|---|---|
| L0 证据 | 消息原文、工具调用与结果、文件/页面快照、diff、附件 | 追加后不可改（可加密、可过期） | 会话过程实时落 | 按证据 TTL 与引用关系清理 |
| L1 情节 | 一段会话/一个步骤/一次任务的摘要与上下文 | 追加，可被更高层引用 | 任务或步骤结束时 | 中期，随被引用而续命 |
| L2 事实 | 可独立理解的命题：谁-做了什么/是什么-条件-时间 | 版本化：新事实替代旧事实，旧事实标 superseded 不删除 | 提取管线异步写入 | 权重衰减 + 冲突替代 |
| L3 概念 | 跨事实归纳的抽象：用户偏好、项目约束、有效做法、失败教训 | 可合并、可再抽象 | 睡眠整合（周期性）或高置信事实晋升 | 长期，靠使用与复习维持 |
| L4 画像 | 项目级/用户级的稳定背景：目标、成功判据、技术栈、沟通偏好、关键决策清单 | 覆盖式更新，保留历史版本 | 项目创建/里程碑完成/显式更正 | 与项目同寿；用户画像跨项目 |

**读取规则（关键）**：
1. 每轮默认注入 L4 摘要（≤200 tokens）+ 与当前任务相关的 L3 概念卡（≤N 张）；
2. L2 事实只在检索命中且需要通过"具体细节"回答时注入，每条带 evidence id；
3. L0/L1 永不直接注入；模型可调用 `memory.evidence(id)` 工具下钻，工具返回压缩后的证据摘要 + 原文句柄；
4. 每条注入内容带 `updated_at` 与 `confidence`，模型据此判断可用性。

## 3. 标签体系：决定"这条记忆怎么管"

每条记忆携带多维标签，标签不是装饰，而是策略选择器（详见 §4 策略表）。

| 维度 | 取值 | 作用 |
|---|---|---|
| `type` | preference / constraint / decision / fact / event / procedure / anti_pattern / intention / entity / scratch；L3 资产子类：`skill`（可复用步骤+触发边界+验证方式+版本）/ `wiki`（结构化知识+双链）/ `code_graph`（符号/调用/影响面） | 决定初始重要性、半衰期、注入优先级 |
| `source` | user_explicit / user_implicit / tool_observed / agent_inferred / external_doc / system | 决定可信度与是否可被自动覆盖 |
| `scope` | global / project / task / agent | 决定隔离与共享范围（服务端强制过滤；任务与执行体默认不可跨项目） |
| `stability` | permanent / durable / ephemeral | 决定是否参与衰减与 TTL |
| `sensitivity` | public / internal / secret | 决定加密、脱敏、是否允许进入模型上下文 |
| `stage` | raw / extracted / consolidated / archived / superseded | 管线阶段，驱动睡眠整合 |
| `topic[]` | 自由标签（领域、实体、技术栈…） | 检索与筛选 |

标签组合示例：
- `type=preference, source=user_explicit, stability=permanent` 至 高权重、长期保留、每轮可注入；
- `type=fact, source=tool_observed, stability=durable` 至 中权重、需证据、冲突时优先被工具新结果覆盖；
- `type=scratch, source=agent_inferred, stability=ephemeral` 至 低权重、3 天 TTL、不进长期库；
- `type=decision, source=user_explicit` 至 需人工确认才可删除，冲突时保留两版并标记待裁决。

L3 资产子类（`skill` / `wiki` / `code_graph`）与 fact/preference 同域但**不同策略**：必须带版本链、来源与 ACL（项目内可见性），不参与普通衰减，更新走版本追加而非覆盖。

### 3.1 作用域与有效性

| 作用域 | 保存内容 | 默认访问 |
|---|---|---|
| 全局 | 用户长期偏好与通用经验 | 跨项目可用 |
| 项目 | 项目知识、架构决策 | 项目内可用 |
| 任务 | 当前任务经验与临时事实 | 当前任务优先 |
| 执行体 | 特定执行体的临时工作信息 | 隔离访问 |

项目记忆默认不因语义相似自动跨项目共享。跨项目复用必须经过显式共享策略。

每条记忆同时带有效性状态（活动、被替代、无效、归档）与记录时间、生效时间、失效时间。事实有效性与保留策略分开建模：有效性决定是否注入，保留策略决定保留多久，热度只影响排序。

## 4. 权重模型与记忆衰竭

### 4.1 定义

对一条记忆 `m`，定义记忆强度 `w ∈ [0,1]`，表示"此刻它有多值得被想起/保留"：

```text
w(m, t) = I(m) ， exp( − Δt / S(m) ) ， (1 − conflict_in_context(m))    ，且 w ≥ w_floor；pin 时 w ≡ 1
```

- `Δt`：距上次被有效使用（或创建，若从未使用）的天数；
- `I ∈ [0,1]`：内在重要性（salience），由类型、来源、置信度决定，见 4.2；
- `S > 0`：记忆强度寿命（天），相当于遗忘曲线的时间常数，见 4.3；
- `w_floor`：衰减下限，默认 0.02，避免权重归零后失去排序意义；权重只用于排序与注入，不单独决定删除；删除由有效性、保留策略与隐私要求决定；
- `conflict_in_context`：同主题旧版本在同一上下文出现时的压制项（0–1）；冲突对用户的伤害通常大于权重低，见 §7.3.1。

语义：
- 重要且经常被使用的记忆衰减慢（S 大）；
- 不重要、长期不用的记忆快速衰减；
- 用户明确要求记住的（pin）不衰减，权重恒为 1；
- 权重变化直接改写保留周期与注入层级（§4.4）。

与业界公式的对应关系（见 [04-memory-landscape.md §5](../research/04-memory-landscape.md)）：
- 本式与"半衰期形式" `w = w0 ， 2^(−Δdays / H)` 等价，`H = S ， ln2`（S=180 天 ≈ 半衰期 125 天）；文档用 S 表示"强度寿命"，便于用使用次数直接强化；
- 权重复用三件事：**重要度**（写入时按类型/来源给定，即 I）、**时效**（指数衰减）、**强化**（被有效使用后 S 增大），这与 LangMem 所说"relevance = similarity + importance + strength"一致；
- 权重首先是**排序偏置**，其次才是**保留策略**：低权重 ≠ 立即删除（Mem0 Decay 的做法是乘 0.3–1.5 的排序因子、永不归零）；删除由 TTL 与阈值单独决定（§4.4、§7）；
- 参数必须用自有任务分布校准，不能照搬论文数值（Generative Agents 的 0.995/小时只适用于其模拟场景，MemoryBank 的 S 是离散强化而非半衰期）。

### 4.2 内在重要性 I

```text
I(m) = clamp( type_base(m) × source_mult(m) × confidence(m), 0, 1 )
```

初始值表（可配置，不写死在代码里）：

| type | type_base | 默认 S0（天） | 说明 |
|---|---|---|---|
| constraint | 0.95 | 365 | 用户/项目硬约束，错了代价最高 |
| decision | 0.90 | 365 | 已确认的决策，需证据，删除需确认 |
| preference | 0.80 | 180 | 偏好，跨会话复用 |
| anti_pattern | 0.80 | 365 | 失败教训，防止重犯 |
| procedure | 0.75 | 180 | 可复用做法/技能 |
| intention | 0.70 | 至截止日 | 到期自动降级为 fact 或归档 |
| fact | 0.60 | 60 | 事实，会过时 |
| entity | 0.50 | 90 | 人/地点/组织/系统 |
| event | 0.40 | 30 | 发生过什么 |
| scratch | 0.20 | 3 | 临时工作记忆，不进长期库 |

| source | source_mult | 说明 |
|---|---|---|
| user_explicit | 1.00 | 用户明确陈述或"请记住" |
| tool_observed | 0.70 | 工具/环境返回，可被新证据推翻 |
| user_implicit | 0.75 | 从用户行为推断 |
| system | 0.60 | 系统配置/规则 |
| external_doc | 0.55 | 外部文档，可能过期 |
| agent_inferred | 0.45 | 模型归纳，必须带证据，易错 |

`confidence`：提取时的自评置信度（0–1），由抽取模型给出并记录；冲突时下调。

### 4.3 记忆寿命 S 与强化

```text
S(m, t) = S0(m) × (1 + ρ ， n_use(m)) × conflict_penalty(m)
```

- `S0`：来自上表；
- `n_use`：被"有效使用"的累计次数（有效 = 被注入且任务成功 / 用户未纠正 / 被后续事实引用）；
- `ρ`：强化系数，默认 0.30，且 `S ≤ S_max`（默认 3 年），防止无限膨胀；
- `conflict_penalty`：被新事实替代后置 0.25，保留审计与回溯，但快速退出注入。

强化事件（只认这些，避免模型自嗨）：
1. 记忆被注入且该轮任务被验证通过（测试通过/交付验收）；
2. 记忆被引用进产物（汇报、文档、代码），且产物被接受；
3. 用户显式确认（"对，就是这样"）。

惩罚事件：
1. 被新事实替代 至 `superseded`，conflict_penalty = 0.25；
2. 被注入但用户纠正 至 confidence × 0.7，连续两次纠正则归档待人工确认。

### 4.4 权重决定保留周期与管理方式

保留周期由权重反解得到，做到"权重一变，保存周期就变"：

```text
T_retain(m) = max( 0, S(m) ， ln( I(m) / θ_archive ) )         （天；避免 I < θ_archive 时为负）
T_inject(m) = S(m) ， ln( I(m) / θ_inject )          （可注入窗口）
T_next_review(m) = t_access + S(m) ， ln( 1 / θ_review )
```

默认阈值（可配置；**均为 D 级待校准参数**，改动须附评测报告）：

| 阈值 | 默认值 | 含义 |
|---|---|---|
| θ_inject | 0.15 | 低于此值不再默认注入（仍可被检索） |
| θ_warm | 0.35 | 低于此值降为温层：只给概念卡摘要 |
| θ_archive | 0.06 | 低于此值归档：只保留索引与证据指针 |
| θ_purge | 0.02 | 低于此值且无引用/无保留义务 至 清除索引，证据按 TTL 清理 |
| θ_review | 0.50 | 复习调度阈值（间隔重复） |

层级映射（由 w 推导，不另存状态）：

| 权重区间 | 层级 | 注入方式 | 存储 |
|---|---|---|---|
| w = 1（pin） | 永久 | 必注入（若与任务相关） | 主库 + 索引 |
| w ≥ 0.6 | 热 | 完整概念卡 + 证据可展开 | 主库 + 索引 |
| 0.35 ≤ w < 0.6 | 温 | 一句话摘要 + 日期 | 主库 + 索引 |
| 0.15 ≤ w < 0.35 | 凉 | 仅索引，需显式检索 | 主库 + 索引 |
| 0.06 ≤ w < 0.15 | 冷 | 仅索引，低优先级 | 归档表 + 索引 |
| w < 0.06 | 归档 | 不可检索，仅审计可查 | 归档表，索引待重建 |
| w < 0.02 且无引用 | 清除 | ， | 删除派生索引，证据按 TTL |

pin 的语义：`pinned=true` 至 `w≡1`、不衰减、不自动清理。pin 表示更强的保留承诺，不表示内容永远正确；事实被替代或标记无效时，pin 不阻止失效标记与冲突提示。pin 必须记录 `pinned_by`、`pinned_at`、`reason`。

### 4.5 参数校准

- 上述 `S0`、`ρ`、阈值都是可配置参数，不是常量；配置落在 `memory.config`，可热更新；
- 校准方法：用 §13 评测集做网格/贝叶斯搜索，目标函数 = 任务通过率 − λ，记忆注入 token 量 − μ，陈旧事实注入率；
- 任何参数改动必须留下评测报告（前后对比），不做"拍脑袋调参"。

## 5. 写入：什么时候写、写什么

### 5.1 写入触发点

| 触发 | 写入层 | 同步/异步 |
|---|---|---|
| 会话结束 / 任务结束 | L1 情节 + L2 事实 | 异步（不阻塞主循环） |
| 每 N 轮对话（默认 N=5） | L1 抽取（原子事实候选） | 异步批处理（业界默认节奏，避免每轮调 LLM） |
| 上下文压力（token 超阈值） | 先落证据再压缩 | 同步落盘 + 异步抽取 |
| 用户显式"记住/以后都这样" | L2/L3 + pin 候选 | 同步确认 + 异步落库 |
| 工具产出关键结果（文件、diff、测试报告） | L0 证据 + L2 事实 | 异步 |
| 决策点（用户拍板 / 计划确认） | L2 decision + L4 画像 | 异步 |
| 纠正/冲突（用户否定旧记忆） | L2 新版本 + 旧版 superseded | 同步标记，异步重算 |
| 周期性睡眠整合 | L3 概念、去重、冲突修复 | 后台任务 |

### 5.2 提取什么（过滤规则）

必须提取（覆盖检查清单，借鉴货拉拉七类维度）：偏好与禁忌、稳定背景、计划与意图、领域约束、决策与理由、可复用做法、失败教训。

不提取：
- 寒暄、客套、复述、空泛评价；
- 一次性情绪或临时状态（除非反复出现）；
- 无来源的 AI 推测（必须标 `agent_inferred` 且带证据，否则不写）；
- 与已有事实重复且无新增信息的内容（只累加 `n_use`/证据，不新增条目）；
- 敏感信息默认不写入，除非用户显式要求且允许存储（标 `secret` 并加密）。

### 5.3 写入管线

```text
事件流（L0）
  至 任务调度（聚合同一会话、并发限流、失败重试、死信可见）
  至 提取（候选事实：独立可理解、带来源、带时间、带条件）
  至 去重与冲突判定（ADD / UPDATE / SUPERSEDE / NOOP）
  至 事实主记录落库（不可变版本 + superseded 链）
  至 实体链接 + 概念标签 + 关联记忆
  至 派生索引异步更新（向量 / 全文 / 实体）
  至 晋升候选（高置信、重复出现的 L2 至 L3）
```

冲突判定（对每条候选事实）：
- 已有同主-谓-宾且条件一致：ADD 证据、累加强化、更新 `last_confirmed_at`（NOOP 但不丢证据）；
- 条件或时间不同：视为新版本，旧版置 `valid_to`，链式保留；
- 语义矛盾且无法判断新旧：两条并存，标 `conflict=true`，注入时都带"存在冲突"标记，等待用户或后续证据裁决；
- 用户显式否定：新事实取代，旧事实 `superseded`，并记录否定来源。

**双保险（复核结论）**：写入时冲突消解**不能砍**，Mem0 v3 的 ADD-only 在可变态事实上有可证伪反例（issue #4956）。因此采用"写入消解 + 检索侧时效重排"双保险：检索时对同一 (主语, 谓词) 只输出最新有效版本，旧版本折叠为"历史值"。

**增量更新**：L3 概念每次只 append 一条结构化增删（+策略 / −反例 / ~条件）并保留版本链（`memory_revision`），禁止用 LLM 重写整张概念卡（ACE 的 brevity bias / context collapse）。

写入必须是**异步管线**：主循环只在必要时发一个 `memory/write` 任务，不等待 LLM 抽取完成。

## 6. 读取：检索、排序、注入

### 6.1 三路召回

| 召回 | 作用 | 补充信号 |
|---|---|---|
| 向量召回 | 语义相近（措辞不同） | 基础候选集 |
| 全文召回（BM25） | 关键词、专有名词、缩写 | 只对向量候选加权，不扩候选 |
| 实体召回 | 同一人/地/组织/时间/文件 | 只对向量候选加权，不扩候选 |

对齐货拉拉结论：向量定范围，全文与实体补权重，避免三路结果直接合并导致噪声。

### 6.2 两阶段排序

粗排（可计算信号融合，归一化后加权）：

```text
score = 0.45，sim + 0.25，w + 0.10，recency + 0.10，entity/tag_match + 0.10，scope_priority
```

- `sim`：向量余弦（L2 归一化后内积，映射到 0–1）；
- `w`：§4 的记忆强度；
- `recency`：`exp(−Δt/30天)`，避免只用旧记忆；
- `scope_priority`：project > user > global（当前项目记忆优先）；
- 硬过滤：`scope` 不匹配直接排除；`sensitivity=secret` 未获授权排除；`w < θ_inject` 且非显式检索时降权。

精排：对 top-50 用交叉编码器或小模型判断"是否真的支持当前问题"，取 top-K（默认 K=8，按配额调整）。

### 6.3 注入

- 配额：记忆注入不超过上下文配额的 15%（默认），按任务类型可调；
- 形式：概念卡（一卡一条），字段：内容（≤50 字）、类型、置信度、更新时间、证据 ID、冲突标记；
- 顺序：项目画像 至 约束/决策 至 相关偏好/经验 至 事实；
- 展开：模型调用 `memory.evidence(id)` 获取证据摘要与原文句柄，按需消耗配额；
- **注入前去冲突**：同一 (主语, 谓词) 只出一条；其余旧版本折叠为"历史值（上次 2026-09）"，不并列注入；
- 记录：注入内容必须作为 `memory/recalled` 事件写入会话日志（满足 "模型可见 ⟺ 已记录"）。

概念卡示例：

```text
[约束] 本项目所有交付物必须附来源链接（confidence 0.95，2026-11-05，ev: ev_10231）
[偏好] 偏好中文回答，代码注释用英文（0.85，2026-11-02，ev: ev_10004）
[教训] 上次直接改主分支被拒，须走 PR（0.90，2026-10-28，ev: ev_09877）
```

## 7. 遗忘、删除与隐私

### 7.1 三种"忘记"

| 类型 | 触发 | 行为 | 可恢复 |
|---|---|---|---|
| 软遗忘 | w 降至 θ_archive 以下 | 移出默认注入与主检索，仅审计可见 | 是（重新命中可唤醒） |
| 归档 | 长期未用且证据仍在 | 主记录归档，索引保留低权重条目 | 是 |
| 硬删除 | 用户删除 / 隐私要求 / 保留期到期 | 删除主记录 + 派生索引 + embedding + 缓存 + 摘要中的直接引用 | 否（保留删除审计，不含内容） |

### 7.2 删除的完整语义

- 删除是**级联**的：L2 事实删除 至 引用它的 L3 概念需重算或标脏 至 含它的向量/全文索引删除 至 概念卡缓存失效；
- 删除是**可验证**的：删除接口返回后，同一查询在 60s 内不得再命中（测试用例覆盖）；
- 删除是**可审计**的：记录 `memory/forgotten` 事件（id、原因、时间、发起者），不保留内容；
- 例外：被 `decision` 引用且有合规保留义务的证据，删除内容但保留哈希与元数据，并在 UI 标注"依保留义务留存元数据"。

### 7.3 睡眠整合（后台周期任务）

借鉴货拉拉离线侧的轻睡/深睡/REM 与 Generative Agents 的反思机制：

| 周期 | 做什么 | 频率 |
|---|---|---|
| 轻睡（每会话后） | 合并重复事实、补实体链接、标记可疑冲突 | 每次任务结束 |
| 深睡（每日） | 归纳 L3 概念、重算画像、清理过期证据、重排权重 | 每日低峰 |
| REM（每周） | 跨项目模式归纳、反模式提炼、被遗忘记忆的抽样复活检查 | 每周 |

#### 7.3.1 干扰治理（复核新增）

- **冲突感知时间标签**：新事实进入上下文时自动压制同主题旧事实，旧值以"历史值"折叠；
- **信号触发整合**：除固定节奏外，用"冲突率 / 陈旧命中率 / 上下文压力"作为触发信号，高频项目更早整合、低频项目不白跑；
- **冲突率是一级指标**：注入的内容里存在矛盾对的比例，进入 §13 指标表。

睡眠任务必须可中断、可重放、有配额上限；每次产出写 `memory/consolidated` 事件。

## 8. 数据模型

主记录（SQLite，示意）：

```sql
-- 事实/概念主记录（不可变内容 + 可更新状态）
CREATE TABLE memory_item (
  id            TEXT PRIMARY KEY,           -- ulid
  layer         INTEGER NOT NULL,           -- 0..4
  type          TEXT NOT NULL,
  source        TEXT NOT NULL,
  scope_kind    TEXT NOT NULL,              -- user | project | session | global
  scope_id      TEXT NOT NULL,
  content       TEXT NOT NULL,              -- 抽象内容（模型可读）
  normalized    TEXT NOT NULL,              -- 归一化文本（去重键）
  confidence    REAL NOT NULL,
  importance    REAL NOT NULL,              -- I
  s0_days       REAL NOT NULL,              -- 初始寿命
  strength_days REAL NOT NULL,              -- 当前 S
  w             REAL NOT NULL,              -- 冗余存储，便于索引与排序
  pinned        INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL,              -- active | superseded | invalid | archived | deleted
  recorded_at   TEXT NOT NULL,              -- 记录时间
  superseded_by TEXT,                       -- 替代记录
  valid_from    TEXT, valid_to TEXT,
  created_at    TEXT NOT NULL, updated_at TEXT NOT NULL,
  last_access_at TEXT, n_use INTEGER NOT NULL DEFAULT 0,
  sensitivity   TEXT NOT NULL DEFAULT 'internal',
  payload_hash  TEXT NOT NULL
);

-- 证据（L0 指针，不存原文大对象）
CREATE TABLE memory_evidence (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL REFERENCES memory_item(id),
  kind TEXT NOT NULL,                       -- message | tool_result | file | diff | web
  ref TEXT NOT NULL,                        -- 会话事件 id / 文件路径 / URL
  excerpt TEXT,                             -- 短摘要，便于快速展示
  occurred_at TEXT NOT NULL,
  retention_until TEXT
);

-- 标签、实体、关联
CREATE TABLE memory_tag (memory_id TEXT, tag TEXT, PRIMARY KEY (memory_id, tag));
CREATE TABLE memory_entity (memory_id TEXT, entity_id TEXT, role TEXT);
CREATE TABLE memory_link (from_id TEXT, to_id TEXT, relation TEXT, confidence REAL);

-- 生命周期事件（只追加）
CREATE TABLE memory_lifecycle (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT, action TEXT, reason TEXT, actor TEXT, at TEXT, detail_json TEXT
);
```

派生索引（可重建）：`memory_vec(item_id, embedding, model_version)`、`memory_fts(content)`、`memory_entity_idx(entity_id, item_id)`。

一致性规则：
- 主记录是唯一真相；索引删除/损坏可从主记录重建；
- 每次状态变更先写主记录，再发索引更新任务（最终一致，允许秒级延迟）；
- `w` 冗余存储并以睡眠任务每日重算，检索时可用近似值。

## 9. 接口与事件

服务定义（新插件 `memory` 提供）：

```ts
interface MemoryService {
  /** 写入一条候选记忆；返回落库后的条目（异步管线负责抽取时，此接口接收已抽取结果）。 */
  remember(input: RememberInput): Promise<MemoryItem>;
  /** 检索并返回可注入的概念卡；不含 L0 原文。 */
  recall(query: RecallQuery): Promise<RecallResult[]>;
  /** 按证据 id 下钻，返回压缩后的证据与原文句柄。 */
  evidence(evidenceId: string): Promise<EvidenceView>;
  /** 置顶/钦定，权重恒为 1。 */
  pin(itemId: string, reason: string): Promise<void>;
  /** 删除并级联清理派生数据。 */
  forget(itemId: string, reason: ForgetReason): Promise<ForgetReceipt>;
  /** 为一轮对话组装记忆注入块（受配额约束）。 */
  compose(context: ComposeInput): Promise<MemoryInjection>;
}
```

模型可调用工具：
- `memory.search({ query, scope?, type?, limit? })` 至 概念卡列表；
- `memory.evidence({ id })` 至 证据摘要 + 句柄；
- `memory.grep({ pattern, scope? })` / `memory.slice({ id, range? })` 至 程序化访问 L0（PTC 内可直接调用，不只能取摘要）；
- `memory.remember({ content, type, scope, evidence_ids })` 至 用户显式要求时使用；
- `memory.pin({ id, reason })` / `memory.forget({ id, reason })` 至 需用户确认。

会话事件（遵守 model-visible ⟺ logged）：
`memory/recalled`、`memory/written`、`memory/updated`、`memory/superseded`、`memory/pinned`、`memory/forgotten`、`memory/consolidated`。

存储位置说明：**事件是审计锚，不是记忆本体**。记忆本体在 `memory` 存储域；只有"模型可见的注入内容"必须留下可重建的记录（`memory/recalled` 记 id + 摘要 hash + 注入位置）。新增事件类型走 V4 同版本声明合并，若标 `ignorable: true` 需单独评审（兼容性语义见 06-repo-seams.md R1）。

## 10. 与 DSH 基座的集成点（依据 [.ome/research/06-repo-seams.md](../research/06-repo-seams.md)）

| 需求 | 落点（已读确认） | 方式 |
|---|---|---|
| 持久化 | `ctx.storageDomain` + `defineDomain({name:'memory', version:1})` | 新建 Host 包内声明域；非会话存储，json/sqlite 后端可换；**不碰会话 JSONL** |
| 服务 | 新 Host 包 `MemoryService` 至 `ctx.memory` | 函数插件或 Service 类；注册即 effect |
| 注入 | `agent/pre-step`：`next()` 之后向 `decision.messages` 追加 `UserMessage`（先例 `packages/context/agent-instructions`） | 可控顺序、可去重、可做配额；`MessageSourceMap` 声明 `{kind:'memory'}`（属持久化类型变更，需记录） |
| 备选注入 | `ctx.systemPrompt.context()` | 每请求刷新、落成 durable user-role 快照；更简单但每次都涨 token |
| 工具 | `ctx.tools.register(defineTool(...))` | memory_search / memory_write / memory_pin / memory_forget |
| 审计事件 | `SessionEventMap` 声明合并扩展 | **默认不写**；确需写时标 `ignorable: true`，并重生成 catalog + 记录类型变更（否则旧读端拒开老会话） |
| 压缩协同 | `ctx.compaction`（单实现）+ `compaction/summary-error` | 压缩只改上下文视图；证据必须存 storage，不依赖可能被 `replace` 遮蔽的事件 |
| 检索索引 | 存储域无二级索引 至 自建索引后端或外置向量服务 | 主记录在 storage，索引可重建 |
| 项目隔离 | 记忆域内 `scope_kind/scope_id` | projectId 由新 Project 域提供，**不写入 SessionHeader** |
| UI | `packages/api` 新 controller + `packages/client` 新 slot | 记忆浏览/纠正/删除入口 |

约束与风险（来自基座勘定）：
- **不改动会话 JSONL 持久化格式与迁移链**（ADR-0002）：记忆是独立存储域，通过 id/事件引用与会话关联；
- **证据与压缩互斥**：压缩用 `replace` 遮蔽历史、工具结果清理器会改写输出，若记忆证据只存在会话事件里，压缩后证据消失；因此 L0 证据必须落在记忆域自己的存储（或 spill + 记忆域记录 locator）；
- **storage-domain 限制**：open 时全量载入内存、无二级索引、无跨表事务 至 记忆量超过 ~10 万条时需换后端 provider（接口不变）。

## 11. 安全与隐私

1. 作用域强制：检索 SQL 层按 `scope_kind/scope_id` 过滤，不依赖模型自觉；
2. 敏感级：`secret` 默认不注入、不建索引，需显式授权并加密存储；
3. 注入即记录：所有注入内容写 `memory/recalled` 事件，可审计可回放；
4. 防污染：外部内容（网页/文档/工具返回）只能成为 `source=external_doc/tool_observed` 的证据，不能直接生成 `user_explicit` 事实；
5. 用户可纠正：UI 提供"这条记错了/删除"入口，纠正走 supersede 而非静默覆盖；
6. 导出与迁移：导出包必须含 L2/L3 + 证据指针 + 标签策略快照；在空库重建索引后 Recall 掉点 ≤5pp（可验证）；
7. 可迁移性验收：导入至重建至抽查 20 条记忆可下钻证据。

## 12. 失败模式与降级

| 失败 | 影响 | 处理 |
|---|---|---|
| 记忆服务不可用 | 无记忆注入 | 主循环继续（降级为无记忆），记录告警，恢复后补写 |
| 抽取模型连续失败 | 记忆不增长 | 死信队列 + 可见告警；会话结束后重试 |
| 嵌入模型更换 | 索引不可比 | index 带 model_version，后台全量重建，旧索引标记只读 |
| 记忆污染 | 错误事实被反复注入 | 证据强制 + confidence + 冲突标记 + 用户纠正入口 |
| 陈旧事实 | 过期信息误导 | valid_to + TTL + 注入带更新时间，模型可见时效 |
| 删除不彻底 | 隐私风险 | 级联删除 + 60s 内不得再命中的测试 |
| 注入挤占上下文 | 关键信息被挤出 | 配额上限 + 按权重分层注入 + 工具下钻 |
| 证据被压缩遮蔽 | 记忆无法下钻到原文 | L0 证据存记忆域/spill，不依赖可被 replace 遮蔽的会话事件 |
| 事件词汇表分叉 | 读端拒开老会话 | 记忆默认不写 session 事件；确需写时标 ignorable + 重生成 catalog + 记录类型变更 |

## 13. 评测与指标

| 维度 | 指标 | 目标（v0.1 草案） |
|---|---|---|
| 抽取质量 | 事实准确率、重复率、污染率 | 准确率 ≥ 90%，重复率 ≤ 5% |
| 召回 | Recall@8、误召率、陈旧事实注入率 | Recall ≥ 80%，陈旧率 ≤ 5% |
| 注入量 | 记忆注入 token 占比、相对全历史注入的节省 | 占比 ≤ 15%，节省 ≥ 50% |
| 遗忘 | 归档准确率、删除彻底性（删除后命中数=0） | 删除彻底性 100% |
| 延迟 | recall p95、写入异步完成 p95 | 检索 ≤ 150ms，写入 ≤ 60s |
| 冲突 | 注入内容中的矛盾对比例（冲突率）、陈旧命中率 | 冲突率 ≤ 2%，陈旧率 ≤ 5% |
| 端到端 | 有/无记忆的 pass^3 差、人工接管率 | 通过率提升 ≥ 10pp，接管率下降 |

评测集：自建 30 条项目型任务（依赖跨会话记忆）+ **MemoryAgentBench（ICLR 2026）与 MemoryArena（ICML 2026）为主**；LongMemEval 作能力分项参照；LoCoMo 仅作回归防倒退（已近饱和）。新增"记忆是否指导了下一步动作"的成功率指标。任何指标提升必须附**消融**（去掉某机制后是否退化），防止复杂度冒充收益。

## 14. 里程碑（MM1–MM4）

| 阶段 | 交付 | 完成判据 |
|---|---|---|
| MM1 最小闭环 | L0/L2 存储、显式 remember/recall、标签、工具、事件 | 跨会话能答出 5 条用户偏好，且每条可下钻证据 |
| MM2 权重与衰减 | 权重公式、pin、TTL、复习调度、删除级联 | 删除后检索不到；权重变化改变保留周期（单测） |
| MM3 睡眠整合 | 去重合并、冲突修复、L3 概念归纳、画像重算 | 重复事实合并率 ≥ 90%，冲突不丢版本 |
| MM4 项目化与评测 | 项目隔离、跨项目共享规则、评测 harness | 30 条任务报告五项指标齐全 |

## 15. 待决问题

1. 主存储选型：SQLite + sqlite-vec（默认）是否足够支撑 10 万条记忆？需要压测后定；
2. 抽取模型：本地小模型 vs 云模型（用量/延迟/隐私三选二）；
3. 图谱能力：先做实体+关联表，还是直接上图库（建议前者）；
4. 跨项目共享边界：用户偏好与 procedure 可共享，fact/decision 是否允许显式导出共享；
5. 记忆的"用户可见解释"UI：需要展示到什么粒度（概念卡？证据链？权重？）。

## 16. 参考

- 货拉拉《记忆即智能：重构对话式AI Agent认知基座的四层渐进式记忆与自进化系统》(2026-11-04) <https://juejin.cn/post/7703850980559667234>
- 货拉拉《大模型记忆系统（一）：从提取到召回的工程实践》 <https://juejin.cn/post/7673223160665227274>
- TencentDB Agent Memory <https://github.com/TencentCloud/TencentDB-Agent-Memory>（MIT）
- Tencent Hunyuan Hy-Memory <https://github.com/Tencent-Hunyuan/Hy-Memory>（Apache-2.0）；论文 <https://arxiv.org/abs/2606.09483>
- MemoryBank <https://arxiv.org/abs/2305.10250>
- Generative Agents <https://arxiv.org/abs/2304.03442>
- MemGPT <https://arxiv.org/abs/2310.08560>
- Mem0 <https://arxiv.org/abs/2504.19413>
- 完整对比见 [.ome/research/04-memory-landscape.md](../research/04-memory-landscape.md)
