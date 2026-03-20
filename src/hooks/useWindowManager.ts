import { useCallback } from 'react'

async function getTauriWindow() {
  if (!('__TAURI__' in window)) return null
  const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
  const { LogicalSize, LogicalPosition } = await import('@tauri-apps/api/dpi')
  return { win: getCurrentWebviewWindow(), LogicalSize, LogicalPosition }
}

export function useWindowManager() {
  // 获取当前窗口逻辑坐标
  const getLogicalRect = async (tauri: NonNullable<Awaited<ReturnType<typeof getTauriWindow>>>) => {
    const scale = await tauri.win.scaleFactor()
    const pos = await tauri.win.outerPosition()
    const size = await tauri.win.outerSize()
    return {
      x: pos.x / scale,
      y: pos.y / scale,
      w: size.width / scale,
      h: size.height / scale,
    }
  }

  const switchToFloat = useCallback(async () => {
    const tauri = await getTauriWindow()
    if (!tauri) return
    const rect = await getLogicalRect(tauri)

    const newW = 280, newH = 400
    // 保持底边不动
    const newY = rect.y + rect.h - newH
    const newX = rect.x + (rect.w - newW) / 2

    await tauri.win.setAlwaysOnTop(true)
    await tauri.win.setSize(new tauri.LogicalSize(newW, newH))
    await tauri.win.setPosition(new tauri.LogicalPosition(Math.max(0, newX), Math.max(0, newY)))
  }, [])

  const switchToPanel = useCallback(async () => {
    const tauri = await getTauriWindow()
    if (!tauri) return
    const rect = await getLogicalRect(tauri)

    const newW = 400, newH = 560
    // 保持底边不动
    const newY = rect.y + rect.h - newH
    const newX = rect.x + (rect.w - newW) / 2

    await tauri.win.setAlwaysOnTop(false)
    await tauri.win.setSize(new tauri.LogicalSize(newW, newH))
    await tauri.win.setPosition(new tauri.LogicalPosition(Math.max(0, newX), Math.max(0, newY)))
  }, [])

  const initPanel = useCallback(async () => {
    const tauri = await getTauriWindow()
    if (!tauri) return
    await tauri.win.setAlwaysOnTop(false)
    await tauri.win.setSize(new tauri.LogicalSize(400, 560))
    await tauri.win.center()
  }, [])

  const startDragging = useCallback(async () => {
    if (!('__TAURI__' in window)) return
    const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
    getCurrentWebviewWindow().startDragging()
  }, [])

  return { switchToFloat, switchToPanel, initPanel, startDragging }
}
