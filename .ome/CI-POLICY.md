# CI 策略

## 当前验证流程

本仓库仅运行自建的 [.github/workflows/ci.yml](../.github/workflows/ci.yml)，触发来源为拉取请求、主分支推送和手动运行。

- 运行器为 GitHub 托管的 `windows-latest`。
- Node 固定为 24.15.0，pnpm 固定为 11.28.5。
- 按冻结锁文件安装依赖，再执行类型检查、完整构建和品牌图标测试。
- 工作流令牌仅具有仓库内容读取权限。

开发仓库通过根清单的 `devEngines.runtime` 使用相同 Node 版本。系统 Node 不需要被替换。

## 发布资源

验证工作流不使用上游的 runner、secrets 或发布资源。签名、正式发布和外部部署由本项目单独配置。原始导入工作流的移除记录见 PR #46。
