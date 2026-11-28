---
kind: upgrade-guide
description: "Panoptic Super uses the PCS command, data directory, desktop link scheme, and installer names."
---

# PCS launches Panoptic Super

English | [中文](guide.zh.md)

## Change

Panoptic Super's Web and Desktop profiles use `~/.pcs` as their default data directory. The checkout command is `pnpm pcs`, the command installed by Desktop is `pcs`, and the desktop activation link is `pcs://open`. New installer filenames begin with `pcs-`. The launchers recognize `PCS_HOME` for an alternative data directory.

## Migration

1. Exit Panoptic Super Web and Desktop. If you previously used the default `~/.panoptic-super` and `~/.pcs` does not exist, rename `~/.panoptic-super` to `~/.pcs`. This moves project records, configuration, and credentials together. If both directories exist, set `PCS_HOME` to the one you want to use.
2. Start Web with `pnpm pcs web` from the checkout or start the Panoptic Super desktop application. Open Projects and Models to confirm that your projects and provider settings loaded.
3. To install the desktop terminal command, choose **Manage pcs command** in the application and check `pcs --version` in a new terminal. Replace any Panoptic activation shortcuts with `pcs://open`.
