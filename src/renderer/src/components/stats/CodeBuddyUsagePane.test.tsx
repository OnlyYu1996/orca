// @vitest-environment happy-dom

import '@testing-library/jest-dom/vitest'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../../store'

const actions = vi.hoisted(() => ({
  fetchUsage: vi.fn(),
  setEnabled: vi.fn(),
  refreshUsage: vi.fn(),
  setScope: vi.fn(),
  setRange: vi.fn(),
  recordFeatureInteraction: vi.fn()
}))

let storeState: Partial<AppState>

vi.mock('../../store', () => ({
  useAppStore: (selector: (state: Partial<AppState>) => unknown) => selector(storeState)
}))

vi.mock('./CodeBuddyUsageControls', () => ({
  CODEBUDDY_USAGE_RANGE_LABELS: { '7d': '7 days', '30d': '30 days', '90d': '90 days', all: 'All' },
  CODEBUDDY_USAGE_SCOPE_LABELS: { worktrees: 'Worktrees', all: 'All local' },
  CodeBuddyUsageControls: ({ onDisable }: { onDisable: () => void }) => (
    <button type="button" onClick={onDisable}>
      Disable
    </button>
  )
}))

vi.mock('./OpenCodeUsageDetails', () => ({
  OpenCodeUsageDetails: () => <div data-testid="codebuddy-usage-details" />
}))

vi.mock('@/i18n/i18n', () => ({
  translate: (_key: string, fallback: string, values?: Record<string, string>) =>
    values
      ? Object.entries(values).reduce(
          (text, [token, value]) => text.replace(`{{${token}}}`, value),
          fallback
        )
      : fallback
}))

import { CodeBuddyUsagePane } from './CodeBuddyUsagePane'

function baseState(): Partial<AppState> {
  return {
    codeBuddyUsageScope: 'all',
    codeBuddyUsageRange: '30d',
    codeBuddyUsageScanState: {
      enabled: false,
      isScanning: false,
      lastScanStartedAt: null,
      lastScanCompletedAt: null,
      lastScanError: null,
      hasAnyCodeBuddyData: false
    },
    codeBuddyUsageSummary: null,
    codeBuddyUsageDaily: [],
    codeBuddyUsageModelBreakdown: [],
    codeBuddyUsageProjectBreakdown: [],
    codeBuddyUsageRecentSessions: [],
    fetchCodeBuddyUsage: actions.fetchUsage,
    setCodeBuddyUsageEnabled: actions.setEnabled,
    refreshCodeBuddyUsage: actions.refreshUsage,
    setCodeBuddyUsageScope: actions.setScope,
    setCodeBuddyUsageRange: actions.setRange,
    recordFeatureInteraction: actions.recordFeatureInteraction
  }
}

describe('CodeBuddyUsagePane', () => {
  beforeEach(() => {
    storeState = baseState()
    actions.fetchUsage.mockResolvedValue(undefined)
    actions.setEnabled.mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('offers an explicit opt-in when tracking is disabled', async () => {
    const user = userEvent.setup()
    render(<CodeBuddyUsagePane />)

    await user.click(screen.getByRole('switch', { name: 'Enable CodeBuddy usage analytics' }))

    expect(actions.fetchUsage).toHaveBeenCalledOnce()
    expect(actions.recordFeatureInteraction).toHaveBeenCalledWith('usage-tracking')
    expect(actions.setEnabled).toHaveBeenCalledWith(true)
  })

  it('renders CodeBuddy token categories and details when data exists', () => {
    storeState = {
      ...baseState(),
      codeBuddyUsageScanState: {
        enabled: true,
        isScanning: false,
        lastScanStartedAt: 100,
        lastScanCompletedAt: 200,
        lastScanError: null,
        hasAnyCodeBuddyData: true
      },
      codeBuddyUsageSummary: {
        scope: 'all',
        range: '30d',
        sessions: 2,
        events: 8,
        inputTokens: 10_000,
        cachedInputTokens: 4_000,
        outputTokens: 2_000,
        reasoningOutputTokens: 500,
        totalTokens: 12_000,
        estimatedCostUsd: null,
        topModel: 'GLM-5.1',
        topProject: 'Repo',
        hasAnyCodeBuddyData: true
      }
    }
    render(<CodeBuddyUsagePane />)

    expect(screen.getByText('Total tokens')).toBeInTheDocument()
    expect(screen.getByText('12.0k')).toBeInTheDocument()
    expect(screen.getByText('Cached input')).toBeInTheDocument()
    expect(screen.getByText('4.0k')).toBeInTheDocument()
    expect(screen.getByText('Reasoning output')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('2 / 8')).toBeInTheDocument()
    expect(screen.getByTestId('codebuddy-usage-details')).toBeInTheDocument()
  })
})
