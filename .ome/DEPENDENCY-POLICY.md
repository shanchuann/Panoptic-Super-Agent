# 依赖升级策略（Fork 维护）

> 本仓库是 DeepSeek Harness 0.2.1-rc.3 的 fork（squash 导入）。依赖组合以导入时基线为准，**不跟进上游**；升级必须本地验证。

## 合并前必须运行的判据
```sh
pnpm install
pnpm run typecheck
# 涉及 Web/客户端依赖时追加
pnpm run build:web
```
缺少上述证据的依赖 PR，不合并。

## 分级
| 级别 | 处理 |
|---|---|
| patch / minor（devDependencies） | 可批量合并，但需一次 install + typecheck |
| major（任何依赖） | 单独 PR，先适配代码再合并；禁止盲合 |
| 工具链（pnpm / tsdown / TypeScript / Electron） | 按 major 处理，并复跑 build |

## 已知必须钉住的版本（导入基线）
| 依赖 | 版本 | 原因 |
|---|---|---|
| `lexical` / `@lexical/*` | 0.49.x | `patches/lexical@0.49.0.patch` 绑定该版本；升 0.52 会出现双版本类型不兼容 |
| `tsdown` | 0.22.x | `scripts/dev-web.ts` 依赖 `TsdownHandle` 旧 API；0.23 类型已变更 |
| `pnpm` | 11.28.5 | 2.x/12.x 与 `packageManager` 固定值冲突，会导致 install 失败 |
| `typescript` | 5.x | 6.x 会改变聚合编译器行为（peer 允许 >=5 <7） |

## Dependabot 建议配置
- 分组：patch/minor 一组、major 各自一组；
- `open-pull-requests-limit: 5`；
- 对上述钉住版本加 ignore 规则；
- 保留 `cooldown`，避免新版本当天进入。
