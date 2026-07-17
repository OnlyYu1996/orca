import { describe, expect, it } from 'vitest'
import { nativeChatSessionOptionDisabledReason } from './native-chat-session-option-labels'

describe('nativeChatSessionOptionDisabledReason', () => {
  it('returns no message when the option is enabled', () => {
    expect(nativeChatSessionOptionDisabledReason(undefined)).toBeNull()
  })

  it('returns a message for every disabled reason', () => {
    expect(nativeChatSessionOptionDisabledReason('set-when-session-starts')).not.toBeNull()
    expect(nativeChatSessionOptionDisabledReason('available-after-session-start')).not.toBeNull()
  })
})
