# CI 策略（Fork）

## 现状（2026-11-06）
- **已删除**继承自 DeepSeek Harness 的 27 个 workflow 文件（PR #46）；
- **已禁用**仓库 Actions（`actions/permissions.enabled = false`）；
- 已取消当时排队/进行中的 6 个 run；删除后不再产生新 run 与通知。

## 为什么会有这些 CI
squash 导入基座代码时，`.github/workflows/` 一并进入本仓库；其中大量 job 依赖 DSH 的 secrets、self-hosted runner（`dsh-win-*` 等）、Cloudflare Pages、发布凭据。本 fork 没有这些资源，于是每次 push/PR 都会触发失败或永久排队的 run，形成通知洪水。

## 2026-11-07 更新
- 已新增自建 `.github/workflows/ci.yml`（windows-latest：typecheck/build/品牌测试），替代原"待实现"方案；
- 原"已禁用 Actions"表述作废，当前 Actions 已启用并仅运行自建 workflow。

## 原方案草案（历史）
自建最小、自包含的 CI，不依赖任何上游秘密：

```yaml
# .github/workflows/ci.yml（草案）
name: ci
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 11.28.5 }
      - uses: actions/setup-node@v4
        with: { node-version: 24.9, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run typecheck
      - run: pnpm run build:web
```

启用方式：仓库 Settings 至 Actions 至 Allow all actions，或
`gh api -X PUT repos/shanchuann/Panoptic-Super-Agent/actions/permissions --input <(echo '{"enabled":true}')`。

注意：启用后需在 branch protection 里把 `check` 设为必需检查，才真正形成门禁。
