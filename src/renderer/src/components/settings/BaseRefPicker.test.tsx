// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BaseRefPicker } from './BaseRefPicker'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'

vi.mock('@/store', () => ({
  useAppStore: (selector: (state: never) => unknown) => selector({} as never)
}))

vi.mock('@/lib/repo-runtime-owner', () => ({
  getRuntimeEnvironmentIdForRepo: () => null
}))

vi.mock('@/runtime/runtime-repo-client', () => ({
  getRuntimeRepoBaseRefDefault: () => new Promise(() => undefined),
  searchRuntimeRepoBaseRefs: () => Promise.resolve([])
}))

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  document.body.innerHTML = ''
})

describe('BaseRefPicker', () => {
  it('在单一主输入弹窗打开时聚焦分支搜索框', () => {
    act(() => {
      root.render(
        <Dialog open onOpenChange={vi.fn()}>
          <DialogContent>
            <DialogTitle>Change Base Ref</DialogTitle>
            <DialogDescription>Pick the branch compare target.</DialogDescription>
            <BaseRefPicker
              repoId="repo-1"
              currentBaseRef="origin/main"
              autoFocus
              onSelect={vi.fn()}
              onUsePrimary={vi.fn()}
            />
          </DialogContent>
        </Dialog>
      )
    })

    const input = document.body.querySelector('[data-slot="input"]')
    expect(input).toBeInstanceOf(HTMLInputElement)
    expect(document.activeElement).toBe(input)
  })
})
