# GitHub MCP 配置（开发环境）

> 目的：让本机 DSH 会话具备 GitHub 操作能力（PR/Issue/代码检索等）。
> 服务器：官方 [github/github-mcp-server](https://github.com/github/github-mcp-server) 的远程端点（Streamable HTTP）。

## 配置位置
`C:\Users\15375\.dsh\profiles\desktop\cordis.patch.yml`（DSH desktop profile 的 patch 层）

```yaml
- insert:
    - id: mcp-github
      name: "@deepseek-ai/dsh-mcp-client"
      config:
        serverName: github
        transport: streamable-http
        url: https://api.githubcopilot.com/mcp/
        headers:
          Authorization: "Bearer <GITHUB_TOKEN>"
        toolCallTimeoutMs: 120000
```

## 认证
- 当前使用 `gh auth token`（OAuth）写入本机 profile 配置；**位于用户目录，不在本仓库**。
- 轮换：更新 profile 配置中的 Bearer 值，或重启 DSH 使其重载。
- 权限范围：`repo`（读取/写入代码与 PR）；如需合并改动 `.github/workflows/*` 的 PR，token 还需 `workflow` 作用域（`gh auth refresh -s workflow`）。

## 生效与验证
1. DSH 重载配置或重启桌面端；
2. 工具以 `mcp__github__<tool>` 命名出现（如 `mcp__github__list_pull_requests`）；
3. 端点连通性可独立验证：对 `https://api.githubcopilot.com/mcp/` 发送 MCP `initialize`，带 Bearer token 应返回 200。

## 备份
`cordis.patch.yml.bak-before-github-mcp`（改动前快照）。
