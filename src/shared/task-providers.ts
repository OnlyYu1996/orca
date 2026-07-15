export type TaskProvider = 'github' | 'gitlab' | 'linear' | 'jira'

export const TASK_PROVIDERS: readonly TaskProvider[] = ['github', 'gitlab', 'linear', 'jira']
// 当前产品只接收 GitLab 任务；保留完整 Provider 清单，便于后续恢复上游能力。
export const ACTIVE_TASK_PROVIDERS: readonly TaskProvider[] = ['gitlab']

const TASK_PROVIDER_SET = new Set<TaskProvider>(TASK_PROVIDERS)

export function isTaskProvider(value: unknown): value is TaskProvider {
  return TASK_PROVIDER_SET.has(value as TaskProvider)
}

export function normalizeTaskProviderSettings(_value: {
  visibleTaskProviders: unknown
  defaultTaskSource: unknown
}): { visibleTaskProviders: TaskProvider[]; defaultTaskSource: TaskProvider } {
  return {
    defaultTaskSource: 'gitlab',
    visibleTaskProviders: [...ACTIVE_TASK_PROVIDERS]
  }
}

export function normalizeVisibleTaskProviders(_value: unknown): TaskProvider[] {
  return [...ACTIVE_TASK_PROVIDERS]
}

export type TaskProviderAvailability = {
  gitlabInstalled: boolean
  linearConnected: boolean
}

export function filterAvailableTaskProviders(
  visibleProviders: readonly TaskProvider[],
  availability: TaskProviderAvailability
): TaskProvider[] {
  const preferredProviders = normalizeVisibleTaskProviders(visibleProviders)
  const available = preferredProviders.filter((provider) =>
    isTaskProviderAvailable(provider, availability)
  )

  // GitLab 未就绪时仍保留其入口，用于展示安装或连接指引，禁止回退到其他来源。
  return available.length > 0 ? available : [...ACTIVE_TASK_PROVIDERS]
}

export function restoreAvailableDefaultTaskProvider(
  visibleProviders: readonly TaskProvider[],
  availability: TaskProviderAvailability,
  _preferredProvider: unknown
): TaskProvider[] {
  return filterAvailableTaskProviders(visibleProviders, availability)
}

function isTaskProviderAvailable(
  provider: TaskProvider,
  availability: TaskProviderAvailability
): boolean {
  if (provider === 'github') {
    return true
  }
  if (provider === 'gitlab') {
    return availability.gitlabInstalled
  }
  // Why: Jira can be connected from the Tasks surface itself, so hiding it
  // when disconnected would remove the entry point for first-time setup.
  if (provider === 'jira') {
    return true
  }
  return availability.linearConnected
}

export function resolveVisibleTaskProvider(
  _preferred: TaskProvider | null | undefined,
  _visibleProviders: readonly TaskProvider[]
): TaskProvider {
  return 'gitlab'
}
