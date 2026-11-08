# 旁路智能体契约

## 目的

定义旁路线程、旁路消息、上下文快照与带入主线的接口、事件与不变量。旁路记录与主会话记录分离，主 Agent 默认不可见。

## 类型

~~~ts
interface SideThread {
  id: string;
  projectId: string;
  mainSessionId: string;
  baseEventSeq: number;
  snapshotVersion: string;
  title: string;
  status: "open" | "idle" | "archived";
  createdAt: string;
  archivedAt?: string;
}

interface SideMessage {
  id: string;
  threadId: string;
  role: "user" | "assistant" | "system";
  content: string;
  seq: number;
  sourceEventSeqs: number[];
  createdAt: string;
  promotedAt?: string;
}

interface SideSnapshot {
  id: string;
  threadId: string;
  version: string;
  payload: {
    projectId: string;
    taskId?: string;
    objective?: string;
    criteria: string[];
    constraints: string[];
    decisions: string[];
    recentEvents: Array<{ seq: number; summary: string }>;
    artifactHandles: string[];
  };
  createdAt: string;
}

interface SidePromotion {
  id: string;
  threadId: string;
  messageId: string;
  targetSessionId: string;
  note: string;
  status: "pending" | "confirmed" | "cancelled";
  confirmedBy?: string;
  createdAt: string;
}
~~~

## 服务方法

- createThread(mainSessionId, projectId, title?): SideThread
- ask(threadId, content): Promise<SideMessage[]>
- archiveThread(threadId): void
- requestPromotion(threadId, messageId, note?): SidePromotion
- confirmPromotion(promotionId): SideMessage
- cancelPromotion(promotionId): void
- listThreads(projectId, mainSessionId?): SideThread[]

## 事件

| 事件 | 载荷 | 说明 |
|---|---|---|
| side.thread.created | threadId，mainSessionId，snapshotVersion | 创建线程 |
| side.message.appended | threadId，messageId，role，seq | 追加消息 |
| side.thread.archived | threadId | 归档线程 |
| side.promotion.requested | promotionId，threadId，messageId | 请求带入 |
| side.promotion.confirmed | promotionId，targetSessionId | 确认带入 |
| side.promotion.cancelled | promotionId | 取消带入 |

旁路事件写入独立的旁路日志，不写入主会话事件日志。

## 不变量

1. 主会话事件日志不出现旁路消息。
2. 主 Agent 的上下文装配器不读取旁路记录。
3. 每个旁路线程绑定一个主会话与一个项目，跨项目读取必须失败。
4. 快照版本不可变，重建快照生成新版本。
5. 带入主线必须由用户确认，不能由模型自行触发。
6. 带入写入的是注记，不修改既有主线消息。
7. 删除线程级联删除消息、快照与待确认带入记录。
8. 旁路工具调用只允许只读白名单。
9. 旁路运行有独立步数与时长上限，不占用主会话配额。
10. 主会话结束后旁路可继续，但回复必须提示上下文可能过期。

## 验收

- 旁路消息不出现在主线时间线、未读与滚动位置不变；
- 主 Agent 下一轮上下文不含旁路消息；
- 带入需要确认且带来源与快照版本；
- 跨项目读取被拒绝；
- 删除后不可检索。
