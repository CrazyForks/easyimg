/**
 * 复制文本到剪贴板
 * 兼容处理：优先使用 navigator.clipboard，如果不可用（非 HTTPS 等）则降级使用 document.execCommand
 * @param text 需要复制的文本
 * @returns Promise<boolean> 是否复制成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false

  // 1. 尝试使用现代 API (navigator.clipboard)
  // 注意：navigator.clipboard 在非 HTTPS 环境下可能未定义
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, trying fallback', err)

    }
  }

  // 2. 降级方案：使用 document.execCommand
  try {
    const textArea = document.createElement('textarea')
    
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '0'
    textArea.style.opacity = '0'
    textArea.setAttribute('readonly', '')
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    const successful = document.execCommand('copy')
    
    document.body.removeChild(textArea)
    
    return successful
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err)
    return false
  }
}
