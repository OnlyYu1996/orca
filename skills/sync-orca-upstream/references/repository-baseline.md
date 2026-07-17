# 赛博包工头 Fork 上游同步基线

> 记录日期：2026-07-14
>
> 记录目的：固定二次开发开始前的本地节点、Remote 身份和官方上游观测节点。
>
> 维护规则：本节初始证据不可改写；每次成功同步只在文末“同步历史”追加记录。

## 仓库身份

| 角色      | 名称       | URL                                      |
| --------- | ---------- | ---------------------------------------- |
| 二开 Fork | `origin`   | `https://github.com/OnlyYu1996/orca.git` |
| 官方上游  | `upstream` | `https://github.com/stablyai/orca.git`   |

记录时，`origin` 与 `upstream` 的 Fetch/Push URL 均由本地 Git 配置返回上述地址。该记录只说明 Remote 身份，不代表拥有 Push 权限。

## 本地初始节点

| 字段          | 值                                                                               |
| ------------- | -------------------------------------------------------------------------------- |
| Branch        | `main`                                                                           |
| HEAD          | `6e1aa8503c688f85d16b4c72981e2f5e862e491f`                                       |
| `origin/main` | `6e1aa8503c688f85d16b4c72981e2f5e862e491f`                                       |
| Parent        | `a68bb39ab13ea814f143ce1204321c9233c590af`                                       |
| Tree          | `3b77091aefdac4ce8827b2ab382dca92aa5a1d61`                                       |
| Commit 时间   | `2026-07-13T19:19:17-07:00`                                                      |
| Subject       | `perf(renderer): pause always-on idle timers while the window is hidden (#8528)` |

这是一份 Git 对象级基线。后续判断二开改动从何处开始，应以提交图和 Merge Base 为准，不能只比较版本号或文件时间。

## 官方上游 API 观测

2026-07-14 通过 GitHub 官方 API 观测到：

| 字段         | 值                                                                                     |
| ------------ | -------------------------------------------------------------------------------------- |
| Repository   | `stablyai/orca`                                                                        |
| Branch       | `main`                                                                                 |
| API 观测 SHA | `9d517325236d29169d4c2c74fde62c74251ce00c`                                             |
| Commit 时间  | `2026-07-14T09:58:34Z`                                                                 |
| Subject      | `perf(terminal): defer cold worktree activation tab mounts until first reveal (#8597)` |

API 返回的最近提交序列中，本地 HEAD 位于该观测 SHA 之后第 29 个位置，因此当时可描述为“观测上落后 29 个提交、领先 0 个”。这不是本地 Git 提交图计算结果；只有成功 Fetch 后，才能用 `git rev-list` 和 `git merge-base` 给出可执行同步所需的精确关系。

## 本地 Fetch 状态

记录时：

- `upstream` Remote 已配置。
- `refs/remotes/upstream/main` 不存在。
- 曾尝试 `git fetch upstream --prune --tags` 和无交互的 `git fetch upstream main --no-tags`。
- 又使用 `git -c http.version=HTTP/1.1 fetch --progress upstream +refs/heads/main:refs/remotes/upstream/main --no-tags` 进行了一次限定主分支的诊断重试。
- 三次 Fetch 都长时间无输出，已安全终止，未产生可验证的 `upstream/main` 本地引用。
- 未执行 Merge、Rebase、Reset、Stash、Checkout 或工作区清理。

因此，初始同步状态是“Remote 已就绪，官方节点已观测，本地上游对象尚未获取”。任何后续同步都必须先完成 Fetch，再重新审计。

## 初始工作区状态

记录时工作区包含下列未提交内容：

- 已修改：`docs/reference/README.md`
- 未跟踪：`.nvmrc`
- 未跟踪：`docs/reference/secondary-development-architecture-baseline.md`
- 未跟踪：`skills/sync-orca-upstream/`

这些内容属于当前二开准备工作。同步 Skill 不得自动 Stash、删除、覆盖或清理它们；实际同步前由用户决定如何形成干净工作区。

## 二开准备节点

在产品改造开始前，架构基线、品牌迁移设计和本 Skill 已形成提交：

| 字段                    | 值                                         |
| ----------------------- | ------------------------------------------ |
| Branch                  | `main`                                     |
| HEAD                    | `b2c77c706c67716ac4987033076b28064f3db6c2` |
| Commit 时间             | 2026-07-14                                 |
| Subject                 | `提交代码`                                 |
| 与 `origin/main` 的关系 | 本地领先 1 个提交                          |

后续中文化、品牌、兼容迁移、图标和发布链调整以该提交为准备节点，当前仍处于未提交实施阶段。实际同步前必须先把实施结果形成明确提交或由用户选择其他清理方式，Skill 不得自动 Stash。

## 品牌保护基线

- 产品名：赛博包工头；机器短名、CLI 和 Scheme：`sbbgt`。
- 产品仓库：`OnlyYu1996/orca`；上游源码仓库：`stablyai/orca`。
- Desktop AppID：`com.onlyyu.sbbgt`；Mobile AppID：`com.onlyyu.sbbgt.mobile`。
- 默认语言：简体中文；保留英文切换。
- 旧 `orca` CLI、Scheme、配置、目录、Bundle ID 和 `ORCA_*` 在一个正式版周期内兼容读取。
- 未配置自有服务时，反馈、诊断、遥测、Cloud、社群和商店入口关闭，不回退到上游服务。
- 品牌图标固定来自仓库内 `resources/brand/`，构建不得依赖外部绝对路径。

## 同步历史

初始记录时尚未执行上游同步。成功同步后按时间顺序追加，禁止覆盖前面的记录。

### 机器状态

当前最后成功集成节点同时保存在
[`upstream-integration-state.json`](./upstream-integration-state.json)。该文件供审计脚本稳定读取，
Markdown 历史保留冲突取舍、验证证据和未覆盖风险。

机器状态必须满足：

- `upstreamTargetSha` 是 `integrationCommit` 的祖先。
- `integrationCommit` 是当前产品 HEAD 的祖先。
- `mergeBase` 与同步前 HEAD、上游目标的真实 Merge Base 一致。
- `postSyncFetchedSha` 来自同步完成后的 Fetch；若上游继续前进，新增提交只计入下一轮待同步范围。
- 只有约定验证全部通过后才能更新最后成功集成节点。

状态文件不是独立事实来源。文件内容与 Git 提交图冲突时，以 Git 对象关系为准并阻止后续同步。

### 追加模板

```markdown
### YYYY-MM-DD：同步到 <upstream-sha>

- 执行者：
- 二开分支：
- 同步前 HEAD：
- 上游目标 SHA：
- Merge Base：
- 策略：Merge / Rebase / Fast-forward
- 同步后节点：
- 同步后 Fetch 节点及待同步提交数：
- 备份引用：
- 冲突与关键取舍：
- 验证：
- 未覆盖风险：
- Push 状态及目标：
```

### 2026-07-15：同步到 6ee2af357b82c8717ad633f1251b6b310486dd7d

- 执行者：Codex（本地）
- 二开分支：`main`
- 同步前 HEAD：`dfe6118533b749795b34f9dee3096e8e0cacd4af`
- 上游目标 SHA：`6ee2af357b82c8717ad633f1251b6b310486dd7d`
- Merge Base：`6e1aa8503c688f85d16b4c72981e2f5e862e491f`
- 策略：Merge（`--no-ff`）
- 同步后节点：`32d3ba5fcaa20012a9103b52374d8410371266f2`
- 备份引用：`refs/backup/upstream-sync/2026-07-15-dfe6118533b7`
- 冲突文件：共 21 个：`mobile/app.json`、`mobile/app/_layout.tsx`、`mobile/app/index.tsx`、`mobile/app/pair-confirm.tsx`、`mobile/app/pair-scan.tsx`、`package.json`、`src/cli/help.ts`、`src/cli/runtime/client.ts`、`src/main/hooks.ts`、`src/main/ipc/worktrees.ts`、`src/main/orca-profiles/profile-cloud-auth-config.test.ts`、`src/main/orca-profiles/profile-cloud-auth-config.ts`、`src/main/runtime/device-registry.ts`、`src/main/startup/single-instance-lock.ts`、`src/renderer/src/components/tab-bar/TerminalTabLeadingIcon.tsx`、五个 Renderer Locale 目录以及 `src/shared/pairing.ts`。
- 关键取舍：保留上游 Relay、E2EE v2、Mobile 0.0.30、Terminal 和 CLI Skill Guides；继续使用“赛博包工头”产品名及 `sbbgt` CLI、Scheme、新存储键；旧 `orca` 仅用于兼容读取、测试 Fixture 或上游证据；Cloud/Relay 不回退 `onorca.dev` 官方端点；产品仓库、下载和发布链接继续指向 `OnlyYu1996/orca`；Worktree IPC 保留上游 `ExecutionHostId` 路由，并维持远端 `.sbbgt` / `.orca` 双读。
- 验证：根 TypeScript 类型检查通过；完整 Lint 通过（含 Reliability Gates、max-lines Ratchet、Bundled Skill Guides、本地化目录与覆盖率、品牌边界）；根 Vitest 单 Worker 全量 `29,926 passed / 44 skipped`；Mobile 类型检查通过，Mobile Vitest `1,680 passed / 2 skipped`；冲突及超时专项 `69 passed / 1 skipped`；SSH 系统传输独立 `2 passed`；`git diff --check` 通过；品牌边界检查覆盖 5,035 个产品文本文件。
- 未覆盖风险：未执行 Windows、Linux、WSL 和真实 SSH 主机实体环境验收；未执行 Desktop E2E 全量、各平台安装包构建、签名、自动更新及真实自建 Relay 后端联调。根测试在 4 Worker 高并发下曾有两项固定时限用例超时，相关文件隔离运行及单 Worker 全量均通过。
- Push 状态及目标：未 Push；`origin/main` 未变更。

### 2026-07-15：同步到 190ed7d4ed0e43f1e2e543435d4ee09ab40fb7ca

- 执行者：Codex（本地）
- 二开分支：`main`
- 同步前 HEAD：`b55b93ea86f9a80fe7e719202e45dad7a5416df2`
- 上游目标 SHA：`190ed7d4ed0e43f1e2e543435d4ee09ab40fb7ca`
- Merge Base：`6ee2af357b82c8717ad633f1251b6b310486dd7d`
- 策略：Merge（`--no-ff`）
- 同步后节点：`8e52c6c21d6e37cf8e1c06a05b2ed44de3861136`
- 同步后 Fetch 节点及待同步提交数：`190ed7d4ed0e43f1e2e543435d4ee09ab40fb7ca`，`0`
- 备份引用：`refs/backup/upstream-sync/2026-07-15-b55b93ea86f9`
- 冲突文件：共 19 个：`README.md`、`mobile/app.json`、`mobile/app/_layout.tsx`、`mobile/app/notifications.tsx`、`mobile/app/pair-confirm.tsx`、`mobile/app/pair-scan.tsx`、`mobile/src/components/MobileHostCard.tsx`、`mobile/src/transport/mobile-relay-pairing-journal-store.ts`、`package.json`、`src/main/runtime/windows-mobile-firewall.test.ts`、`src/renderer/src/components/mobile/mobile-platform-copy.ts`、`src/renderer/src/components/settings/MobilePairingConnectionOptions.test.tsx`、`src/renderer/src/components/settings/MobileRelayBetaAvailability.tsx`、`src/renderer/src/components/settings/MobileSettingsPane.tsx` 以及五个 Renderer Locale 目录。
- 关键取舍：接入上游 Mobile 0.0.31、通知授权、终端恢复、语音下载续传、Markdown 编辑、Windows 防火墙 Block Rule 修复、Kerberos/GSSAPI 和 `csh`/`tcsh` SSH 兼容；继续使用“赛博包工头”、`sbbgt` 包名与 AppID、`OnlyYu1996/orca` 发布和下载地址，不引入上游 App Store、`onorca.dev` 或官方签名声明；Mobile 导航同时保留 Locale Provider 和通知授权页；配对日志同时保留新旧键双读迁移与上游并发串行化；Host Overlay 新写 `sbbgt:*`，旧 `orca:*` 仅作兼容读取；TypeScript 7 配置移除已废弃的 `baseUrl` 并保留等价路径别名。
- 验证：根 TypeScript 类型检查通过；完整 Lint 通过（含 Reliability Gates、max-lines Ratchet、Bundled Skill Guides、本地化目录与覆盖率、品牌边界），品牌边界覆盖 5,059 个产品文本文件；根 Vitest 并发全量 `30,042 passed / 45 skipped / 16 failed`，失败均在高负载下表现为固定时限或进程资源竞争；失败文件单 Worker 复跑 `87 passed / 1 skipped`，随后根 Vitest 单 Worker 全量 `30,058 passed / 45 skipped`；Mobile 类型检查和 Lint 通过，Mobile Vitest 全量 `1,720 passed / 2 skipped`；冲突专项 Root `19 passed`、Mobile `36 passed`；SSH 系统传输已包含在单 Worker复跑和全量验证中；`git diff --check` 通过。
- 未覆盖风险：未执行 Windows、Linux、WSL 和真实 SSH 主机实体环境验收；未执行 Desktop E2E 全量、真实 Mobile 设备验收、各平台安装包构建、签名、自动更新及真实自建 Relay 后端联调。
- Push 状态及目标：远端 `origin/main` 已核验为 `8e52c6c21d6e37cf8e1c06a05b2ed44de3861136`；本地 reflog 记录 `2026-07-15T18:28:15+08:00 update by push`。同步流程未显式调用 `git push`，该推送由提交钩子或外部流程完成。机器状态与本记录尚未形成独立元数据提交。

### 2026-07-16：同步到 1ba71d2cee59d12687a32e1d595247b0c2677a85

- 执行者：Codex（本地）
- 二开分支：`main`
- 同步前 HEAD：`a4678dbd937a91de2ec10ed36515e18253552892`
- 上游目标 SHA：`1ba71d2cee59d12687a32e1d595247b0c2677a85`
- Merge Base：`190ed7d4ed0e43f1e2e543435d4ee09ab40fb7ca`
- 策略：Merge（`--no-ff`）
- 同步后节点：`b1908c9e306750c943052a681f5b7b647694a26d`
- 同步后 Fetch 节点及待同步提交数：`1ba71d2cee59d12687a32e1d595247b0c2677a85`，`0`
- 备份引用：`refs/backup/upstream-sync/2026-07-16-a4678dbd937a`
- 冲突文件：共 3 个：`mobile/app/index.tsx`、`package.json`、`src/renderer/src/i18n/locales/zh.json`。
- 关键取舍：接入上游 32 个提交，保留文件监听容量与取消恢复、Terminal/PTY 进程组清理、Runtime/Relay 资源回收、Git 状态轮询、关闭标签页恢复、Markdown 编辑和 Mobile 主机端点编辑等语义；`package.json` 升级到 `1.4.143-rc.0` 并接入 `@sanity/diff-match-patch`，同时保留 `sbbgt` 包名、赛博包工头描述、当前 Fork 链接和品牌门禁；Mobile 首页采用上游独立编辑路由并完整接入中英文目录；Renderer 中文目录吸收上游翻译修正但不恢复 Orca 用户可见品牌。普通带标签 Fetch 因本地与上游 `v1.4.142` 同名标签对象不同而被拒绝，未覆盖本地标签；随后使用限定 `upstream/main` 且 `--no-tags` 的 Fetch 成功冻结和复核目标。
- 验证：Root 与 Mobile TypeScript 类型检查通过；Root 高风险重叠专项 `2,100 passed`；Mobile 冲突专项 `62 passed`；Mobile 全量 Vitest `1,768 passed / 2 skipped`；Root 全量 Vitest `30,577 passed / 46 skipped / 1 failed`，唯一失败为同步状态测试硬编码第一次同步 SHA，修正为提交图与状态结构校验后专项复跑 `7 passed`；Root 普通 OXLint 通过，type-aware switch-exhaustiveness 在默认并发下两次触发 `typescript-go` Go Runtime 段错误，限制 `GOMAXPROCS=1` 后通过；Reliability Gates、max-lines Ratchet、Bundled Skill Guides、本地化目录与覆盖率、品牌边界均通过，品牌边界覆盖 5,125 个产品文本文件；Mobile Lint、Format Check 通过；`git diff --check` 通过。
- 未覆盖风险：修正同步状态测试后未再次执行耗时约 18 分钟的 Root 单 Worker 全量，仅复跑该专项；未执行 Windows、Linux、WSL 和真实 SSH 主机实体环境验收；未执行 Desktop E2E 全量、真实 Mobile 设备验收、各平台安装包构建、签名、自动更新和真实自建 Relay 后端联调。默认并发 type-aware Lint 的 `typescript-go` 崩溃仍属于工具链稳定性风险。
- Push 状态及目标：未 Push；记录时 `origin/main` 仍为 `a4678dbd937a91de2ec10ed36515e18253552892`。

### 2026-07-16：同步到 cf02cc46b1434a0b84597a268bd232c9898e61f6

- 执行者：Codex（本地）
- 二开分支：`main`
- 同步前 HEAD：`54e31458b2f3567029ce4190f41192c03bbf63f4`
- 上游目标 SHA：`cf02cc46b1434a0b84597a268bd232c9898e61f6`
- Merge Base：`1ba71d2cee59d12687a32e1d595247b0c2677a85`
- 策略：Merge（`--no-ff`）
- 同步后节点：`021a09ee4bf3076a716785402cb8a12d55e4e217`
- 同步后 Fetch 节点及待同步提交数：`377082e142b4120208df75ee008761687a1789c4`，`1`；新增提交为 `fix(ai-vault): discover Antigravity CLI sessions (#8971)`，留待下一轮同步。
- 备份引用：`refs/backup/upstream-sync/2026-07-16-54e31458b2f3`
- 冲突文件：共 3 个：`README.md`、`src/cli/help.ts`、`src/cli/specs/core.ts`。
- 关键取舍：接入上游 13 个提交，保留 Terminal/PTY 视口所有权、整标签页持久关闭、Browser 链接路由、Pi 子智能体通知抑制、Droid Windows Shift+Enter、Linear 分支名、AI Vault 视图持久化、自托管 Jira 和打包排除项；README 继续使用“赛博包工头”与当前 Fork 链路，不引入上游 Discord、X 或微信入口；CLI 在现有模块化中文帮助中接入 `sbbgt terminal close --tab`，不恢复上游 `orca` 命令文案；新增 Jira 中文目录已人工翻译；Pi 所有权标记只写 `SBBGT_PI_STATUS_OWNED`，并以窄 Allowlist 兼容读取旧 `ORCA_PI_STATUS_OWNED`。
- 验证：Root 三套 TypeScript 类型检查通过；完整 Lint 通过（含 type-aware switch-exhaustiveness、Reliability Gates、max-lines Ratchet、Bundled Skill Guides、本地化目录与覆盖率、品牌边界），品牌边界覆盖 5,141 个产品文本文件；受影响域专项 `2,149 passed`；Root Vitest 单 Worker 全量 `30,745 passed / 46 skipped`；`setup-agent-sequencing` 在清理一次错误并发运行遗留的本机 pyenv rehash 锁后隔离复跑 `14 passed`，并包含在最终全量通过结果中；`git diff --check` 通过。
- 未覆盖风险：未执行 Desktop Playwright E2E、真实 Jira Server/Data Center 与 Linear 联调、AI Vault/Jira 视觉验收、Windows/Linux/WSL 和真实 SSH 主机实体环境验收；未执行各平台安装包构建、签名、自动更新、Mobile 全量及真实设备验收。
- Push 状态及目标：未 Push；记录时 `origin/main` 仍为 `54e31458b2f3567029ce4190f41192c03bbf63f4`。

### 2026-07-17：同步到 cc1ad064d74e21a6a14713e31004e6ff0e53a982

- 执行者：Codex（本地）
- 二开分支：`main`
- 同步前 HEAD：`58add664dcd9ef8a1b697287256e789b16658694`
- 上游目标 SHA：`cc1ad064d74e21a6a14713e31004e6ff0e53a982`
- Merge Base：`cf02cc46b1434a0b84597a268bd232c9898e61f6`
- 策略：Merge（`--no-ff`）
- 同步后节点：`a6319a68affc84d1bfb2c4f53bf243e2a13f8d35`
- 同步后 Fetch 节点及待同步提交数：`8ec050a875f9a482dfebc576d8c3c76c06ab059c`，`4`；待同步提交为 Markdown 评审快捷键、Native Chat 启动选项修正、SSH Relay 原生依赖修复和中文目录修复。
- 备份引用：`refs/backup/upstream-sync/2026-07-17-58add664dcd9`
- 冲突文件：共 9 个：`package.json`、`src/main/tray/system-tray.test.ts`、`src/main/tray/system-tray.ts`、`src/renderer/src/i18n/locales/en.json`、`src/renderer/src/i18n/locales/es.json`、`src/renderer/src/i18n/locales/ja.json`、`src/renderer/src/i18n/locales/ko.json`、`src/renderer/src/i18n/locales/zh.json`、`src/renderer/src/lib/agent-status.ts`。
- 关键取舍：接入上游 45 个提交，包括 Mobile 与桌面 Native Chat、终端订阅和重连、整标签页 PTY 回收、Skills 新鲜度与安全更新、浏览器本地 HTTPS 证书处理、macOS 菜单栏状态项、AI Vault Antigravity 会话、Git Worktree 子模块清理和跨平台终端修复；版本升级到 `1.4.144-rc.4`，同时保留 `sbbgt` 包名、赛博包工头产品身份、`OnlyYu1996/orca` 链路和品牌门禁；托盘吸收上游 macOS 菜单与关注态图标能力，但工具提示和菜单回退文案使用赛博包工头；Agent 标签迁移到上游共享源并补回 CodeBuddy；使用结构化目录脚本清理上游新增旧品牌，并补齐 Grok/Kimi、技能更新和证书错误页中文文案；重新生成二开技能包清单；远程主机、更新、支持和任务来源设置入口继续隐藏，任务来源继续强制 GitLab，CodeBuddy Hook 与 Token 统计链路保持启用。
- 验证：Root 三套 TypeScript 类型检查通过；完整 Lint 通过（含 type-aware switch-exhaustiveness、41 个 Reliability Gates、max-lines Ratchet、Bundled Skill Guides、Skill Bundle Manifest、本地化目录与覆盖率、品牌边界），品牌边界覆盖 5,275 个产品文本文件；冲突与二开保护面专项 `204 passed / 1 skipped`，新增穷尽分支专项 `6 passed`；Root Vitest 首轮单 Worker 全量发现 5 个旧品牌或 Locale 顺序相关测试断言，修正测试品牌期望并显式隔离 Locale 后，失败专项 `22 passed`，最终 Root Vitest 单 Worker 全量 `31,204 passed / 47 skipped`（2,951 个测试文件通过、6 个跳过）；Mobile TypeScript、Lint 和 884 文件 Format Check 通过，Mobile Vitest 全量 `2,008 passed / 2 skipped`；`git diff --check` 通过。
- 未覆盖风险：未执行 Desktop Playwright E2E、浏览器证书和 macOS 菜单栏视觉验收、真实 Mobile 设备验收、Windows/Linux/WSL 和真实 SSH 主机实体环境验收、Git 2.25 真实二进制矩阵、各平台安装包构建、签名、自动更新及真实自建 Relay 后端联调；同步后上游新增 4 个提交留待下一轮，其中中文目录修复可能与本轮人工中文化产生内容重叠。
- Push 状态及目标：未 Push；记录时 `origin/main` 仍为 `58add664dcd9ef8a1b697287256e789b16658694`，本地 `main` 领先 46 个提交。

### 2026-07-17：同步到 44686f324ce6ced7e976555031471940b24de9d6

- 执行者：Codex（本地）
- 二开分支：`main`
- 同步前 HEAD：`8dfe0561968733436f1010983525ac68f7bbe356`
- 上游目标 SHA：`44686f324ce6ced7e976555031471940b24de9d6`
- Merge Base：`cc1ad064d74e21a6a14713e31004e6ff0e53a982`
- 策略：Merge（`--no-ff`）
- 同步后节点：`8089a4b742e60683da1b6a9a62c09b7e7910f0f6`
- 同步后 Fetch 节点及待同步提交数：`44686f324ce6ced7e976555031471940b24de9d6`，`0`
- 备份引用：`refs/backup/upstream-sync/2026-07-17-8dfe05619687`
- 冲突文件：共 4 个：`mobile/app/_layout.tsx`、`src/renderer/src/i18n/locales/es.json`、`src/renderer/src/i18n/locales/ja.json`、`src/renderer/src/i18n/locales/zh.json`。
- 关键取舍：接入上游 10 个提交，包括 SSH Relay 原生依赖部署、安装/修复/GC 锁、文件传输取消、Mobile 默认会话视图、Native Chat 默认模型与推理强度、Markdown 评审备注快捷键、macOS 输入法快捷键保护、置顶工作树分组显示、Pet 帧时长与交互，以及全局 Fetch 响应体主动取消；Relay 同时保留 `TERM_PROGRAM=sbbgt`、`SBBGT_APP_VERSION` 优先和旧 `ORCA_APP_VERSION` 兼容读取；Shared 保留默认简体中文、GitLab-only、CodeBuddy 与 `sbbgt` 默认路径；Mobile 导航同时保留 `MobileLocaleProvider`、语言设置页和上游 Native Chat 设置页，并将新增入口、说明、开关状态及无障碍标签接入中英双语目录；Renderer Locale 吸收上游新增设置和中文修复，不恢复用户可见 `Orca`；全局 Fetch 审计移除仅使用 Electron `net.fetch` 的反馈模块失效登记；重新生成二开技能包清单。
- 验证：Root 与 Mobile TypeScript 类型检查通过；完整 Root Lint 通过（含 type-aware switch-exhaustiveness、41 个 Reliability Gates、max-lines Ratchet、Bundled Skill Guides、Skill Bundle Manifest、本地化目录与覆盖率、品牌边界），品牌边界覆盖 5,298 个产品文本文件；受影响 Root 专项 `1,020 passed / 5 skipped`，Mobile 专项 `49 passed`；Mobile Lint 和 890 文件 Format Check 通过，Mobile Vitest 全量 `2,037 passed / 2 skipped`；Root Vitest 单 Worker 全量 `31,370 passed / 52 skipped / 1 timeout`，唯一超时为未受本轮修改的真实 Git 子模块状态用例，该精确用例隔离复跑 `1 passed / 95 skipped`（2.84 秒），整文件隔离复跑 `96 passed`；`git diff --check` 通过，验证进程均已退出。
- 未覆盖风险：未执行 Desktop Playwright E2E、真实 Mobile 设备验收、Windows/Linux/WSL 和真实 SSH 主机实体环境验收、Git 2.25 真实二进制矩阵、各平台安装包构建、签名、自动更新及真实自建 Relay 后端联调；Root 全量中的子模块状态用例仍存在高负载下触发固定 30 秒时限的波动风险。
- Push 状态及目标：未 Push；记录时 `origin/main` 仍为 `8dfe0561968733436f1010983525ac68f7bbe356`。
