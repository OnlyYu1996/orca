import { useEffect } from 'react'
import { Activity, Brain, DatabaseZap, FolderKanban, Sparkles, Sigma } from 'lucide-react'
import { useAppStore } from '../../store'
import { ClaudeUsageLoadingState } from './ClaudeUsageLoadingState'
import {
  CODEBUDDY_USAGE_RANGE_LABELS,
  CODEBUDDY_USAGE_SCOPE_LABELS,
  CodeBuddyUsageControls
} from './CodeBuddyUsageControls'
import { OpenCodeUsageDetails } from './OpenCodeUsageDetails'
import { StatCard } from './StatCard'
import { formatTokens, formatUpdatedAt } from './usage-formatters'
import { translate } from '@/i18n/i18n'

export function CodeBuddyUsagePane(): React.JSX.Element {
  const scanState = useAppStore((state) => state.codeBuddyUsageScanState)
  const summary = useAppStore((state) => state.codeBuddyUsageSummary)
  const daily = useAppStore((state) => state.codeBuddyUsageDaily)
  const modelBreakdown = useAppStore((state) => state.codeBuddyUsageModelBreakdown)
  const projectBreakdown = useAppStore((state) => state.codeBuddyUsageProjectBreakdown)
  const recentSessions = useAppStore((state) => state.codeBuddyUsageRecentSessions)
  const scope = useAppStore((state) => state.codeBuddyUsageScope)
  const range = useAppStore((state) => state.codeBuddyUsageRange)
  const fetchUsage = useAppStore((state) => state.fetchCodeBuddyUsage)
  const setEnabled = useAppStore((state) => state.setCodeBuddyUsageEnabled)
  const refreshUsage = useAppStore((state) => state.refreshCodeBuddyUsage)
  const setScope = useAppStore((state) => state.setCodeBuddyUsageScope)
  const setRange = useAppStore((state) => state.setCodeBuddyUsageRange)
  const recordFeatureInteraction = useAppStore((state) => state.recordFeatureInteraction)

  useEffect(() => {
    void fetchUsage()
  }, [fetchUsage])

  const handleSetEnabled = (enabled: boolean): void => {
    recordFeatureInteraction('usage-tracking')
    void setEnabled(enabled)
  }

  if (!scanState?.enabled) {
    return (
      <div className="rounded-lg border border-border/60 bg-card/40 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              {translate(
                'auto.components.stats.CodeBuddyUsagePane.title',
                'CodeBuddy Usage Tracking'
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {translate(
                'auto.components.stats.CodeBuddyUsagePane.description',
                'Reads local CodeBuddy session logs to show token, model, and session stats.'
              )}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={false}
            aria-label={translate(
              'auto.components.stats.CodeBuddyUsagePane.enableAnalytics',
              'Enable CodeBuddy usage analytics'
            )}
            onClick={() => handleSetEnabled(true)}
            className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-muted-foreground/30 transition-colors"
          >
            <span className="pointer-events-none block size-3.5 translate-x-0.5 rounded-full bg-background shadow-sm transition-transform" />
          </button>
        </div>
      </div>
    )
  }

  if (!summary && (scanState.isScanning || scanState.lastScanCompletedAt === null)) {
    return (
      <ClaudeUsageLoadingState
        title={translate(
          'auto.components.stats.CodeBuddyUsagePane.title',
          'CodeBuddy Usage Tracking'
        )}
        summaryCardCount={6}
        summaryGridClassName="md:grid-cols-3"
      />
    )
  }

  const hasAnyData = summary?.hasAnyCodeBuddyData ?? scanState.hasAnyCodeBuddyData
  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-card/30 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            {translate(
              'auto.components.stats.CodeBuddyUsagePane.title',
              'CodeBuddy Usage Tracking'
            )}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatUpdatedAt(scanState.lastScanCompletedAt)}
            {scanState.lastScanError
              ? translate(
                  'auto.components.stats.CodeBuddyUsagePane.scanError',
                  ' - Last scan error: {{value0}}',
                  { value0: scanState.lastScanError }
                )
              : ''}
          </p>
        </div>
        <CodeBuddyUsageControls
          scope={scope}
          range={range}
          isScanning={scanState.isScanning}
          onScopeChange={(value) => void setScope(value)}
          onRangeChange={(value) => void setRange(value)}
          onRefresh={() => void refreshUsage()}
          onDisable={() => handleSetEnabled(false)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {CODEBUDDY_USAGE_SCOPE_LABELS[scope]} - {CODEBUDDY_USAGE_RANGE_LABELS[range]}
      </p>

      {!hasAnyData ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-card/30 px-4 py-6 text-sm text-muted-foreground">
          {translate(
            'auto.components.stats.CodeBuddyUsagePane.empty',
            'No local CodeBuddy usage found yet for this scope.'
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <StatCard
              label={translate('auto.components.stats.CodeBuddyUsagePane.total', 'Total tokens')}
              value={formatTokens(summary?.totalTokens ?? 0)}
              icon={<Sigma className="size-4" />}
            />
            <StatCard
              label={translate('auto.components.stats.CodeBuddyUsagePane.input', 'Input tokens')}
              value={formatTokens(summary?.inputTokens ?? 0)}
              icon={<Sparkles className="size-4" />}
            />
            <StatCard
              label={translate('auto.components.stats.CodeBuddyUsagePane.output', 'Output tokens')}
              value={formatTokens(summary?.outputTokens ?? 0)}
              icon={<Activity className="size-4" />}
            />
            <StatCard
              label={translate('auto.components.stats.CodeBuddyUsagePane.cache', 'Cached input')}
              value={formatTokens(summary?.cachedInputTokens ?? 0)}
              icon={<DatabaseZap className="size-4" />}
            />
            <StatCard
              label={translate(
                'auto.components.stats.CodeBuddyUsagePane.reasoning',
                'Reasoning output'
              )}
              value={formatTokens(summary?.reasoningOutputTokens ?? 0)}
              icon={<Brain className="size-4" />}
            />
            <StatCard
              label={translate(
                'auto.components.stats.CodeBuddyUsagePane.sessions',
                'Sessions / Events'
              )}
              value={`${(summary?.sessions ?? 0).toLocaleString()} / ${(summary?.events ?? 0).toLocaleString()}`}
              icon={<FolderKanban className="size-4" />}
            />
          </div>

          <OpenCodeUsageDetails
            daily={daily}
            modelBreakdown={modelBreakdown}
            projectBreakdown={projectBreakdown}
            recentSessions={recentSessions}
            summary={summary}
          />
        </>
      )}
    </div>
  )
}
