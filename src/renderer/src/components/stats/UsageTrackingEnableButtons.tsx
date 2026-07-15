import type { UsageProviderId } from './usage-overview-model'
import { Button } from '../ui/button'
import { translate } from '@/i18n/i18n'

export function UsageTrackingEnableButtons({
  onEnable
}: {
  onEnable: (provider: UsageProviderId) => void
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => onEnable('claude')}>
        {translate('auto.components.stats.UsageOverviewPane.0ea0cae435', 'Enable Claude')}
      </Button>
      <Button variant="secondary" size="sm" onClick={() => onEnable('codex')}>
        {translate('auto.components.stats.UsageOverviewPane.2f1ee2878b', 'Enable Codex')}
      </Button>
      <Button variant="outline" size="sm" onClick={() => onEnable('codebuddy')}>
        {translate('auto.components.stats.UsageOverviewPane.enableCodeBuddy', 'Enable CodeBuddy')}
      </Button>
      <Button variant="outline" size="sm" onClick={() => onEnable('opencode')}>
        {translate('auto.components.stats.UsageOverviewPane.2d13e57f72', 'Enable OpenCode')}
      </Button>
    </div>
  )
}
