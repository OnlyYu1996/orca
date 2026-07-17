import type {
  SkillFreshnessGroupModel,
  SkillLocationChip,
  SkillLocationRow
} from './skill-freshness-grouping'
import { translate } from '@/i18n/i18n'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function chipLabel(chip: SkillLocationChip): string {
  switch (chip) {
    case 'current':
      return translate('auto.components.skills.SkillFreshnessRow.chipCurrent', 'Current')
    case 'unrecognized':
      return translate('auto.components.skills.SkillFreshnessRow.chipUnrecognized', 'Unrecognized')
    case 'inaccessible':
      return translate('auto.components.skills.SkillFreshnessRow.chipInaccessible', 'Inaccessible')
    case 'duplicate':
      return translate('auto.components.skills.SkillFreshnessRow.chipDuplicate', 'Duplicate')
    case 'external-link':
      return translate('auto.components.skills.SkillFreshnessRow.chipExternalLink', 'External link')
    case 'broken-link':
      return translate('auto.components.skills.SkillFreshnessRow.chipBrokenLink', 'Broken link')
    case 'read-only':
      return translate('auto.components.skills.SkillFreshnessRow.chipReadOnly', 'Read only')
    case 'in-a-repo':
      return translate('auto.components.skills.SkillFreshnessRow.chipInRepo', 'In a repo')
    case 'plugin-cache':
      return translate('auto.components.skills.SkillFreshnessRow.chipPluginCache', 'Plugin cache')
  }
}

// Why: chips describe only what a location *is*; the effect on the update
// command lives in the per-skill sentence, so the two never say it twice.
function chipTooltip(chip: SkillLocationChip): string {
  switch (chip) {
    case 'current':
      return translate(
        'auto.components.skills.SkillFreshnessRow.tipCurrent',
        'This copy matches the current official version.'
      )
    case 'unrecognized':
      return translate(
        'auto.components.skills.SkillFreshnessRow.tipUnrecognized',
        'This copy doesn’t match any official version — it may be modified, or a different skill with the same name.'
      )
    case 'inaccessible':
      return translate(
        'auto.components.skills.SkillFreshnessRow.tipInaccessible',
        '赛博包工头无法读取此副本（权限或文件错误）。'
      )
    case 'duplicate':
      return translate(
        'auto.components.skills.SkillFreshnessRow.tipDuplicate',
        'A separate copy of this skill, installed apart from the main one.'
      )
    case 'external-link':
      return translate(
        'auto.components.skills.SkillFreshnessRow.tipExternalLink',
        '指向赛博包工头技能文件夹之外的快捷方式。'
      )
    case 'broken-link':
      return translate(
        'auto.components.skills.SkillFreshnessRow.tipBrokenLink',
        'A shortcut to something that no longer exists.'
      )
    case 'read-only':
      return translate(
        'auto.components.skills.SkillFreshnessRow.tipReadOnly',
        'This copy is in a read-only location.'
      )
    case 'in-a-repo':
      return translate(
        'auto.components.skills.SkillFreshnessRow.tipInRepo',
        'This copy lives inside a project, not your global skills.'
      )
    case 'plugin-cache':
      return translate(
        'auto.components.skills.SkillFreshnessRow.tipPluginCache',
        'This copy is managed by a plugin.'
      )
  }
}

// Why: a skill is skipped for one concrete reason; lead with the highest-priority
// blocking placement so the sentence explains the real cause (an edited copy is
// more useful to surface than a downstream symptom).
const SKIPPED_REASON_PRIORITY: SkillLocationChip[] = [
  'unrecognized',
  'read-only',
  'inaccessible',
  'in-a-repo',
  'plugin-cache',
  'external-link',
  'broken-link'
]

function skippedReason(locations: readonly SkillLocationRow[]): string {
  const present = new Set(locations.map((location) => location.chip))
  const chip = SKIPPED_REASON_PRIORITY.find((candidate) => present.has(candidate))
  switch (chip) {
    case 'unrecognized':
      return translate(
        'auto.components.skills.SkillFreshnessRow.skippedReasonUnrecognized',
        '此副本与官方版本不匹配，可能已被修改或是同名的其他技能。赛博包工头不会覆盖它；移除后才能更新此技能。'
      )
    case 'read-only':
      return translate(
        'auto.components.skills.SkillFreshnessRow.skippedReasonReadOnly',
        '此副本位于只读位置，因此未包含在更新中。修改权限后，赛博包工头才能更新它。'
      )
    case 'inaccessible':
      return translate(
        'auto.components.skills.SkillFreshnessRow.skippedReasonInaccessible',
        '赛博包工头无法读取此副本，因此未将该技能包含在更新中。'
      )
    case 'in-a-repo':
      return translate(
        'auto.components.skills.SkillFreshnessRow.skippedReasonInRepo',
        '这是项目技能而非全局技能；赛博包工头只更新全局技能，因此未将其包含在更新中。'
      )
    case 'plugin-cache':
      return translate(
        'auto.components.skills.SkillFreshnessRow.skippedReasonPluginCache',
        '此技能由插件管理，因此未包含在更新中；请改为更新插件。'
      )
    case 'external-link':
      return translate(
        'auto.components.skills.SkillFreshnessRow.skippedReasonExternalLink',
        '此副本是指向赛博包工头技能文件夹之外的快捷方式，因此未包含在更新中。'
      )
    case 'broken-link':
      return translate(
        'auto.components.skills.SkillFreshnessRow.skippedReasonBrokenLink',
        '此副本指向已不存在的内容，因此未包含在更新中；可以安全删除。'
      )
    case undefined:
    case 'current':
    case 'duplicate':
      return translate(
        'auto.components.skills.SkillFreshnessRow.cantUpdateReason',
        '赛博包工头未将此技能包含在更新命令中。'
      )
  }
}

export function SkillFreshnessGroup({
  group
}: {
  group: SkillFreshnessGroupModel
}): React.JSX.Element {
  const isBlocked = group.status === 'cannot-update'
  return (
    <div className="space-y-2 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">{group.name}</span>
        {isBlocked ? (
          <Badge
            variant="outline"
            className="border-amber-600/50 text-amber-700 dark:border-amber-400/40 dark:text-amber-400"
          >
            {translate('auto.components.skills.SkillFreshnessRow.statusCantUpdate', 'Skipped')}
          </Badge>
        ) : (
          <Badge variant="secondary">
            {translate(
              'auto.components.skills.SkillFreshnessRow.statusUpdateAvailable',
              'Update available'
            )}
          </Badge>
        )}
      </div>
      {isBlocked ? (
        <p className="text-xs leading-5 text-muted-foreground">{skippedReason(group.locations)}</p>
      ) : null}
      <div className="flex flex-col gap-2">
        {group.locations.map((location) => (
          <div
            key={location.id}
            className="flex min-w-0 flex-wrap items-center gap-2 border-l-2 border-border/60 pl-3"
          >
            <span
              className="truncate font-mono text-[11px] text-muted-foreground"
              title={location.path}
            >
              {location.path}
            </span>
            {location.chip ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="cursor-help border-dashed">
                    {chipLabel(location.chip)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-pretty">
                  {chipTooltip(location.chip)}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
