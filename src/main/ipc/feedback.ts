import os from 'node:os'
import { app, ipcMain, net } from 'electron'

const FEEDBACK_REQUEST_TIMEOUT_MS = 10_000
const FEEDBACK_ATTACHMENT_REQUEST_TIMEOUT_MS = 60_000
const DIAGNOSTIC_BUNDLE_CONTENT_TYPE = 'application/x-ndjson'
// Why: corporate filters can reject multipart with 403 while allowing the
// small JSON report, so content-shaped failures should shed the attachment.
const DIAGNOSTIC_BUNDLE_JSON_RETRY_STATUSES = new Set([400, 403, 408, 413, 415, 422])

export type FeedbackSubmissionType = 'feedback' | 'crash'

export type FeedbackSubmitArgs = {
  feedback: string
  submitAnonymously?: boolean
  githubLogin: string | null
  githubEmail: string | null
}

export type FeedbackDiagnosticBundleAttachment = {
  bundleSubmissionId: string
  content: string
  bytes: number
  spanCount: number
}

type FeedbackSubmitBody = {
  feedback: string
  submissionType: FeedbackSubmissionType
  githubLogin: string | null
  githubEmail: string | null
  appVersion: string
  platform: NodeJS.Platform
  osRelease: string
  arch: string
  diagnosticBundle?: FeedbackDiagnosticBundleAttachment
}

export type FeedbackRequestFailure = {
  status: number | null
  error: string
}

export type FeedbackSubmitResult =
  | { ok: true; diagnosticBundleFailure?: FeedbackRequestFailure }
  | ({ ok: false } & FeedbackRequestFailure & {
        diagnosticBundleFailure?: FeedbackRequestFailure
      })

type InternalFeedbackSubmitArgs = FeedbackSubmitArgs & {
  submissionType?: FeedbackSubmissionType
  diagnosticBundle?: FeedbackDiagnosticBundleAttachment
  feedbackWithoutDiagnosticBundle?: string
}

type FeedbackEndpoints = {
  primary: string
  fallback: string | null
}

export type FeedbackTransportStatus = {
  configured: boolean
}

function cleanFeedbackEndpoint(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) {
    return null
  }
  try {
    const url = new URL(trimmed)
    return url.protocol === 'https:' || url.protocol === 'http:' ? trimmed : null
  } catch {
    return null
  }
}

export function resolveFeedbackEndpoints(
  env: NodeJS.ProcessEnv = process.env
): FeedbackEndpoints | null {
  // 新变量优先，旧变量仅用于一个正式版周期内的平滑迁移。
  const primary = cleanFeedbackEndpoint(env.SBBGT_FEEDBACK_API_URL ?? env.ORCA_FEEDBACK_API_URL)
  if (!primary) {
    return null
  }
  const configuredFallback = cleanFeedbackEndpoint(
    env.SBBGT_FEEDBACK_API_FALLBACK_URL ?? env.ORCA_FEEDBACK_API_FALLBACK_URL
  )
  return {
    primary,
    fallback: configuredFallback && configuredFallback !== primary ? configuredFallback : null
  }
}

export function getFeedbackTransportStatus(): FeedbackTransportStatus {
  return { configured: resolveFeedbackEndpoints() !== null }
}

// Why: the Slack notification and any follow-up investigation need to know
// which Orca build and which OS the feedback came from. The main process is
// the only place with trusted access to these values (app.getVersion and the
// node os module), so we enrich the payload here rather than trusting the
// renderer.
function buildSubmitBody(args: InternalFeedbackSubmitArgs): FeedbackSubmitBody {
  const identity = args.submitAnonymously
    ? { githubLogin: null, githubEmail: null }
    : { githubLogin: args.githubLogin, githubEmail: args.githubEmail }

  // Why: anonymity is an IPC-only privacy decision. Allow-list fields here so
  // stale renderer state or future identity-shaped fields cannot leak upstream.
  return {
    feedback: args.feedback,
    submissionType: args.submissionType ?? 'feedback',
    ...identity,
    appVersion: app.getVersion(),
    platform: process.platform,
    osRelease: os.release(),
    arch: process.arch,
    ...(args.submissionType === 'crash' && args.diagnosticBundle
      ? { diagnosticBundle: args.diagnosticBundle }
      : {})
  }
}

async function postFeedback(
  url: string,
  body: FeedbackSubmitBody,
  timeoutMs = FEEDBACK_REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  // Why: a silent feedback endpoint should not leave IPC or crash-report
  // submission flows pending forever.
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const init: RequestInit = {
      method: 'POST',
      ...feedbackRequestBodyInit(body),
      signal: controller.signal
    }
    return await net.fetch(url, init)
  } catch (error) {
    // Why: Electron and Node use different AbortError messages. Normalize our
    // client deadline so support logs explain which request budget expired.
    if (controller.signal.aborted) {
      throw new Error(`request timed out after ${timeoutMs / 1000} seconds`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

function feedbackRequestBodyInit(body: FeedbackSubmitBody): Pick<RequestInit, 'body' | 'headers'> {
  if (!body.diagnosticBundle) {
    return {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  }

  const formData = new FormData()
  appendFeedbackFormField(formData, 'feedback', body.feedback)
  appendFeedbackFormField(formData, 'submissionType', body.submissionType)
  appendFeedbackFormField(formData, 'githubLogin', body.githubLogin)
  appendFeedbackFormField(formData, 'githubEmail', body.githubEmail)
  appendFeedbackFormField(formData, 'appVersion', body.appVersion)
  appendFeedbackFormField(formData, 'platform', body.platform)
  appendFeedbackFormField(formData, 'osRelease', body.osRelease)
  appendFeedbackFormField(formData, 'arch', body.arch)
  appendFeedbackFormField(
    formData,
    'diagnosticBundleSubmissionId',
    body.diagnosticBundle.bundleSubmissionId
  )
  appendFeedbackFormField(formData, 'diagnosticBundleBytes', String(body.diagnosticBundle.bytes))
  appendFeedbackFormField(
    formData,
    'diagnosticBundleSpanCount',
    String(body.diagnosticBundle.spanCount)
  )
  formData.append(
    'diagnosticBundleFile',
    new Blob([body.diagnosticBundle.content], { type: DIAGNOSTIC_BUNDLE_CONTENT_TYPE }),
    `orca-diagnostics-${body.diagnosticBundle.bundleSubmissionId}.ndjson`
  )

  // Why: multipart avoids JSON-escaping a near-cap NDJSON bundle over the
  // backend request limit while still submitting one feedback request.
  return { body: formData }
}

function appendFeedbackFormField(formData: FormData, key: string, value: string | null): void {
  if (value !== null) {
    formData.append(key, value)
  }
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function responseFailure(response: Response): FeedbackRequestFailure {
  return { status: response.status, error: `status ${response.status}` }
}

function errorFailure(error: unknown): FeedbackRequestFailure {
  return { status: null, error: messageFromError(error) }
}

async function submitFallbackFeedback(
  endpoints: FeedbackEndpoints,
  body: FeedbackSubmitBody,
  primaryFailure: FeedbackRequestFailure
): Promise<FeedbackSubmitResult> {
  if (!endpoints.fallback) {
    return { ok: false, ...primaryFailure }
  }
  try {
    const fallback = await postFeedback(endpoints.fallback, body)
    if (fallback.ok) {
      return { ok: true }
    }
    return { ok: false, status: fallback.status, error: `status ${fallback.status}` }
  } catch (fallbackError) {
    const message = messageFromError(fallbackError)
    return {
      ok: false,
      status: null,
      error:
        primaryFailure.status === null ? `${primaryFailure.error}; fallback: ${message}` : message
    }
  }
}

function diagnosticRetryUrl(status: number, endpoints: FeedbackEndpoints): string | null {
  if (DIAGNOSTIC_BUNDLE_JSON_RETRY_STATUSES.has(status)) {
    return endpoints.primary
  }
  if (status === 404 || status >= 500) {
    return endpoints.fallback
  }
  return null
}

async function submitFeedbackWithoutDiagnosticBundle(
  url: string,
  body: FeedbackSubmitBody,
  diagnosticBundleFailure: FeedbackRequestFailure
): Promise<FeedbackSubmitResult> {
  try {
    const response = await postFeedback(url, body)
    if (response.ok) {
      return { ok: true, diagnosticBundleFailure }
    }
    return { ok: false, ...responseFailure(response), diagnosticBundleFailure }
  } catch (error) {
    return { ok: false, ...errorFailure(error), diagnosticBundleFailure }
  }
}

async function submitFeedbackWithDiagnosticBundle(
  body: FeedbackSubmitBody,
  bodyWithoutDiagnosticBundle: FeedbackSubmitBody | null,
  endpoints: FeedbackEndpoints
): Promise<FeedbackSubmitResult> {
  try {
    // Why: diagnostic bundles can approach 4 MiB and need more upload time than
    // the small JSON report-only path, especially on constrained connections.
    const response = await postFeedback(
      endpoints.primary,
      body,
      FEEDBACK_ATTACHMENT_REQUEST_TIMEOUT_MS
    )
    if (response.ok) {
      return { ok: true }
    }
    const failure = responseFailure(response)
    if (bodyWithoutDiagnosticBundle) {
      const retryUrl = diagnosticRetryUrl(response.status, endpoints)
      if (retryUrl) {
        return submitFeedbackWithoutDiagnosticBundle(retryUrl, bodyWithoutDiagnosticBundle, failure)
      }
    }
    return { ok: false, ...failure }
  } catch (error) {
    const failure = errorFailure(error)
    return bodyWithoutDiagnosticBundle
      ? submitFeedbackWithoutDiagnosticBundle(
          endpoints.fallback ?? endpoints.primary,
          bodyWithoutDiagnosticBundle,
          failure
        )
      : { ok: false, ...failure }
  }
}

export async function submitFeedback(
  args: InternalFeedbackSubmitArgs
): Promise<FeedbackSubmitResult> {
  const endpoints = resolveFeedbackEndpoints()
  if (!endpoints) {
    return { ok: false, status: null, error: 'feedback endpoint is not configured' }
  }
  const body = buildSubmitBody(args)
  if (body.diagnosticBundle) {
    const bodyWithoutDiagnosticBundle =
      args.feedbackWithoutDiagnosticBundle !== undefined
        ? buildSubmitBody({
            ...args,
            feedback: args.feedbackWithoutDiagnosticBundle,
            diagnosticBundle: undefined
          })
        : null
    return submitFeedbackWithDiagnosticBundle(body, bodyWithoutDiagnosticBundle, endpoints)
  }
  try {
    const res = await postFeedback(endpoints.primary, body)
    if (res.ok) {
      return { ok: true }
    }
    if (res.status === 404 || res.status >= 500) {
      return submitFallbackFeedback(endpoints, body, responseFailure(res))
    }
    return { ok: false, status: res.status, error: `status ${res.status}` }
  } catch (error) {
    return submitFallbackFeedback(endpoints, body, errorFailure(error))
  }
}

export function registerFeedbackHandlers(): void {
  ipcMain.removeHandler('feedback:getStatus')
  ipcMain.handle('feedback:getStatus', () => getFeedbackTransportStatus())
  ipcMain.removeHandler('feedback:submit')
  ipcMain.handle('feedback:submit', (_event, args: FeedbackSubmitArgs) =>
    // Why: crash submissions are main-only. A compromised renderer can invoke
    // this channel directly, so force the public feedback lane at the boundary.
    submitFeedback({ ...args, submissionType: 'feedback' })
  )
}
