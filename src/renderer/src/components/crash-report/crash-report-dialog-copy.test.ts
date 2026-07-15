import { describe, expect, it, vi } from 'vitest'
import type { CrashReportRecord } from '../../../../shared/crash-reporting'

vi.mock('@/i18n/i18n', () => ({
  translate: (_key: string, fallback: string, options?: { value0?: unknown }) =>
    fallback.replace('{{value0}}', String(options?.value0 ?? ''))
}))

import { buildCrashReportIssueUrl } from './crash-report-dialog-copy'

function report(): CrashReportRecord {
  return {
    id: 'crash-1',
    createdAt: '2026-07-14T00:00:00.000Z',
    status: 'pending',
    source: 'child',
    processType: 'renderer',
    reason: 'crashed',
    exitCode: 5,
    appVersion: '1.4.139',
    platform: 'darwin',
    osRelease: 'test',
    arch: 'arm64',
    electronVersion: '43',
    chromeVersion: '142',
    details: {}
  }
}

describe('buildCrashReportIssueUrl', () => {
  it('opens the current fork and includes the reviewed diagnostic text', () => {
    const url = new URL(buildCrashReportIssueUrl(report(), 'redacted diagnostic text'))

    expect(`${url.origin}${url.pathname}`).toBe('https://github.com/OnlyYu1996/orca/issues/new')
    expect(url.searchParams.get('title')).toContain('renderer crashed')
    expect(url.searchParams.get('body')).toContain('redacted diagnostic text')
  })

  it('bounds oversized issue drafts', () => {
    const url = new URL(buildCrashReportIssueUrl(report(), 'x'.repeat(20_000)))
    const body = url.searchParams.get('body') ?? ''

    expect(body.length).toBeLessThan(6_500)
    expect(body).toContain('Details truncated for the GitHub draft')
  })
})
