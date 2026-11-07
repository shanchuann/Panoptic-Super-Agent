---
description: "Node requirement for Panoptic Super development and CLI installations."
kind: "upgrade-guide"
---

# Node runtime

English | [中文](guide.zh.md)

Panoptic Super requires Node 24.15.0 or later. Before installing dependencies or starting the CLI, upgrade Node and verify `node --version`. The repository's `.node-version` and CI use 24.15.0. Then run `pnpm install` and `pnpm run typecheck`.

This requirement applies to the development checkout and external CLI runtime. It does not relocate existing profiles or Session data. Desktop packages must validate their bundled Electron Node version before adopting dependencies that require this minimum.
