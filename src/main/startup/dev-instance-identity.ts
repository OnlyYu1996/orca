import { createHash } from 'node:crypto'
import path from 'node:path'
import type { AppIdentity } from '../../shared/app-identity'
import {
  PRODUCT_DESKTOP_APP_ID,
  PRODUCT_DESKTOP_DEV_APP_ID,
  PRODUCT_DISPLAY_NAME
} from '../../shared/product-identity'

const BASE_APP_NAME = PRODUCT_DISPLAY_NAME
const BASE_APP_USER_MODEL_ID = PRODUCT_DESKTOP_APP_ID
const MAX_LABEL_LENGTH = 80

export type DevInstanceIdentity = AppIdentity & {
  appUserModelId: string
  // 原因：macOS safeStorage 的钥匙串名称来自 app.setName；开发分支必须共享稳定名称，避免重复授权。
  appName: string
}

function cleanEnvValue(value: string | undefined): string | null {
  const trimmed = value?.replace(/\s+/g, ' ').trim()
  if (!trimmed) {
    return null
  }
  return trimmed.length > MAX_LABEL_LENGTH
    ? `${trimmed.slice(0, MAX_LABEL_LENGTH - 3)}...`
    : trimmed
}

function lastPathSegment(value: string): string {
  const normalized = value.replace(/\\/g, '/')
  return normalized.split('/').findLast(Boolean) ?? value
}

function formatLabel(branch: string | null, worktreeName: string | null): string | null {
  if (branch && worktreeName) {
    if (branch === worktreeName || lastPathSegment(branch) === worktreeName) {
      return worktreeName
    }
    return `${worktreeName} @ ${branch}`
  }
  return branch ?? worktreeName
}

function createDevAppUserModelId(identityKey: string | null): string {
  if (!identityKey) {
    return PRODUCT_DESKTOP_DEV_APP_ID
  }
  const hash = createHash('sha1').update(identityKey).digest('hex').slice(0, 10)
  return `${BASE_APP_USER_MODEL_ID}.dev.${hash}`
}

export function getDevInstanceIdentity(
  isDev: boolean,
  env: NodeJS.ProcessEnv = process.env
): DevInstanceIdentity {
  if (!isDev) {
    return {
      name: BASE_APP_NAME,
      appName: BASE_APP_NAME,
      isDev: false,
      devLabel: null,
      devBranch: null,
      devWorktreeName: null,
      devRepoRoot: null,
      dockBadgeLabel: null,
      appUserModelId: BASE_APP_USER_MODEL_ID
    }
  }

  const repoRoot = cleanEnvValue(env.SBBGT_DEV_REPO_ROOT ?? env.ORCA_DEV_REPO_ROOT)
  const branch = cleanEnvValue(env.SBBGT_DEV_BRANCH ?? env.ORCA_DEV_BRANCH)
  const worktreeName =
    cleanEnvValue(env.SBBGT_DEV_WORKTREE_NAME ?? env.ORCA_DEV_WORKTREE_NAME) ??
    cleanEnvValue(path.basename(repoRoot ?? process.cwd()))
  const devLabel =
    cleanEnvValue(env.SBBGT_DEV_INSTANCE_LABEL ?? env.ORCA_DEV_INSTANCE_LABEL) ??
    formatLabel(branch, worktreeName)
  const dockTitle =
    cleanEnvValue(env.SBBGT_DEV_DOCK_TITLE ?? env.ORCA_DEV_DOCK_TITLE) ?? BASE_APP_NAME

  return {
    name: dockTitle,
    // 原因：所有开发分支共享同一 safeStorage 钥匙串键，避免每个分支重复触发授权。
    appName: `${BASE_APP_NAME} Dev`,
    isDev: true,
    devLabel,
    devBranch: branch,
    devWorktreeName: worktreeName,
    devRepoRoot: repoRoot,
    dockBadgeLabel: null,
    appUserModelId: createDevAppUserModelId(repoRoot ?? devLabel)
  }
}
