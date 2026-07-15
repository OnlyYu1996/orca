import { describe, expect, it } from 'vitest'
import {
  filterAvailableTaskProviders,
  normalizeTaskProviderSettings,
  normalizeVisibleTaskProviders,
  restoreAvailableDefaultTaskProvider,
  resolveVisibleTaskProvider
} from './task-providers'

describe('task providers', () => {
  it('normalizes any provider list to GitLab only', () => {
    expect(normalizeVisibleTaskProviders(['github', 'unknown', 'linear', 'jira'])).toEqual([
      'gitlab'
    ])
  })

  it('keeps GitLab enabled when no provider is saved', () => {
    expect(normalizeVisibleTaskProviders([])).toEqual(['gitlab'])
  })

  it('overrides drifted provider settings with the GitLab-only policy', () => {
    expect(
      normalizeTaskProviderSettings({
        visibleTaskProviders: ['linear'],
        defaultTaskSource: 'github'
      })
    ).toEqual({
      defaultTaskSource: 'gitlab',
      visibleTaskProviders: ['gitlab']
    })
  })

  it('normalizes invalid saved defaults to the first visible provider', () => {
    expect(
      normalizeTaskProviderSettings({
        visibleTaskProviders: ['gitlab'],
        defaultTaskSource: 'bitbucket'
      })
    ).toEqual({
      defaultTaskSource: 'gitlab',
      visibleTaskProviders: ['gitlab']
    })
  })

  it('resolves every preferred provider to GitLab', () => {
    expect(resolveVisibleTaskProvider('github', ['linear'])).toBe('gitlab')
  })

  it('filters non-GitLab providers even when they are available', () => {
    expect(
      filterAvailableTaskProviders(['github', 'gitlab', 'linear'], {
        gitlabInstalled: false,
        linearConnected: true
      })
    ).toEqual(['gitlab'])
  })

  it('does not restore an available non-GitLab saved default', () => {
    expect(
      restoreAvailableDefaultTaskProvider(
        ['linear'],
        {
          gitlabInstalled: false,
          linearConnected: true
        },
        'github'
      )
    ).toEqual(['gitlab'])
  })

  it('replaces intentionally narrowed non-GitLab providers', () => {
    expect(
      restoreAvailableDefaultTaskProvider(
        ['linear'],
        {
          gitlabInstalled: false,
          linearConnected: true
        },
        'linear'
      )
    ).toEqual(['gitlab'])
  })

  it('keeps GitLab when the saved GitLab default is unavailable', () => {
    expect(
      restoreAvailableDefaultTaskProvider(
        ['linear'],
        {
          gitlabInstalled: false,
          linearConnected: true
        },
        'gitlab'
      )
    ).toEqual(['gitlab'])
  })

  it('ignores invalid saved defaults while enforcing GitLab', () => {
    expect(
      restoreAvailableDefaultTaskProvider(
        ['gitlab'],
        {
          gitlabInstalled: false,
          linearConnected: true
        },
        'bitbucket'
      )
    ).toEqual(['gitlab'])
  })

  it('keeps GitLab visible when its CLI is unavailable', () => {
    expect(
      filterAvailableTaskProviders(['gitlab', 'linear'], {
        gitlabInstalled: false,
        linearConnected: false
      })
    ).toEqual(['gitlab'])
  })
})
