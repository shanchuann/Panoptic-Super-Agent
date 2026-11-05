# B-001 基线验证记录

- 基座：D:\Code\deepseek-harness（master @ 22ddee3792）
- 日期：2026-11-05
- 环境：Node v24.9.0，pnpm 11.28.5，Windows 原生

| 步骤 | 命令 | 结果 | 耗时 | 证据 |
|---|---|---|---|---|
| 构建 | `pnpm run build` | exit 0，10 gates PASS | 63.38s | build.log |
| 类型检查 | `pnpm run typecheck` | exit 0，5 gates PASS | 16.28s | typecheck.log |
| focused 测试 | `pnpm exec vitest run packages/core/session` | 20 files / 574 tests PASS | 2.85s | test-core-session.log |
| Web 冒烟 | `pnpm dsh web --no-open` | 起在 127.0.0.1:3080；401→token→200 | — | web.log / web-index.html |

结论：B-001/B-002/B-003 通过；基座未产生源码改动（git status 0 行）。B-004 已回填 BROWNFIELD-BASELINE §4。
