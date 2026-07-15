import {
  isReactErrorBoundaryReport,
  type CrashReportRecord
} from '../../../../shared/crash-reporting'
import { PRODUCT_NEW_ISSUE_URL } from '../../../../shared/product-links'
import { translate } from '@/i18n/i18n'

const MAX_GITHUB_ISSUE_BODY_CHARS = 6_000

export function formatCrashReportSummary(report: CrashReportRecord): string {
  if (isReactErrorBoundaryReport(report)) {
    const surface = typeof report.details.surface === 'string' ? report.details.surface : null
    return surface
      ? translate(
          'auto.components.crash.report.CrashReportDialog.summary.reactSurface',
          'React render error in {{value0}}',
          { value0: surface }
        )
      : translate(
          'auto.components.crash.report.CrashReportDialog.summary.react',
          'React render error'
        )
  }
  return `${report.processType} ${report.reason}${
    report.exitCode === null ? '' : ` (exit ${report.exitCode})`
  }`
}

export function getCrashReportDialogTitle(report: CrashReportRecord | null): string {
  if (!report) {
    return translate(
      'auto.components.crash.report.CrashReportDialog.title.manual',
      'Report a crash'
    )
  }
  return isReactErrorBoundaryReport(report)
    ? translate(
        'auto.components.crash.report.CrashReportDialog.title.recoverable',
        'Cyber Foreman hit a recoverable UI error'
      )
    : translate(
        'auto.components.crash.report.CrashReportDialog.title.unexpected',
        'Cyber Foreman closed unexpectedly'
      )
}

export function getCrashReportDialogDescription(
  report: CrashReportRecord | null,
  transportConfigured: boolean
): string {
  if (!transportConfigured) {
    return translate(
      'auto.components.crash.report.CrashReportDialog.description.repository',
      'Review the privacy-safe details, then open a draft issue in the current repository.'
    )
  }
  if (!report) {
    return translate(
      'auto.components.crash.report.CrashReportDialog.description.manual',
      'Send a privacy-safe crash report. Recent redacted diagnostic logs are included when available.'
    )
  }
  return isReactErrorBoundaryReport(report)
    ? translate(
        'auto.components.crash.report.CrashReportDialog.description.recoverable',
        'Send a privacy-safe diagnostic report to help us understand the failed UI surface.'
      )
    : translate(
        'auto.components.crash.report.CrashReportDialog.description.unexpected',
        'Send a privacy-safe diagnostic report to help us understand what happened.'
      )
}

export function getCrashReportNotesPlaceholder(report: CrashReportRecord | null): string {
  if (!report) {
    return translate(
      'auto.components.crash.report.CrashReportDialog.placeholder.manual',
      'Optional: what happened?'
    )
  }
  return isReactErrorBoundaryReport(report)
    ? translate(
        'auto.components.crash.report.CrashReportDialog.placeholder.recoverable',
        'Optional: what were you doing before this UI error?'
      )
    : translate(
        'auto.components.crash.report.CrashReportDialog.placeholder.unexpected',
        'Optional: what were you doing before Cyber Foreman closed?'
      )
}

export function buildCrashReportIssueUrl(
  report: CrashReportRecord | null,
  diagnosticText: string
): string {
  const summary = report
    ? formatCrashReportSummary(report)
    : translate(
        'auto.components.crash.report.CrashReportDialog.issue.uncaptured',
        'Uncaptured crash report'
      )
  const url = new URL(PRODUCT_NEW_ISSUE_URL)
  url.searchParams.set(
    'title',
    translate('auto.components.crash.report.CrashReportDialog.issue.title', '[Crash] {{value0}}', {
      value0: summary
    })
  )
  const body = [
    `## ${translate('auto.components.crash.report.CrashReportDialog.issue.heading', 'Crash details')}`,
    '',
    diagnosticText || summary,
    '',
    '---',
    translate(
      'auto.components.crash.report.CrashReportDialog.issue.footer',
      'Drafted from the Cyber Foreman app. Review the content before submitting.'
    )
  ].join('\n')
  const boundedBody =
    body.length <= MAX_GITHUB_ISSUE_BODY_CHARS
      ? body
      : `${body.slice(0, MAX_GITHUB_ISSUE_BODY_CHARS)}\n\n${translate(
          'auto.components.crash.report.CrashReportDialog.issue.truncated',
          '[Details truncated for the GitHub draft. Use Copy Details for the complete report.]'
        )}`
  url.searchParams.set('body', boundedBody)
  return url.toString()
}
