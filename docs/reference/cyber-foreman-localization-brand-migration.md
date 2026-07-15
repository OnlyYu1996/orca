# 赛博包工头中文化与品牌迁移设计基线

> 状态：目标架构已确认，实施中
>
> 源码基线：`6e1aa8503c688f85d16b4c72981e2f5e862e491f`
>
> 设计日期：2026-07-14
>
> 目标发布仓库：`https://github.com/OnlyYu1996/orca`
>
> 上游同步仓库：`https://github.com/stablyai/orca`

## 1. 目标

本次改造需要同时完成：

1. 桌面端、Web、Mobile、CLI、原生辅助程序和安装包中的用户可见文案中文化。
2. 用户可见产品名由 `Orca` 统一为“赛博包工头”。
3. 更新、下载、版本详情、反馈、支持、问题提交和发布工作流指向当前 Fork。
4. 停止向 Orca 官方网站、反馈服务、遥测或诊断服务发送当前 Fork 的产品数据。
5. 对必须改名的 CLI、协议、配置文件、用户数据和系统标识提供兼容迁移。
6. 保留 MIT 许可证、上游归属和后续同步 `stablyai/orca` 的能力。

这不是全仓文本替换。品牌层、机器标识层、兼容协议层和上游证据层必须分开处理。

## 2. 已确认目标

### 2.1 产品与仓库

| 项目         | 目标                            |
| ------------ | ------------------------------- |
| 中文产品名   | 赛博包工头                      |
| 产品代码仓库 | `OnlyYu1996/orca`               |
| 官方上游     | `stablyai/orca`，仅用于同步源码 |
| 产品更新来源 | 当前 Fork 的 GitHub Releases    |
| 应用图标源   | 用户指定的“赛博包工头”图标目录  |

### 2.2 机器标识与兼容策略

| 标识             | 上游值                   | 已确认目标                | 兼容策略                          |
| ---------------- | ------------------------ | ------------------------- | --------------------------------- |
| 英文辅助名       | Orca                     | Cyber Foreman             | 只用于系统不接受中文的场景        |
| 机器短名         | orca                     | sbbgt                     | 新写入用 `sbbgt`                  |
| npm 包名         | orca                     | sbbgt                     | 不作为用户数据兼容键              |
| CLI              | `orca` / `orca-ide`      | `sbbgt`                   | 至少一个正式版周期保留旧命令代理  |
| 开发 CLI         | `orca-dev`               | `sbbgt-dev`               | 保留旧入口代理                    |
| Desktop AppID    | `com.stablyai.orca`      | `com.onlyyu.sbbgt`        | 新身份发布，首次启动迁移旧数据    |
| Mobile Bundle ID | `com.stably.orca.mobile` | `com.onlyyu.sbbgt.mobile` | 作为新的移动应用身份              |
| 配对 Scheme      | `orca://`                | `sbbgt://`                | 新版本生成新 Scheme，同时解析两者 |
| 仓库配置         | `orca.yaml`              | `sbbgt.yaml`              | 新文件优先，旧文件只读兼容        |
| 仓库私有目录     | `.orca/`                 | `.sbbgt/`                 | 新目录优先，迁移或回退读取旧目录  |
| 环境变量前缀     | `ORCA_*`                 | `SBBGT_*`                 | 新前缀优先，旧前缀回退            |
| 数据文件         | `orca-data.json` 等      | `sbbgt-data.json` 等      | 复制迁移，永不原地删除旧文件      |
| 安装包前缀       | `orca-*`                 | `sbbgt-*`                 | Release 校验与更新清单同步修改    |

`com.onlyyu.sbbgt` 与 `com.onlyyu.sbbgt.mobile` 已确认为本次二开的应用身份。发布证书、Apple Team、Windows Publisher 和域名仍属于发布环境配置，不复用上游签名主体。

## 3. 当前审计基线

### 3.1 本地化现状

- Renderer 已使用 i18next，支持 `en`、`zh`、`ko`、`ja`、`es`。
- 当前默认语言是英文。
- 英文和中文目录各有 10,574 个键，目录结构零缺失。
- 中文目录约有 472 条值仍包含 `Orca`。
- 中英文值完全相同的字符串有 498 条，其中既有合法技术名，也有待翻译项。
- 中文目录存在 `commits`、`token`、`Non-Orca`、`shell` 等术语混杂，需要人工术语审校。
- Mobile 主要使用直接写在 TSX 和 `app.json` 中的英文文案，尚未接入统一目录。
- CLI Help、CLI 人类可读错误、Swift 原生界面和系统权限说明仍以英文为主。

现有 `verify:localization-catalog` 通过；`verify:localization-coverage` 当前因
`TerminalTabLeadingIcon.tsx` 的 `Unread agent completion` 未本地化而失败。该失败应作为实施基线修复，不能被 Allowlist 掩盖。

### 3.2 品牌与服务现状

粗粒度文件审计结果：

| 模式            | 涉及文件数 |
| --------------- | ---------: |
| `Orca`          |      1,540 |
| `stablyai/orca` |        191 |
| `onorca.dev`    |         22 |
| `com.stably*`   |        144 |
| `ORCA_*`        |        611 |

关键运行时绑定包括：

- `package.json` 的名称、Homepage、CLI Bin。
- electron-builder 的 AppID、ProductName、Executable、Artifact、Publisher。
- updater 发布仓库、预发布 Atom Feed 和下载基址。
- 更新提醒 `onorca.dev/whats-new/nudge.json`。
- 反馈与崩溃报告 `www.onorca.dev` / `api.onorca.dev`。
- 文档、隐私、Changelog、支持、Star、Feature Request、Discord 和 X 链接。
- Mobile App Store、APK、官网、支持与仓库链接。
- GitHub Release 工作流中的仓库白名单和官方诊断上传地址。
- macOS Computer Use、通知 Helper、TCC、Bundle ID 和签名路径。
- Windows Launcher、防火墙、安装器和 AppUserModelID。
- Linux `orca-ide` Launcher、包名、Desktop Entry 和 WSL Bridge。

## 4. 迁移原则

### 4.1 用户可见品牌全部替换

应用窗口、菜单、设置、提示、无障碍标签、通知、更新卡片、安装器、权限说明、Mobile 和 CLI 人类可读输出中，不再展示 Orca 品牌。

### 4.2 内部名称不做无收益重命名

以下内容默认保留，避免制造上游同步冲突：

- `OrcaRuntimeService`、`orca-runtime.ts` 等内部类名和文件名。
- i18n Key 路径中的 `orca`。
- IPC Channel、Telemetry Event、数据库字段和已发布 JSON Schema 中的稳定标识。
- 测试中用于兼容旧版数据的 `Orca` / `orca` Fixture。
- 注释中指向上游 issue/PR 的 `stablyai/orca#...`。

只有当内部名称会泄露到用户界面、公开 CLI、磁盘、网络协议或发布物时才进入迁移范围。

### 4.3 兼容标识采用“新写、双读、可回滚”

- 新版本只生成 `sbbgt` 标识。
- 读取时先读新标识，再兼容旧 `orca` 标识。
- 两种标识同时存在时使用明确优先级并提示冲突，不静默合并。
- 迁移前创建备份，迁移后不删除旧数据。
- SSH、WSL、Relay 和 Remote Runtime 必须允许新旧版本短期互操作。

### 4.4 官方上游与产品仓库分离

- `upstream` 只服务源码同步和法律归属。
- `origin` 及 `OnlyYu1996/orca` 服务产品发布、更新、问题与下载。
- 上游 issue/PR 链接若是代码历史证据继续保留。
- 用户点击的支持、Star、版本和反馈入口全部指向当前 Fork。

## 5. 目标架构

### 5.1 产品身份单一来源

新增结构化产品身份配置，建议为 `config/product-identity.json`，至少包含：

```json
{
  "displayName": "赛博包工头",
  "englishName": "Cyber Foreman",
  "machineName": "sbbgt",
  "desktopAppId": "com.onlyyu.sbbgt",
  "mobileAppId": "com.onlyyu.sbbgt.mobile",
  "cliCommand": "sbbgt",
  "urlScheme": "sbbgt",
  "repository": {
    "owner": "OnlyYu1996",
    "name": "orca"
  }
}
```

Build Config、Main、Renderer、CLI 和校验脚本从该配置派生，不在多个模块重复硬编码。GitHub Actions 优先使用 `github.repository` / `GITHUB_REPOSITORY`，仅仓库白名单需要显式写 `OnlyYu1996/orca`。

### 5.2 产品链接单一来源

新增明确命名的产品链接模块，例如 `src/shared/product-links.ts`，统一生成：

- Repository
- Releases / Release Tag
- Issues / New Issue
- Stargazers
- README / Docs
- Android APK
- Privacy

Main、Renderer、Mobile 和测试不能继续各自维护仓库 URL。

### 5.3 品牌遗留审计门禁

新增品牌审计脚本与显式 Allowlist：

- 检查用户可见 `Orca`。
- 检查产品运行时 `stablyai/orca`。
- 检查 `onorca.dev` 和 `com.stably*`。
- 检查新增的旧 Scheme、CLI、配置文件和环境变量写入。

Allowlist 每项必须记录保留理由，例如“MIT 版权”“上游 issue 证据”“旧配对协议兼容”。不能用全目录排除。

### 5.4 应用图标资产

应用图标使用用户指定目录 `/Users/a1234/Documents/学习资料/auto-coding/frontend/src-tauri/icons` 中的“赛博包工头”素材。该目录已核验包含：

- 可编辑源图 `icon.svg`，画布为 1024×1024。
- `icon_1024.png` 至 `icon_16.png` 的多尺寸 PNG。
- 包含 16、24、32、48、64、128、256px 的 Windows `icon.ico`。
- macOS 多尺寸 `icon.icns`。

实施时必须将素材复制到当前仓库的明确品牌目录，例如 `resources/brand/sbbgt/`，并保留来源 README。构建、测试和发布不得依赖工作区外的绝对路径。

平台映射：

| 场景                       | 目标素材                              |
| -------------------------- | ------------------------------------- |
| macOS App / DMG            | 仓库内 `icon.icns`                    |
| Windows EXE / NSIS / Tray  | 多尺寸 `icon.ico` 和 256px PNG        |
| Linux AppImage / DEB / RPM | 1024px 主图派生的 hicolor PNG         |
| Electron Runtime Icon      | 256px PNG                             |
| iOS App Icon               | 从 1024px 主图导出的无 Alpha 版本     |
| Android Legacy Icon        | 512px / 1024px PNG                    |
| Android Adaptive Icon      | 从 SVG 派生的安全区前景、背景和单色层 |
| Mobile Splash              | SVG 或透明 PNG 派生图                 |

源 PNG 带 Alpha 通道，不能未经处理直接作为 iOS 商店图标。Android Adaptive Icon 也不能直接使用整张圆角合成图作为前景，否则系统 Mask 会产生二次裁切。

是否将同一图形同步用于应用内 Logo、Onboarding、About、Mobile Header 和 Web Favicon，仍需在实施前确认。

## 6. 中文化设计

### 6.1 Desktop Renderer 与 Web

- 将默认 UI Locale 改为 `zh`，保留语言设置和英文 Fallback。
- 替换中文目录中的产品品牌，不修改 i18n Key。
- 对 498 个相同值逐条分类：技术名、命令、文件名或未翻译文案。
- 建立术语表并统一：工作区、工作树、提交、拉取请求、合并请求、令牌、Shell、运行时、远程主机、智能体。
- 修复覆盖率门禁当前已知失败。
- 运行伪本地化、中文真实界面和长文案布局测试。

### 6.2 Electron Main

- 菜单、系统 Dialog、通知、托盘、权限卡片和错误恢复文案继续通过 `mainI18n`。
- 默认主进程语言与 Renderer 保持一致。
- 开发日志、协议错误和外部 Git 输出不强制翻译。

### 6.3 Mobile

Mobile 不能只做散落字符串替换。应建立 Mobile Locale Provider 和独立目录，至少支持：

- 简体中文默认目录。
- 英文 Fallback。
- 页面文案、按钮、空状态、错误、无障碍标签。
- iOS InfoPlist 与 Android 权限说明。
- About、Settings、Pairing、Troubleshoot、Tasks、Terminal、Source Control。

移动端 JSON 协议字段、错误码和与 Desktop 的消息类型保持不变。

### 6.4 CLI 与 Agent Surface

推荐规则：

- TTY 人类可读 Help、错误和提示默认中文。
- `--json` 的字段、枚举、错误码和退出码保持稳定。
- Git、Agent、Provider 原始输出不翻译。
- Skill 和 Agent Prompt 中的产品名改为“赛博包工头”，命令示例使用新 CLI。
- 旧 CLI 代理只输出一次迁移提示，不改变命令语义。

## 7. 仓库、更新与外部服务迁移

### 7.1 必须改到当前 Fork

| 能力                             | 目标                                 |
| -------------------------------- | ------------------------------------ |
| package Homepage                 | `https://github.com/OnlyYu1996/orca` |
| electron-builder Publish         | owner `OnlyYu1996`，repo `orca`      |
| 稳定版/预发布更新                | 当前 Fork Releases                   |
| Release 页面与更新卡片           | 当前 Fork Release Tag                |
| Star / Support / Feature Request | 当前 Fork                            |
| Android APK                      | 当前 Fork Release Asset              |
| Mobile About / Support           | 当前 Fork                            |
| Release Workflow Guard           | `OnlyYu1996/orca`                    |
| Release Script 默认 Repo         | `OnlyYu1996/orca`                    |

### 7.2 官方在线服务处理

当前 Fork 不应继续静默使用官方服务：

| 官方能力                      | 处理策略                                           |
| ----------------------------- | -------------------------------------------------- |
| `onorca.dev` Docs / Changelog | 改到当前仓库 README、Docs 和 Releases              |
| Update Nudge                  | 默认关闭；后续可从当前仓库受控配置读取             |
| Feedback / Crash API          | 默认关闭上传，改为本地复制报告或打开当前仓库 Issue |
| Diagnostics Token             | Release Workflow 不再注入官方地址                  |
| PostHog                       | 没有当前项目 Key 时保持禁用                        |
| Discord / X                   | 没有当前项目账号时隐藏，不保留官方入口             |
| Orca Mobile App Store         | 没有新 Bundle 的商店条目时隐藏                     |
| Orca Cloud                    | 未部署自有后端前标记为不可用或移除入口             |

隐私原则是：未配置自有服务时降级为本地功能，不能回退到 Orca 官方服务。

### 7.3 发布链路

- Windows、macOS、Linux Artifact 统一改为 `sbbgt-*`。
- electron-updater Manifest、Blockmap 和 Release Asset 校验同步更新。
- macOS 使用新的 AppID、Helper Bundle ID、TCC 提示和签名身份。
- Windows 使用新的 Executable、Shortcut、Uninstall Name、AppUserModelID 和防火墙规则。
- Linux 使用新的 Package、Desktop Entry、WM_CLASS 和 Launcher。
- SignPath Foundation、Apple 签名和 App Store 身份不能沿用上游配置，未配置时 Release 必须明确失败。

## 8. 兼容迁移设计

### 8.1 用户数据

首次运行新 AppID 时：

1. 检测新数据目录是否为空。
2. 探测各平台旧 Orca 数据目录。
3. 检查旧进程、Daemon 和 Runtime 是否仍在运行。
4. 创建迁移清单和完整备份。
5. 复制而不是移动数据。
6. 在新目录执行 Schema Migration。
7. 写入包含源路径、源版本、时间和校验结果的迁移标记。
8. 失败时保留新旧数据并给出恢复入口。

不得自动删除旧 Orca 数据目录。

### 8.2 配置文件与私有目录

- `sbbgt.yaml` 存在时使用它。
- 只有 `orca.yaml` 时按旧格式加载，并在 UI 中提供迁移操作。
- 两者同时存在时 `sbbgt.yaml` 优先，同时显示冲突提示。
- `.sbbgt/` 与 `.orca/` 采用相同策略。
- SSH 和 Runtime Provider 必须在资源所属 Host 上执行探测和迁移。

### 8.3 配对协议

- Desktop 新生成 `sbbgt://pair?code=...`。
- Desktop、Web、Mobile 和 CLI 同时接受 `sbbgt://` 与 `orca://`。
- Pairing Offer Schema 与 E2EE 数据不因品牌改名。
- 日志脱敏规则同时覆盖两个 Scheme。
- 完成兼容窗口前不得删除旧 Scheme 解析。

### 8.4 CLI 与环境变量

- 新安装只注册 `sbbgt`。
- 识别由本产品创建的旧 `orca` / `orca-ide` 链接，并安全升级为代理。
- 不覆盖用户自有命令，也不与 Linux GNOME Orca 冲突。
- `SBBGT_*` 优先；缺失时读取对应 `ORCA_*`。
- 远端 SSH、WSL 和 Relay 启动脚本同时传递兼容变量。

## 9. 应保留的 Orca / stablyai 内容

以下内容不属于品牌泄漏：

- `LICENSE` 中原版权声明。
- “基于 Orca 二次开发”的上游归属说明。
- Git Remote `upstream=https://github.com/stablyai/orca.git`。
- 同步基线、Merge Base 和上游提交记录。
- 可靠性门禁中指向原 issue/PR 的证据链接。
- `@stablyai/playwright-test` 等真实第三方包名。
- 兼容读取旧数据、旧 Scheme、旧 CLI 和旧配置的代码与测试。
- 内部文件名、类名、协议字段和序列化枚举，除非它们直接暴露给用户。

## 10. 实施分支与提交边界

为降低上游同步冲突，推荐按以下顺序形成独立提交：

1. `chore(identity)`：产品身份配置、链接模块、品牌审计门禁。
2. `feat(localization)`：默认中文、术语表、Renderer/Main 文案。
3. `feat(mobile-localization)`：Mobile 本地化基础设施和全页面中文。
4. `chore(repository)`：产品链接、反馈、隐私与官方服务隔离。
5. `chore(release)`：Updater、electron-builder、Workflow、Artifact。
6. `feat(identity-migration)`：AppID、数据目录、配置、Scheme、环境变量迁移。
7. `feat(cli-brand)`：CLI、Launcher、WSL、SSH 和旧命令代理。
8. `chore(native-brand)`：macOS/Windows/Linux Helper 与权限说明。
9. `docs(brand)`：中文 README、发布说明、上游归属和运维文档。

不要把品牌文案、数据迁移、更新器和原生签名揉进一个提交。

## 11. 验收标准

### 11.1 中文与品牌

- Desktop、Web、Mobile、Main Menu、CLI 人类模式和原生 Helper 的核心流程没有可见英文残留。
- 用户可见区域没有 `Orca`，兼容提示除外。
- 中文术语、标点、空格和变量插值通过人工审校。
- 本地化 Catalog、Coverage 和 Translation Policy 全部通过。
- 中文长文案在 macOS、Windows、Linux 和 Mobile 不截断、不重叠。

### 11.2 仓库与网络

- 产品运行时不访问 `stablyai/orca`、`onorca.dev` 或官方社交账号。
- 更新检查和下载只访问 `OnlyYu1996/orca` Release。
- 支持、Star、Feature Request 和版本链接只打开当前 Fork。
- 无自有服务配置时，反馈、诊断和遥测明确禁用。

### 11.3 迁移

- 有旧数据、无旧数据、损坏旧数据、新旧并存四类场景有测试。
- 旧数据不被删除或覆盖。
- `orca://` 和 `sbbgt://` 可跨 Desktop、Web、Mobile、CLI 配对。
- `orca.yaml`、`.orca` 和 `ORCA_*` 在兼容窗口内继续可用。
- SSH、WSL、Remote Runtime 和 Relay 混合版本路径通过验证。

### 11.4 发布

- Windows Installer、macOS DMG/ZIP、Linux AppImage/DEB/RPM 名称和图标正确。
- AppID、Bundle ID、WM_CLASS、Shortcut、Uninstall、Firewall 和 TCC 均为新身份。
- GitHub Release Workflow 在当前 Fork 可运行，且不能向上游仓库发布。
- electron-updater 稳定版、RC、断网、缺 Manifest 和升级安装 E2E 通过。

## 12. 回滚原则

- 每个迁移步骤保留旧数据和迁移标记。
- 新版本无法启动时允许用户选择旧数据目录只读导出。
- Updater 不允许自动降级到上游 Orca Release。
- 兼容别名移除必须单独设计并经过至少一个正式版周期。
- 品牌审计 Allowlist 和产品身份配置随上游同步一起复核。

## 13. 进入实施前的确认项

需要确认以下决策：

1. 机器短名、CLI、Scheme 和配置前缀是否统一采用 `sbbgt`。
2. Desktop / Mobile AppID 是否采用 `com.onlyyu.sbbgt*`，或提供正式命名空间。
3. 是否接受保留旧 `orca` CLI、Scheme、配置和环境变量至少一个正式版周期。
4. 中文是否作为默认语言，同时保留英文及其他语言切换。
5. 未部署自有服务前，是否关闭自动反馈、诊断上传、更新 Nudge、Orca Cloud、官方社群和官方 Mobile 下载。
6. 应用图标源已确认；是否将同一图形同步替换应用内 Logo、Onboarding、About、Mobile Header、启动图和 Web Favicon。
7. CLI 人类可读输出是否中文化，`--json` 契约保持不变。

以上决策确认后，才能进入业务代码实施。
