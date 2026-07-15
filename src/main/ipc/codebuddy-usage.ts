import { ipcMain } from 'electron'
import type {
  CodeBuddyUsageBreakdownKind,
  CodeBuddyUsageRange,
  CodeBuddyUsageScope
} from '../../shared/codebuddy-usage-types'
import type { CodeBuddyUsageStore } from '../codebuddy-usage/store'

export function registerCodeBuddyUsageHandlers(codeBuddyUsage: CodeBuddyUsageStore): void {
  ipcMain.handle('codeBuddyUsage:getScanState', () => codeBuddyUsage.getScanState())
  ipcMain.handle('codeBuddyUsage:setEnabled', (_event, args: { enabled: boolean }) =>
    codeBuddyUsage.setEnabled(args.enabled)
  )
  ipcMain.handle('codeBuddyUsage:refresh', (_event, args?: { force?: boolean }) =>
    codeBuddyUsage.refresh(args?.force ?? false)
  )
  ipcMain.handle(
    'codeBuddyUsage:getSnapshot',
    (_event, args: { scope: CodeBuddyUsageScope; range: CodeBuddyUsageRange; limit?: number }) =>
      codeBuddyUsage.getSnapshot(args.scope, args.range, args.limit)
  )
  ipcMain.handle(
    'codeBuddyUsage:getSummary',
    (_event, args: { scope: CodeBuddyUsageScope; range: CodeBuddyUsageRange }) =>
      codeBuddyUsage.getSummary(args.scope, args.range)
  )
  ipcMain.handle(
    'codeBuddyUsage:getDaily',
    (_event, args: { scope: CodeBuddyUsageScope; range: CodeBuddyUsageRange }) =>
      codeBuddyUsage.getDaily(args.scope, args.range)
  )
  ipcMain.handle(
    'codeBuddyUsage:getBreakdown',
    (
      _event,
      args: {
        scope: CodeBuddyUsageScope
        range: CodeBuddyUsageRange
        kind: CodeBuddyUsageBreakdownKind
      }
    ) => codeBuddyUsage.getBreakdown(args.scope, args.range, args.kind)
  )
  ipcMain.handle(
    'codeBuddyUsage:getRecentSessions',
    (_event, args: { scope: CodeBuddyUsageScope; range: CodeBuddyUsageRange; limit?: number }) =>
      codeBuddyUsage.getRecentSessions(args.scope, args.range, args.limit)
  )
}
