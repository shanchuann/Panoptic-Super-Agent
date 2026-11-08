---
kind: upgrade-guide
description: Node runtime requirements for Panoptic Super development and CLI installations.
---

# Node runtime

English | [中文](guide.zh.md)

## Change

Panoptic Super supports Node 24.15.0 or later within the 24.x series, or Node 26 and later. Node 25 is excluded. Development checkouts pin Node 24.15.0 through `devEngines.runtime`; `.node-version` and CI use the same version. Existing profiles and Session data stay in place.

## Migration

1. In a development checkout, use pnpm 11.28.5 and run `pnpm install`. pnpm installs the pinned project runtime without replacing the system Node installation. Check `pnpm node --version`, then run `pnpm run typecheck` and `pnpm run build`.
2. For a standalone CLI installation, upgrade the Node executable used to install and launch it, and verify `node --version` meets the supported range.
3. Before building a Desktop distribution, verify its bundled Electron Node version satisfies the dependencies it ships.
