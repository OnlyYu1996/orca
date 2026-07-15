import { RefreshCw, SlidersHorizontal } from 'lucide-react'
import type {
  CodeBuddyUsageRange,
  CodeBuddyUsageScope
} from '../../../../shared/codebuddy-usage-types'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { translate } from '@/i18n/i18n'

export const CODEBUDDY_USAGE_RANGES: CodeBuddyUsageRange[] = ['7d', '30d', '90d', 'all']

export const CODEBUDDY_USAGE_RANGE_LABELS: Record<CodeBuddyUsageRange, string> = {
  get '7d'() {
    return translate('auto.components.stats.CodeBuddyUsagePane.range7d', 'Last 7 days')
  },
  get '30d'() {
    return translate('auto.components.stats.CodeBuddyUsagePane.range30d', 'Last 30 days')
  },
  get '90d'() {
    return translate('auto.components.stats.CodeBuddyUsagePane.range90d', 'Last 90 days')
  },
  get all() {
    return translate('auto.components.stats.CodeBuddyUsagePane.rangeAll', 'All time')
  }
}

export const CODEBUDDY_USAGE_SCOPE_LABELS: Record<CodeBuddyUsageScope, string> = {
  get worktrees() {
    return translate(
      'auto.components.stats.CodeBuddyUsagePane.scopeWorktrees',
      'Cyber Contractor worktrees only'
    )
  },
  get all() {
    return translate(
      'auto.components.stats.CodeBuddyUsagePane.scopeAll',
      'All local CodeBuddy usage'
    )
  }
}

export function CodeBuddyUsageControls({
  scope,
  range,
  isScanning,
  onScopeChange,
  onRangeChange,
  onRefresh,
  onDisable
}: {
  scope: CodeBuddyUsageScope
  range: CodeBuddyUsageRange
  isScanning: boolean
  onScopeChange: (scope: CodeBuddyUsageScope) => void
  onRangeChange: (range: CodeBuddyUsageRange) => void
  onRefresh: () => void
  onDisable: () => void
}): React.JSX.Element {
  return (
    <div className="flex shrink-0 items-center gap-2 self-start">
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={translate(
                  'auto.components.stats.CodeBuddyUsagePane.options',
                  'CodeBuddy usage options'
                )}
              >
                <SlidersHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            {translate('auto.components.stats.CodeBuddyUsagePane.filters', 'Filters')}
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>
            {translate('auto.components.stats.CodeBuddyUsagePane.scope', 'Scope')}
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={scope}
            onValueChange={(value) => onScopeChange(value as CodeBuddyUsageScope)}
          >
            {(Object.keys(CODEBUDDY_USAGE_SCOPE_LABELS) as CodeBuddyUsageScope[]).map((value) => (
              <DropdownMenuRadioItem key={value} value={value}>
                {CODEBUDDY_USAGE_SCOPE_LABELS[value]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>
            {translate('auto.components.stats.CodeBuddyUsagePane.range', 'Range')}
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={range}
            onValueChange={(value) => onRangeChange(value as CodeBuddyUsageRange)}
          >
            {CODEBUDDY_USAGE_RANGES.map((value) => (
              <DropdownMenuRadioItem key={value} value={value}>
                {CODEBUDDY_USAGE_RANGE_LABELS[value]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRefresh}
            disabled={isScanning}
            aria-label={translate(
              'auto.components.stats.CodeBuddyUsagePane.refresh',
              'Refresh CodeBuddy usage'
            )}
          >
            <RefreshCw className={`size-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          {translate('auto.components.stats.CodeBuddyUsagePane.refreshLabel', 'Refresh')}
        </TooltipContent>
      </Tooltip>
      <button
        type="button"
        role="switch"
        aria-checked={true}
        aria-label={translate(
          'auto.components.stats.CodeBuddyUsagePane.enableAnalytics',
          'Enable CodeBuddy usage analytics'
        )}
        onClick={onDisable}
        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-foreground transition-colors"
      >
        <span className="pointer-events-none block size-3.5 translate-x-4 rounded-full bg-background shadow-sm transition-transform" />
      </button>
    </div>
  )
}
