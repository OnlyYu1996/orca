<h1 align="center">
  <a href="https://github.com/OnlyYu1996/orca"><img src="resources/build/icon.png" alt="赛博包工头" width="64" valign="middle" /></a>
  赛博包工头
</h1>

<p align="center">
  <a href="https://github.com/OnlyYu1996/orca/stargazers"><img src="https://badgen.net/github/stars/OnlyYu1996/orca?label=%E2%98%85" alt="GitHub Star" /></a>
  <a href="https://github.com/OnlyYu1996/orca/releases"><img src="docs/assets/readme-downloads.svg" alt="版本下载量" /></a>
  <img src="https://badgen.net/github/license/OnlyYu1996/orca" alt="许可证" />
  <img src="https://img.shields.io/badge/macOS%20%7C%20Windows%20%7C%20Linux-4493F8?style=flat-square" alt="支持 macOS、Windows 和 Linux" />
</p>

<p align="center">
  <strong>面向并行智能体开发的开源 IDE。</strong><br />
  让 Codex、Claude Code、OpenCode、Pi 等 CLI 智能体在独立 Git 工作树中并行工作，并在一个界面中统一调度、审查和交付。
</p>

<h3 align="center"><a href="https://github.com/OnlyYu1996/orca/releases/latest"><ins>下载赛博包工头</ins></a></h3>

<p align="center">
  <img src="docs/assets/readme-hero.jpg" alt="赛博包工头桌面端并行运行多个智能体工作树" width="960" />
</p>

## 核心能力

- **并行工作树**：一个任务拆给多个智能体，每个智能体使用隔离的 Git 工作树，结果可以并排比较和合并。
- **智能体终端**：支持终端分屏、持久回滚、会话恢复和多个 CLI 智能体并行运行。
- **多智能体编排**：提供消息、任务、分派、决策门和协调器循环，适合结构化协同开发。
- **代码审查**：浏览 Git 变更、逐行批注、查看 GitHub/GitLab 等提供商的评审上下文。
- **内置浏览器自动化**：支持标签页、快照、点击、填写、截图、网络事件与浏览器配置隔离。
- **电脑控制**：在用户明确授权后，让智能体读取并操作 macOS、Windows、Linux 的可见应用界面。
- **SSH 与远程运行时**：支持远程仓库、SSH 工作树、端口转发、断线恢复和无头服务器。
- **移动伴侣端**：可配对桌面运行时，在手机上查看会话、接收通知并继续下发任务。
- **自动化任务**：按计划在现有工作树或每次新建的工作树中运行智能体任务。
- **命令行接口**：使用 `sbbgt` 管理项目、仓库、工作树、终端、浏览器、电脑控制和编排流程。

## 支持的智能体

只要智能体能在终端中运行，就可以接入赛博包工头。仓库已内置或验证的工作流包括 Codex、Claude Code、OpenCode、Gemini、Cursor、Aider、Pi、Droid、Grok、Hermes 等。

## 安装

### 桌面端

从当前仓库的 [GitHub Releases](https://github.com/OnlyYu1996/orca/releases/latest) 下载：

- [macOS Apple Silicon](https://github.com/OnlyYu1996/orca/releases/latest/download/sbbgt-macos-arm64.dmg)
- [macOS Intel](https://github.com/OnlyYu1996/orca/releases/latest/download/sbbgt-macos-x64.dmg)
- [Windows 安装包](https://github.com/OnlyYu1996/orca/releases/latest/download/sbbgt-windows-setup.exe)
- [Linux AppImage](https://github.com/OnlyYu1996/orca/releases/latest/download/sbbgt-linux.AppImage)
- [全部发布文件](https://github.com/OnlyYu1996/orca/releases/latest)

Homebrew Cask 随当前仓库的稳定 Release 更新。首次添加仓库后安装：

```bash
brew tap OnlyYu1996/orca https://github.com/OnlyYu1996/orca.git
brew install --cask orca
```

### 移动端

当前 Fork 未配置上游 App Store、TestFlight 或第三方商店入口。移动端应从当前仓库源码构建，Android 发布产物会附加到当前仓库对应的 `mobile-android-v*` Release。

```bash
cd mobile
pnpm install
pnpm test
pnpm exec expo prebuild
```

## CLI

主命令为 `sbbgt`：

```bash
sbbgt open
sbbgt status --json
sbbgt worktree create --name feature-a --agent codex --prompt "实现功能并补充测试"
sbbgt terminal list --worktree active --json
sbbgt computer permissions
```

`orca`、`orca-ide` 和 `orca-dev` 仅作为旧版本兼容入口保留一个正式版周期。新脚本、文档和自动化应使用 `sbbgt` / `sbbgt-dev`。

远程运行时优先读取 `SBBGT_PAIRING_CODE`、`SBBGT_ENVIRONMENT` 等新环境变量；兼容周期内继续回退读取对应的 `ORCA_*` 变量。新配对链接使用 `sbbgt://`，旧 `orca://` 链接仍可解析。

## 本地开发

要求 Node.js 24 和 pnpm。开发模式：

```bash
pnpm install
pnpm dev
```

提交前建议运行：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

移动端验证：

```bash
cd mobile
pnpm typecheck
pnpm lint
pnpm test
```

跨平台、SSH、Git 2.25 基线、设计系统和注释要求见 [AGENTS.md](AGENTS.md)。UI 修改必须遵循 [docs/STYLEGUIDE.md](docs/STYLEGUIDE.md)。

## 品牌与兼容迁移

产品身份的单一来源位于 [src/shared/product-identity.json](src/shared/product-identity.json)：

| 项目          | 当前值                    | 旧版兼容值               |
| ------------- | ------------------------- | ------------------------ |
| 产品名        | 赛博包工头                | Orca                     |
| CLI           | `sbbgt`                   | `orca`、`orca-ide`       |
| 配对 Scheme   | `sbbgt://`                | `orca://`                |
| 仓库配置      | `sbbgt.yaml`              | `orca.yaml`              |
| 私有目录      | `.sbbgt/`                 | `.orca/`                 |
| Desktop AppID | `com.onlyyu.sbbgt`        | `com.stablyai.orca`      |
| Mobile AppID  | `com.onlyyu.sbbgt.mobile` | `com.stably.orca.mobile` |

迁移遵循“新写入、双读取、不删除旧数据”。架构与迁移细节见 [中文化与品牌迁移设计基线](docs/reference/cyber-foreman-localization-brand-migration.md)。

## 上游同步

本仓库的产品发布、更新、反馈和下载入口均属于 [`OnlyYu1996/orca`](https://github.com/OnlyYu1996/orca)。[`stablyai/orca`](https://github.com/stablyai/orca) 仅作为源码上游和许可证归属来源。

- `origin`：`https://github.com/OnlyYu1996/orca.git`
- `upstream`：`https://github.com/stablyai/orca.git`
- 记录的上游基线：`6e1aa8503c688f85d16b4c72981e2f5e862e491f`

后续同步应使用仓库内 `sync-orca-upstream` Skill，先审计上游差异，再保护品牌身份、发布链、中文目录和兼容迁移文件，最后运行完整验证门禁。

## 反馈与安全

- 功能建议与问题反馈：[OnlyYu1996/orca Issues](https://github.com/OnlyYu1996/orca/issues/new/choose)
- 版本记录：[OnlyYu1996/orca Releases](https://github.com/OnlyYu1996/orca/releases)
- 源码贡献：[贡献指南](.github/CONTRIBUTING.md)

当前 Fork 未配置自有反馈、诊断上传、遥测、Cloud、社区或商店服务时，对应入口默认关闭，不会回退到上游服务。

## 许可证与上游归属

本项目基于 [`stablyai/orca`](https://github.com/stablyai/orca) 进行二次开发，继续使用 [MIT License](LICENSE)。版权和许可证文本中的上游名称属于法律归属，不参与产品品牌替换。
