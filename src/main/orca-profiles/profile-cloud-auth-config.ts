import { app } from 'electron'

export type OrcaCloudAuthConfig = {
  apiBaseUrl: string
  authorizeEndpoint: string
  sessionEndpoint: string
  refreshEndpoint: string
  capabilitiesEndpoint: string
  profileEndpoint: string
  orgEndpoint: string
  logoutEndpoint: string
  relayTokenEndpoint: string
  relayDirectorUrl: string
  clientId: string
  scope: string
}

const DEFAULT_SCOPE = 'openid profile email offline_access'

// Why: packaged main bundles never define NODE_ENV, so packaged-ness is the
// only reliable production signal for gating dev-only auth escape hatches.
function isPackagedOrcaBuild(): boolean {
  try {
    return app?.isPackaged === true
  } catch {
    return false
  }
}

function cleanUrl(value: string | undefined, allowLoopbackHttp: boolean): string | null {
  const trimmed = value?.trim()
  if (!trimmed) {
    return null
  }
  try {
    const parsed = new URL(trimmed)
    const loopbackHost =
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === 'localhost' ||
      parsed.hostname === '[::1]'
    if (parsed.protocol !== 'https:' && !(loopbackHost && allowLoopbackHttp)) {
      return null
    }
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

function endpoint(baseUrl: string, path: string): string {
  return new URL(path, `${baseUrl}/`).toString()
}

function cloudEnv(env: NodeJS.ProcessEnv, suffix: string): string | undefined {
  return env[`SBBGT_CLOUD_${suffix}`] ?? env[`ORCA_CLOUD_${suffix}`]
}

function relayEnv(env: NodeJS.ProcessEnv): string | undefined {
  return env.SBBGT_RELAY_URL ?? env.ORCA_RELAY_URL
}

function cleanOrigin(value: string | undefined, allowLoopbackHttp: boolean): string | null {
  const cleaned = cleanUrl(value, allowLoopbackHttp)
  if (!cleaned) {
    return null
  }
  const parsed = new URL(cleaned)
  return parsed.pathname === '/' && !parsed.search && !parsed.hash ? parsed.origin : null
}

export function getOrcaCloudAuthConfig(
  env: NodeJS.ProcessEnv = process.env,
  packaged: boolean = isPackagedOrcaBuild()
): { configured: true; config: OrcaCloudAuthConfig } | { configured: false; setupMessage: string } {
  // Why: loopback HTTP endpoints are a local-development convenience only;
  // packaged builds must not accept plain-HTTP token endpoints via env vars.
  const allowLoopbackHttp = !packaged
  const cleanEndpointUrl = (value: string | undefined): string | null =>
    cleanUrl(value, allowLoopbackHttp)
  const apiBaseUrl = cleanEndpointUrl(cloudEnv(env, 'API_URL'))
  const clientId = cloudEnv(env, 'CLIENT_ID')?.trim()
  if (!apiBaseUrl || !clientId) {
    return {
      configured: false,
      setupMessage: '当前构建未配置赛博包工头云服务登录。'
    }
  }

  const authBaseUrl = cleanEndpointUrl(cloudEnv(env, 'AUTH_URL')) ?? apiBaseUrl
  return {
    configured: true,
    config: {
      apiBaseUrl,
      authorizeEndpoint:
        cleanEndpointUrl(cloudEnv(env, 'AUTHORIZE_URL')) ??
        endpoint(authBaseUrl, '/v1/desktop/auth/authorize'),
      sessionEndpoint:
        cleanEndpointUrl(cloudEnv(env, 'SESSION_URL')) ??
        endpoint(apiBaseUrl, '/v1/desktop/auth/session'),
      refreshEndpoint:
        cleanEndpointUrl(cloudEnv(env, 'REFRESH_URL')) ??
        endpoint(apiBaseUrl, '/v1/desktop/auth/refresh'),
      capabilitiesEndpoint:
        cleanEndpointUrl(cloudEnv(env, 'CAPABILITIES_URL')) ??
        endpoint(apiBaseUrl, '/v1/desktop/auth/capabilities'),
      profileEndpoint:
        cleanEndpointUrl(cloudEnv(env, 'PROFILE_URL')) ??
        endpoint(apiBaseUrl, '/v1/desktop/auth/profile'),
      orgEndpoint:
        cleanEndpointUrl(cloudEnv(env, 'ORG_URL')) ?? endpoint(apiBaseUrl, '/v1/desktop/auth/org'),
      logoutEndpoint:
        cleanEndpointUrl(cloudEnv(env, 'LOGOUT_URL')) ??
        endpoint(apiBaseUrl, '/v1/desktop/auth/logout'),
      relayTokenEndpoint:
        cleanEndpointUrl(cloudEnv(env, 'RELAY_TOKEN_URL')) ??
        endpoint(apiBaseUrl, '/v1/desktop/auth/relay-token'),
      // 未配置自有 Relay 时仅回退到同一自有 Cloud 源，禁止连接上游在线服务。
      relayDirectorUrl: cleanOrigin(relayEnv(env), allowLoopbackHttp) ?? new URL(apiBaseUrl).origin,
      clientId,
      scope: cloudEnv(env, 'AUTH_SCOPE')?.trim() || DEFAULT_SCOPE
    }
  }
}

export function allowsPlaintextOrcaCloudSession(
  env: NodeJS.ProcessEnv = process.env,
  packaged: boolean = isPackagedOrcaBuild()
): boolean {
  return (
    cloudEnv(env, 'ALLOW_PLAINTEXT_SESSION') === '1' && env.NODE_ENV !== 'production' && !packaged
  )
}

export function isOrcaCloudDevAuthEnabled(
  env: NodeJS.ProcessEnv = process.env,
  packaged: boolean = isPackagedOrcaBuild()
): boolean {
  return cloudEnv(env, 'DEV_AUTH') === '1' && env.NODE_ENV !== 'production' && !packaged
}
