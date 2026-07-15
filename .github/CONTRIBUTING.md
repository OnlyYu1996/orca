# 为赛博包工头贡献代码

感谢参与赛博包工头的开发。本仓库是 [`stablyai/orca`](https://github.com/stablyai/orca) 的二次开发版本，产品发布和问题跟踪位于 [`OnlyYu1996/orca`](https://github.com/OnlyYu1996/orca)。

## 开始之前

- 一次变更聚焦一个明确的用户改进、缺陷修复或重构。
- 同时考虑 macOS、Linux、Windows、WSL、SSH 和远程运行时，不假设资源只存在于本机。
- 快捷键使用运行时平台判断；Electron 菜单使用 `CmdOrCtrl`。
- 文件路径使用 Node/Electron Path API，不硬编码路径分隔符。
- Git 核心工作流以 Git 2.25 为兼容基线。
- 通用评审流程同时考虑 GitHub、GitLab 和其他已支持提供商。
- UI 修改遵循 [docs/STYLEGUIDE.md](../docs/STYLEGUIDE.md)，使用既有 Token 和 shadcn 组件。
- 修改非显然约束时，用简短中文注释解释原因，不复述代码行为。

## 本地开发

```bash
pnpm install
pnpm dev
```

移动端：

```bash
cd mobile
pnpm install
pnpm test
```

## 分支与提交

分支名应直接描述目标，例如：

- `fix/ctrl-backspace-delete-word`
- `feat/shift-enter-newline`
- `chore/update-contributor-guide`

不要使用 `test`、`misc`、`changes` 等含义不清的名称。普通功能变更不要顺带修改版本号或发布标签。

## 提交 PR 前

运行与 CI 对齐的检查：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

移动端变更还应运行：

```bash
cd mobile
pnpm typecheck
pnpm lint
pnpm test
```

行为变更和缺陷修复应增加能够捕获回归的测试。UI 或交互变更应在受影响平台、亮色/暗色模式和合理的 SSH 延迟条件下验证。

## Pull Request 要求

PR 应包含：

- 用户可见变更和技术边界；
- 已运行的测试与未覆盖风险；
- 视觉变更的截图或录屏；
- 跨平台、SSH/远程、本地、智能体、集成和 Git Provider 兼容性说明；
- 性能、安全和 UI 质量检查结论；
- 没有视觉变更时明确说明。

## 类型声明

项目自有类型优先放在 `.ts` 文件中。`.d.ts` 只用于环境声明和第三方 Ambient Shim，避免 `skipLibCheck` 掩盖项目类型错误。

## 发布流程

版本和标签由维护者通过 [Cut Release](../../actions/workflows/release-cut.yml) 工作流管理，不在普通 PR 中手工发布。

稳定版、RC、macOS 公证、Windows 签名、Linux 构建和移动端 Release 都必须发布到当前仓库 `OnlyYu1996/orca`。未配置自有诊断、遥测或商店凭据时，对应能力保持关闭。

Homebrew 稳定渠道：

```bash
brew tap OnlyYu1996/orca https://github.com/OnlyYu1996/orca.git
brew install --cask orca
```

RC 渠道：

```bash
brew install --cask orca@rc
```

两个 Cask 都安装“赛博包工头.app”，因此互相冲突。切换渠道时正常卸载后重新安装；除非明确需要清除用户状态，否则不要使用 `--zap`。

## 上游同步

同步 `stablyai/orca` 时使用仓库内 `sync-orca-upstream` Skill。上游只用于源码同步和许可证归属，不能覆盖产品身份、中文目录、图标、自有发布链、遥测关闭策略或旧版兼容迁移。
