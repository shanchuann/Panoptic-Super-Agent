---
description: "万象超级智能体开发与 CLI 安装的 Node 要求。"
kind: "upgrade-guide"
---

# Node 运行时

[English](guide.md) | 中文

## 变更

万象超级智能体要求 Node 24.x 系列的 24.15.0 或更新版本，或 Node 26 及后续版本；升级后的依赖不支持 Node 25。

## 迁移

安装依赖或启动 CLI 前，先升级 Node 并通过 `node --version` 确认版本。仓库的 `.node-version` 与 CI 使用 24.15.0，然后运行 `pnpm install` 和 `pnpm run typecheck`。

此要求适用于开发仓库和外部 CLI 运行时，不会迁移现有 profile 或 Session 数据。桌面发行包采用要求此最低版本的依赖前，必须验证其 Electron 内嵌的 Node 版本。
