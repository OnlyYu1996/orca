import { ClaudeHookService } from '../claude/hook-service'
import { CODEBUDDY_HOOK_SETTINGS } from '../claude/hook-settings'

// CodeBuddy v1.16+ 使用 Claude 兼容事件结构，但必须保持独立来源与配置目录。
export const codeBuddyHookService = new ClaudeHookService({
  agent: 'codebuddy',
  displayName: 'CodeBuddy',
  settings: CODEBUDDY_HOOK_SETTINGS,
  hookSource: 'codebuddy'
})
