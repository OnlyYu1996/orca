import { readFileSync } from 'node:fs'

export const EXPECTED_UPSTREAM_URL = 'https://github.com/stablyai/orca.git'
export const INTEGRATION_STATE_RELATIVE_PATH =
  'skills/sync-orca-upstream/references/upstream-integration-state.json'

const SHA_PATTERN = /^[0-9a-f]{40}$/
const STRATEGIES = new Set(['merge', 'rebase', 'fast-forward'])

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function requireString(record, key, errors, prefix) {
  const value = record[key]
  if (typeof value !== 'string' || value.length === 0) {
    errors.push(`${prefix}.${key} 必须是非空字符串`)
    return null
  }
  return value
}

function requireSha(record, key, errors, prefix) {
  const value = requireString(record, key, errors, prefix)
  if (value && !SHA_PATTERN.test(value)) {
    errors.push(`${prefix}.${key} 必须是 40 位小写 Git SHA`)
  }
  return value
}

export function isFullGitSha(value) {
  return typeof value === 'string' && SHA_PATTERN.test(value)
}

export function validateUpstreamIntegrationState(value) {
  const errors = []
  if (!isRecord(value)) {
    return ['状态文件根节点必须是对象']
  }

  if (value.schemaVersion !== 1) {
    errors.push('schemaVersion 必须为 1')
  }

  if (!isRecord(value.upstream)) {
    errors.push('upstream 必须是对象')
  } else {
    if (value.upstream.remote !== 'upstream') {
      errors.push('upstream.remote 必须为 upstream')
    }
    if (value.upstream.url !== EXPECTED_UPSTREAM_URL) {
      errors.push(`upstream.url 必须为 ${EXPECTED_UPSTREAM_URL}`)
    }
    if (value.upstream.branch !== 'main') {
      errors.push('upstream.branch 必须为 main')
    }
  }

  const integration = value.lastSuccessfulIntegration
  if (!isRecord(integration)) {
    errors.push('lastSuccessfulIntegration 必须是对象')
    return errors
  }

  requireString(integration, 'branch', errors, 'lastSuccessfulIntegration')
  requireSha(integration, 'preSyncHead', errors, 'lastSuccessfulIntegration')
  requireSha(integration, 'upstreamTargetSha', errors, 'lastSuccessfulIntegration')
  requireSha(integration, 'mergeBase', errors, 'lastSuccessfulIntegration')
  requireSha(integration, 'integrationCommit', errors, 'lastSuccessfulIntegration')
  requireSha(integration, 'postSyncFetchedSha', errors, 'lastSuccessfulIntegration')

  if (!STRATEGIES.has(integration.strategy)) {
    errors.push('lastSuccessfulIntegration.strategy 必须为 merge、rebase 或 fast-forward')
  }
  if (integration.verificationStatus !== 'passed') {
    errors.push('lastSuccessfulIntegration.verificationStatus 必须为 passed')
  }
  if (
    typeof integration.integratedAt !== 'string' ||
    !Number.isFinite(Date.parse(integration.integratedAt))
  ) {
    errors.push('lastSuccessfulIntegration.integratedAt 必须是有效 ISO 时间')
  }
  if (
    !Number.isInteger(integration.pendingUpstreamCommitCountAtRecord) ||
    integration.pendingUpstreamCommitCountAtRecord < 0
  ) {
    errors.push('lastSuccessfulIntegration.pendingUpstreamCommitCountAtRecord 必须是非负整数')
  }

  return errors
}

export function parseUpstreamIntegrationState(text) {
  let value
  try {
    value = JSON.parse(text)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`无法解析上游集成状态 JSON: ${detail}`)
  }

  const errors = validateUpstreamIntegrationState(value)
  if (errors.length > 0) {
    throw new Error(`上游集成状态无效:\n- ${errors.join('\n- ')}`)
  }
  return value
}

export function readUpstreamIntegrationState(path) {
  return parseUpstreamIntegrationState(readFileSync(path, 'utf8'))
}

export function createUpstreamIntegrationState(integration) {
  const value = {
    schemaVersion: 1,
    upstream: {
      remote: 'upstream',
      url: EXPECTED_UPSTREAM_URL,
      branch: 'main'
    },
    lastSuccessfulIntegration: {
      branch: integration.branch,
      preSyncHead: integration.preSyncHead,
      upstreamTargetSha: integration.upstreamTargetSha,
      mergeBase: integration.mergeBase,
      strategy: integration.strategy,
      integrationCommit: integration.integrationCommit,
      integratedAt: integration.integratedAt,
      verificationStatus: 'passed',
      postSyncFetchedSha: integration.postSyncFetchedSha,
      pendingUpstreamCommitCountAtRecord: integration.pendingUpstreamCommitCountAtRecord
    }
  }

  const errors = validateUpstreamIntegrationState(value)
  if (errors.length > 0) {
    throw new Error(`不能创建无效的上游集成状态:\n- ${errors.join('\n- ')}`)
  }
  return value
}
