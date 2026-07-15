import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import type { MarkupComposeResult } from './markup-screenshot-compose'

// 复用现有剪贴板截图链路，确保本地和 SSH 智能体都在资源所属主机生成临时文件。
export async function deliverMarkupToClipboard(result: MarkupComposeResult): Promise<void> {
  await window.api.ui.writeClipboardImage(result.dataUrl)
  const isMac = navigator.userAgent.includes('Mac')
  toast.success(
    translate(
      'auto.components.browser-pane.markup.copiedToast',
      '已复制标注，请粘贴到你的智能体（{{value0}}）',
      { value0: isMac ? '⌘V' : 'Ctrl+V' }
    )
  )
}
