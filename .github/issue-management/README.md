---
description: "Manual Issue and pull-request conventions for Panoptic Super maintainers."
---

# Issue management

English | [中文](README.zh.md)

## Pull-request policy

Link a same-repository Issue with `Refs #N` for context or a closing keyword when the PR resolves it. Use one `kind/*` label and the relevant `area/*` labels; the [label taxonomy](../../.agents/notes/implemented/process/2026-08-08-unified-github-label-taxonomy.md) describes their meanings. Maintain Issue Type and Priority through GitHub when applicable.

## Lifecycle events

Maintainers update Issue status and review requests directly in GitHub. This repository does not run a Project lifecycle bot or weighted approval publisher and does not access the upstream organization's Project or approval App.

## Configuration and limitations

The only maintained hosted workflow is [ci.yml](../workflows/ci.yml). It verifies the source checkout on Windows and has read-only repository permissions. It does not publish packages, previews, approval scores, or Project fields.

## Verification

Run the local checks selected by [dsh-pre-push-checks](../../.agents/skills/dsh-pre-push-checks/SKILL.md), then inspect the PR's checks and review state. [CI policy](../../.ome/CI-POLICY.md) records this repository's runner and runtime choices.
