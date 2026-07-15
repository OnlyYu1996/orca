// @vitest-environment happy-dom

import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { OrcaProfileSignOutConfirmDialog } from './OrcaProfileSignOutConfirmDialog'

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: ReactNode }) => <footer>{children}</footer>,
  DialogHeader: ({ children }: { children: ReactNode }) => <header>{children}</header>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h1>{children}</h1>
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children }: { children: ReactNode }) => <button>{children}</button>
}))

vi.mock('@/i18n/i18n', () => ({
  translate: (_key: string, fallback: string) => fallback
}))

describe('OrcaProfileSignOutConfirmDialog', () => {
  it('describes account sign-out without presenting a local profile or warning', () => {
    const html = renderToStaticMarkup(
      <OrcaProfileSignOutConfirmDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        signingOut={false}
      />
    )

    expect(html).toContain('退出赛博包工头？')
    expect(html).toContain('你将在此设备上退出赛博包工头，本地项目和工作树不会受到影响。')
    expect(html).not.toContain('Personal')
    expect(html).not.toContain('alert-triangle')
  })
})
