# ADR-0011 Side agent

English | [中文](ADR-0011-side-agent.zh.md)

- Status **Accepted** (requested by the user on 2026-11-08)
- Decision owner user | Recorder Lead | References [design/side-agent.md](../../.ome/design/side-agent.md), [contracts/side-agent.md](../../.ome/contracts/side-agent.md), ADR-0003, ADR-0006

## Context

The user may have a question while the main task is running. Posting it in the main conversation interrupts the agent, changes its context, and moves the timeline away from the user's current position. The user needs a question channel that shares the current context and keeps the main timeline intact.

## Decision

### D1 Store side threads separately from the main conversation

Side threads have their own storage tables and logs. The main agent excludes side-thread records when assembling context, so side messages stay outside the main event log, model requests, unread counts, and message order.

### D2 Take a context snapshot

Opening a side thread captures the project, task, acceptance criteria, constraints, decisions, recent events, and artifact handles. The first phase uses a fixed snapshot. Phase P1.5 adds one-way following from the main conversation. Side threads remain read-only with respect to the main conversation.

### D3 Present the side thread in a sidebar

A right drawer displays the side thread at the current main content width. It has independent scrolling and unread state, so the main conversation keeps its scroll position, unread count, and message order.

### D4 Grant read-only access by default

Side threads use an allowlist of read-only tools. File writes, commands, external messages, and payments require execution in the main conversation after the user brings a suggestion into it.

### D5 Require user confirmation to bring notes into the main conversation

The confirmed note records its source, snapshot version, and the person who confirmed it. The action adds the note and preserves the existing conversation. Only the user can initiate it.

### D6 Manage memory and deletion

Side messages stay outside long-term memory by default. A note brought into the main conversation becomes a memory candidate. Deleting the side thread also deletes its messages, snapshots, and pending notes.

### D7 Deliver the first phase

The first phase covers snapshot context, read-only tools, the sidebar, archiving, bringing notes into the main conversation, and deletion. Later work covers following, artifact references, parallel side threads, and turning suggestions into tasks.

## Alternatives

| Alternative | Reason for rejecting it |
|---|---|
| Store side messages in the main conversation and hide them | The messages would still reach model requests and the event log |
| Use a regular subagent | Subagents execute tasks and the side thread is a user-facing question channel |
| Open a separate conversation | The user would have to repeat the current context |
| Grant writes by default | This conflicts with the read-only default and approval boundaries |
| Automatically bring notes into the main conversation | The user must confirm content before it enters the main conversation |

## Consequences and risks

The user can ask questions and explore ideas while the main task continues with its existing context.

The system adds side-thread storage, snapshot generation, a sidebar, and an audit trail for confirmed notes. When a snapshot is stale, the response should say so.

Prune snapshots to the context budget, use permissions and confirmation to limit side-thread activity, and let the user preview a proposed note before bringing it into the main conversation.

## When to revisit

If the user needs direct writes from the side thread, reevaluate capability grants and approval requirements. If following exposes main-conversation context outside its intended scope, restore fixed snapshots.
