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
- 备份引用：
- 冲突与关键取舍：
- 验证：
- 未覆盖风险：
- Push 状态及目标：
```
