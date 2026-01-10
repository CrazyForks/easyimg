/**
 * 复制文本到剪贴板
 * 兼容处理：优先使用 navigator.clipboard，如果不可用（非 HTTPS 等）则降级使用 document.execCommand
 * 移动端特殊处理：确保在用户交互上下文中执行
 * @param text 需要复制的文本
 * @returns Promise<void> 成功时 resolve，失败时 reject
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!text) {
    throw new Error('复制内容为空')
  }

  // 1. 尝试使用现代 API (navigator.clipboard)
  // 注意：navigator.clipboard 在非 HTTPS 环境下可能未定义
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, trying fallback', err)
      // 继续尝试降级方案
    }
  }

  // 2. 降级方案：使用 document.execCommand
  // 移动端需要特殊处理：创建一个可见的输入框并选中内容
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  try {
    // 使用 input 元素在 iOS 上更可靠
    const element = isIOS ? document.createElement('input') : document.createElement('textarea')

    if (element instanceof HTMLTextAreaElement) {
      element.value = text
    } else {
      element.value = text
    }

    // 设置样式使其不可见但仍可选中
    element.style.position = 'fixed'
    element.style.left = '0'
    element.style.top = '0'
    element.style.width = '2em'
    element.style.height = '2em'
    element.style.padding = '0'
    element.style.border = 'none'
    element.style.outline = 'none'
    element.style.boxShadow = 'none'
    element.style.background = 'transparent'
    element.style.fontSize = '16px' // 防止 iOS 缩放
    element.setAttribute('readonly', '')

    document.body.appendChild(element)

    if (isIOS) {
      // iOS 特殊处理
      const range = document.createRange()
      range.selectNodeContents(element)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
      // iOS 需要设置 setSelectionRange
      element.setSelectionRange(0, text.length)
    } else {
      element.focus()
      element.select()
    }

    const successful = document.execCommand('copy')

    document.body.removeChild(element)

    // 清除选择
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
    }

    if (!successful) {
      throw new Error('execCommand copy 失败')
    }
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err)
    throw new Error('复制失败，请手动复制')
  }
}
