export function pickRemoteCliEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  const picked: Record<string, string> = {}
  for (const suffix of [
    'TERMINAL_HANDLE',
    'WORKTREE_ID',
    'PANE_KEY',
    'WORKSPACE_ID',
    'USER_DATA_PATH'
  ]) {
    const value = env[`SBBGT_${suffix}`] ?? env[`ORCA_${suffix}`]
    if (typeof value === 'string') {
      picked[`SBBGT_${suffix}`] = value
      picked[`ORCA_${suffix}`] = value
    }
  }
  for (const key of ['PATH', 'Path']) {
    const value = env[key]
    if (typeof value === 'string') {
      picked[key] = value
    }
  }
  return picked
}
