import { describe, expect, it } from 'vitest'
import { mobileConnectionPathLabel } from './mobile-connection-path-label'

describe('mobile connection path label', () => {
  it('distinguishes LAN, Tailscale, and the relay without exposing transport errors', () => {
    expect(mobileConnectionPathLabel('lan', 'en')).toBe('Direct · LAN')
    expect(mobileConnectionPathLabel('tailscale', 'zh-CN')).toBe('直连 · Tailscale')
    expect(mobileConnectionPathLabel('relay', 'zh-CN')).toBe('赛博包工头 Relay')
  })
})
