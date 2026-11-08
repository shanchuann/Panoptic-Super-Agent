---
kind: upgrade-guide
description: Client plugins must use the shared React 19 runtime and types.
---

# React 19 client plugins

English | [中文](guide.zh.md)

## Change

Panoptic Super Web and Desktop use React 19.3 and React DOM 19.3. Client plugins share the application's React instance. Plugins compiled against React 18 must update their dependency declarations and ref types before rebuilding. Session data and profile configuration are unchanged.

## Migration

1. Update client plugin React and React DOM dependency ranges to `^19.3.0`, and React type declarations to `~19.3.0`. Keep React external to the plugin bundle so it uses the application runtime.
2. Pass an initial value to `useRef`; use `undefined` for an initially absent value. Include `null` in `RefObject` element types when mounting can leave the ref empty. Ref callbacks must not implicitly return assignment results.
3. Use the boolean `inert` attribute. Flush timer-driven React updates inside `act` in component tests, and assert mounted output rather than the number of intermediate renders.
4. Run `pnpm install`, `pnpm run typecheck`, focused client tests, and `pnpm run build`. Confirm the built client plugin graph boots before using the rebuilt plugin.
