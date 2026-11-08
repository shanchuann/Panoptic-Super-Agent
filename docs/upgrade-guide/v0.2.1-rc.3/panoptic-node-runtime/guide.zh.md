---
kind: upgrade-guide
description: Panoptic Super 开发与 CLI 安装的 Node 运行时要求。
---

# Node 运行时

[English](guide.md) | 中文

## 变更

Panoptic Super 支持 Node 24.x 系列的 24.15.0 或更新版本，或 Node 26 及后续版本，不支持 Node 25。开发仓库通过 `devEngines.runtime` 固定 Node 24.15.0；`.node-version` 与 CI 使用相同版本。现有 profile 和 Session 数据保留原位置。

## 迁移

1. 在开发仓库中使用 pnpm 11.28.5，执行 `pnpm install`。pnpm 安装固定的项目运行时，不替换系统 Node。用 `pnpm node --version` 确认版本，再执行 `pnpm run typecheck` 和 `pnpm run build`。
2. 独立安装 CLI 时，升级用于安装和启动它的 Node 可执行程序，并用 `node --version` 确认版本符合支持范围。
3. 构建 Desktop 发行包前，确认 Electron 内嵌的 Node 版本符合随包依赖的要求。
