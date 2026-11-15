---
description: "Panoptic Super 维护者手动管理 Issue 与拉取请求的约定。"
---

# Issue 管理

[English](README.md) | 中文

## 拉取请求策略

使用 `Refs #N` 关联本仓库 Issue 作为上下文；PR 解决该 Issue 时使用关闭关键字。使用一个 `kind/*` 标签及相关 `area/*` 标签；[标签分类](../../.agents/notes/implemented/process/2026-08-08-unified-github-label-taxonomy.zh.md)说明其含义。需要时通过 GitHub 维护 Issue 类型与优先级。

## 生命周期事件

维护者直接在 GitHub 更新 Issue 状态和请求评审。本仓库不运行 Project 生命周期机器人或加权审批发布器，也不访问上游组织的 Project 或审批 App。

## 配置与限制

当前唯一维护的托管工作流是 [ci.yml](../workflows/ci.yml)。它在 Windows 验证源码检出，仅具有仓库读取权限，不发布软件包、预览、审批分数或 Project 字段。

## 验证

执行 [dsh-pre-push-checks](../../.agents/skills/dsh-pre-push-checks/SKILL.md)选择的本地检查，再查看 PR 的检查与评审状态。[CI 策略](../../.ome/CI-POLICY.md)记录本仓库运行器和运行时选择。
