import React, { useRef, useState } from 'react'
import { ExternalLink, Github } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { translate } from '@/i18n/i18n'
import { PRODUCT_ISSUES_URL, PRODUCT_NEW_ISSUE_URL } from '../../../../shared/product-links'

type SidebarFeedbackDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function buildFeedbackIssueUrl(feedback: string): string {
  const url = new URL(PRODUCT_NEW_ISSUE_URL)
  url.searchParams.set(
    'title',
    translate('auto.components.sidebar.SidebarFeedbackDialog.9b33530b3d', 'User feedback')
  )
  url.searchParams.set(
    'body',
    [
      `## ${translate('auto.components.sidebar.SidebarFeedbackDialog.c9e5ea0791', 'Feedback')}`,
      '',
      feedback,
      '',
      '---',
      translate(
        'auto.components.sidebar.SidebarFeedbackDialog.8de03e23c5',
        'Submitted from the Cyber Foreman app.'
      )
    ].join('\n')
  )
  return url.toString()
}

export function SidebarFeedbackDialog({
  open,
  onOpenChange
}: SidebarFeedbackDialogProps): React.JSX.Element {
  const [feedback, setFeedback] = useState('')
  const [isOpening, setIsOpening] = useState(false)
  const feedbackTextareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (): Promise<void> => {
    const trimmed = feedback.trim()
    if (!trimmed) {
      toast.warning(
        translate(
          'auto.components.sidebar.SidebarFeedbackDialog.a2fd890d9e',
          'Enter feedback before continuing.'
        )
      )
      return
    }

    setIsOpening(true)
    try {
      // 反馈由用户在 GitHub 页面确认后提交，应用不再向 Orca 官方服务上传内容。
      await window.api.shell.openUrl(buildFeedbackIssueUrl(trimmed))
      toast.success(
        translate(
          'auto.components.sidebar.SidebarFeedbackDialog.7a46c228b8',
          'Opened the repository issue page in your browser.'
        )
      )
      setFeedback('')
      onOpenChange(false)
    } catch (error) {
      toast.error(
        translate(
          'auto.components.sidebar.SidebarFeedbackDialog.60b721e857',
          'Unable to open the GitHub issue page.'
        )
      )
      console.error('打开反馈问题页面失败:', error)
    } finally {
      setIsOpening(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          feedbackTextareaRef.current?.focus()
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-sm">
            {translate('auto.components.sidebar.SidebarFeedbackDialog.0eb643f07f', 'Send feedback')}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {translate(
              'auto.components.sidebar.SidebarFeedbackDialog.a828fa4aee',
              "Share what's working, what's broken, or what Cyber Foreman should improve next."
            )}
          </DialogDescription>
        </DialogHeader>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-fit text-xs"
          onClick={() => void window.api.shell.openUrl(PRODUCT_ISSUES_URL)}
        >
          <Github className="size-3.5" />
          {translate(
            'auto.components.sidebar.SidebarFeedbackDialog.d245c4ef6c',
            'View repository issues'
          )}
          <ExternalLink className="size-3.5" />
        </Button>

        <textarea
          ref={feedbackTextareaRef}
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder={translate(
            'auto.components.sidebar.SidebarFeedbackDialog.d46ddd66fc',
            'Describe what should be improved'
          )}
          rows={7}
          className="min-h-32 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />

        <p className="text-xs text-muted-foreground">
          {translate(
            'auto.components.sidebar.SidebarFeedbackDialog.5b120b9634',
            'Continuing opens GitHub. Nothing is submitted until you confirm it there.'
          )}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isOpening}>
            {translate('auto.components.sidebar.SidebarFeedbackDialog.8bf619e4cf', 'Cancel')}
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isOpening || !feedback.trim()}>
            {isOpening
              ? translate('auto.components.sidebar.SidebarFeedbackDialog.69969ba364', 'Opening…')
              : translate(
                  'auto.components.sidebar.SidebarFeedbackDialog.f2e42e1307',
                  'Open GitHub issue'
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
