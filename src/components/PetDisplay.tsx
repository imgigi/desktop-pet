import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import type { Bone, AnimationState } from '../core/types'
import { animationPresets } from '../animations/presets'
import { evaluateAnimation, renderDeformedImage } from '../core/animator'

export interface BubbleItem {
  id: string
  text: string
  type: 'mine' | 'friend'
}

interface Props {
  imageCanvas: HTMLCanvasElement | null
  bones: Bone[]
  state: AnimationState
  myBubble: BubbleItem | null
  friendBubble: BubbleItem | null
  unreadCount: number
  onMenuDotClick: () => void
}

export default function PetDisplay({
  imageCanvas, bones, state,
  myBubble, friendBubble,
  unreadCount, onMenuDotClick,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const startRef = useRef(performance.now())

  const [visibleMine, setVisibleMine] = useState<BubbleItem | null>(null)
  const [visibleFriend, setVisibleFriend] = useState<BubbleItem | null>(null)

  const [canvasSize, setCanvasSize] = useState(() => Math.min(window.innerWidth * 0.6, 160))

  const enabledBones = useMemo(
    () => new Set(bones.filter(b => b.enabled).map(b => b.id)),
    [bones]
  )
  const clip = animationPresets[state] || animationPresets['idle']

  useEffect(() => {
    if (myBubble) {
      setVisibleMine(myBubble)
      const timer = setTimeout(() => setVisibleMine(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [myBubble])

  useEffect(() => {
    if (friendBubble) {
      setVisibleFriend(friendBubble)
      const timer = setTimeout(() => setVisibleFriend(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [friendBubble])

  useEffect(() => {
    const handleResize = () => setCanvasSize(Math.min(window.innerWidth * 0.6, 160))
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvasSize
    canvas.height = canvasSize
  }, [canvasSize])

  useEffect(() => {
    startRef.current = performance.now()
  }, [state])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageCanvas || !clip) return
    const ctx = canvas.getContext('2d')!

    const size = canvasSize
    ctx.clearRect(0, 0, size, size)

    const elapsed = performance.now() - startRef.current
    const transforms = evaluateAnimation(clip, elapsed, enabledBones)

    ctx.save()
    const scale = size / Math.max(imageCanvas.width, imageCanvas.height)
    const ox = (size - imageCanvas.width * scale) / 2
    const oy = (size - imageCanvas.height * scale) / 2
    ctx.translate(ox, oy)
    ctx.scale(scale, scale)
    renderDeformedImage(ctx, imageCanvas, bones, transforms, imageCanvas.width, imageCanvas.height)
    ctx.restore()

    animRef.current = requestAnimationFrame(render)
  }, [clip, enabledBones, bones, imageCanvas, canvasSize])

  useEffect(() => {
    animRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animRef.current)
  }, [render])

  const hasUnread = unreadCount > 0

  return (
    <div className="pet-display">
      {/* 气泡区域 */}
      <div className="bubbles-area">
        {visibleFriend && (
          <div className="bubble bubble-friend" key={visibleFriend.id}>
            <div className="bubble-text">{visibleFriend.text}</div>
          </div>
        )}
        {visibleMine && (
          <div className="bubble bubble-mine" key={visibleMine.id}>
            <div className="bubble-text">{visibleMine.text}</div>
          </div>
        )}
      </div>

      {/* 宠物形象 + 统一菜单圆点 */}
      <div className="pet-avatar-wrap">
        <canvas ref={canvasRef} className="pet-canvas" />

        {!imageCanvas && (
          <div className="pet-placeholder">
            <span>🐾</span>
          </div>
        )}

        {/* 统一菜单圆点 - 右上角（有宠物图片时才显示） */}
        {imageCanvas && (
          <div
            className={`menu-dot ${hasUnread ? 'menu-dot-unread' : ''}`}
            onClick={onMenuDotClick}
            title="设置"
          >
            {hasUnread && unreadCount > 0 && (
              <span className="menu-dot-count">{unreadCount}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
