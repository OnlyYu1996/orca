---
name: sync-orca-upstream
description: 为当前 Orca Fork 审计、规划并安全同步官方 stablyai/orca 上游。用户要求检查上游差异、记录同步节点、评估 Fork 偏移、制定 merge/rebase 方案、执行上游同步或处理同步冲突时使用。
---

# 同步 Orca 上游

## 目标

在保留二次开发历史的前提下同步 `https://github.com/stablyai/orca.git`。默认只审计并输出方案；只有用户明确确认执行同步后，才允许创建备份引用、合并或变基。

开始前必须读取：

1. 仓库根目录的 `AGENTS.md`。
2. [references/repository-baseline.md](references/repository-baseline.md) 中的初始节点。
3. [docs/reference/secondary-development-architecture-baseline.md](../../docs/reference/secondary-development-architecture-baseline.md) 中与改动相关的运行域。

## 固定身份

- 官方上游 Remote：`upstream`
- 官方上游 URL：`https://github.com/stablyai/orca.git`
- Fork Remote：`origin`
- 官方主分支：`upstream/main`
- 二开主线：必须根据当前分支与发布方式确认，不能仅凭分支名猜测

GitHub API 返回的 SHA 只是“远端观测节点”。只有 `refs/remotes/upstream/main` 存在且 Fetch 成功后，才能将它称为“本地已获取上游节点”，并用于 Merge Base、Ahead/Behind、Diff 或同步。

## 工作模式

### 1. 审计模式（默认）

审计模式只能读取 Git 状态：

```bash
rtk node skills/sync-orca-upstream/scripts/audit-upstream.mjs
rtk node skills/sync-orca-upstream/scripts/audit-upstream.mjs --json
```

报告必须明确：

- 当前 Branch、HEAD、`origin` 与 `upstream` URL。
- 工作区是否包含已跟踪、未跟踪或未暂存改动。
- `origin/main`、`upstream/main` 是否已存在于本地。
- 本地上游存在时的 Merge Base、Ahead/Behind 和祖先关系。
- API 观测节点与本地 Fetch 节点的区别。
- 阻止同步的前置条件。

审计模式不得执行 Fetch、Stash、Reset、Checkout、Clean、Merge、Rebase、Commit、Push，也不得删除或覆盖用户文件。

### 2. 刷新上游节点

只有用户要求刷新或同步时才执行 Fetch。先检查 Remote：

```bash
rtk git remote get-url upstream
rtk git fetch upstream --prune --tags
```

若 `upstream` 不存在，可以在说明后添加固定 URL；若已存在但 URL 不匹配，不得静默改写。Fetch 卡住、鉴权失败或网络失败时，保留现状并报告，不能把 API SHA 写成已 Fetch 的 Remote Ref。

若普通 Fetch 长时间没有任何进度，可进行一次限定主分支的 HTTP/1.1 诊断重试：

```bash
rtk git -c http.version=HTTP/1.1 fetch --progress upstream +refs/heads/main:refs/remotes/upstream/main --no-tags
```

诊断重试仍无响应时应安全终止并记录，不得无限等待或循环重试。命令中 `-c` 是 Git 全局选项，后续封装命令时必须保留它位于子命令 `fetch` 之前。

Fetch 成功后重新运行：

```bash
rtk node skills/sync-orca-upstream/scripts/audit-upstream.mjs --sync-ready
```

`--sync-ready` 非零退出代表前置条件未满足，不代表脚本故障。

### 3. 形成同步方案

实际改历史前先与用户确认：

- 哪个分支是长期二开主线，是否已经推送或被其他人使用。
- 本次同步目标 SHA，不能只写“最新”。
- 采用 Merge 还是 Rebase。
- 冲突处理责任、验证范围、提交与 Push 边界。

策略规则：

- 已发布、多人共享或需要持续追踪上游的二开分支，优先 Merge。
- 尚未发布的个人分支只有在用户明确同意改写历史时才能 Rebase。
- 能 Fast-forward 时仍需先报告目标 SHA 和变更范围。
- 不得用 Reset 或强制 Push 模拟同步。
- 不得自动 Stash；工作区不干净时停止并让用户自行决定。

### 4. 执行同步

执行前必须满足：

- 非 Detached HEAD。
- `upstream` URL 与固定官方 URL 一致。
- `refs/remotes/upstream/main` 已存在。
- 工作区干净，包括未跟踪文件。
- 已记录同步前 HEAD、目标 SHA 与 Merge Base。
- 用户已确认分支角色和同步策略。

在任何 Merge/Rebase 前，创建带时间和原 HEAD 的备份引用，并验证引用可解析。备份命名应体现日期和同步前 SHA，不能覆盖已有引用。

执行过程中：

- 保留上游提交语义，不顺手重构无关代码。
- 不替用户猜测冲突取舍；涉及协议、持久化、权限和跨运行域行为时先停止并说明。
- Git 命令以 2.25 为核心工作流基线；新增参数必须确认兼容性。
- 所有路径处理、脚本与命令兼顾 macOS、Linux、Windows、WSL 和 SSH Host。

## 风险分区

同步前按以下边界汇总变更和冲突，不能只按文件数量判断风险：

| 分区 | 重点检查 |
| --- | --- |
| Shared Protocol | Schema、序列化、事件、版本协商、ExecutionHostId |
| Preload / IPC | 权限桥、Channel、参数校验、Renderer 暴露面 |
| Main / Runtime | 服务组合、生命周期、RPC 路由、资源所有权 |
| SSH / Relay | 远端部署、Provider 路由、版本差异、断线恢复 |
| Terminal | PTY Daemon、快照、重连、终端状态所有权 |
| Persistence | Profile、迁移、兼容读取、写入顺序 |
| Renderer | Store、路由、状态恢复、设计系统 |
| Mobile / Web / CLI | 协议兼容、配对、E2EE、输出契约 |
| Build / Release | Node/Electron、原生模块、打包、签名、CI |

特别检查二开代码是否修改了上游高频变动文件。若同一职责同时存在于 Main、Runtime 和 Relay，不得只修其中一个运行域。

## 验证与记录

验证范围按实际变更决定，最低包括：

1. 类型检查、Lint 和受影响单元测试。
2. Shared Protocol、Preload、Runtime 或 Persistence 变更对应的契约/迁移测试。
3. SSH、WSL、Remote Runtime 相关变更的远端路径验证。
4. Renderer 变更遵循 `docs/STYLEGUIDE.md`，并执行针对性的交互验证。
5. Git 行为覆盖 Git 2.25 基线和不同执行 Host 的 Capability Cache。

同步成功后，在 [references/repository-baseline.md](references/repository-baseline.md) 的“同步历史”追加一条记录，至少包含：

- 同步日期与执行者。
- 同步前 HEAD、上游目标 SHA、Merge Base。
- 策略与生成的 Merge/Rebase 后节点。
- 冲突文件和关键取舍。
- 已运行验证及未覆盖风险。
- 是否 Push、Push 到哪个 Remote/Branch。

初始基线是审计证据，只追加同步历史，禁止改写初始节点来伪装 Fork 起点。

## 禁止事项

- 不因用户说“同步”就默认采用 Rebase。
- 不在 Dirty Worktree 上继续同步。
- 不清理 `.nvmrc` 或其他未跟踪文件。
- 不把 `origin` 当作官方上游，也不把 GitHub 专属概念扩散到通用 Provider 逻辑。
- 不只验证本地 Electron 路径而忽略 SSH、WSL、Relay、Mobile、Web 和 CLI。
- 不自动 Commit 或 Push，除非用户明确授权对应动作。
- 不在 Fetch 失败后手工创建或伪造 `refs/remotes/upstream/main`。
