import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import type { Bone, AnimationState } from '../core/types'
import { animationPresets } from '../animations/presets'
import { evaluateAnimation, renderDeformedImage } from '../core/animator'

interface Props {
  imageCanvas: HTMLCanvasElement
  bones: Bone[]
}

const ANIMATION_STATES: { state: AnimationState; label: string; emoji: string }[] = [
  { state: 'idle',   label: '休闲', emoji: '✦' },
  { state: 'dance',  label: '跳舞', emoji: '♪' },
  { state: 'wave',   label: '招手', emoji: '✿' },
  { state: 'bounce', label: '弹跳', emoji: '❤' },
  { state: 'faint',  label: '晕倒', emoji: '💫' },
]

const CANVAS_SIZE = 200

export default function AnimationPreview({ imageCanvas, bones }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const startRef = useRef(performance.now())

  const [currentState, setCurrentState] = useState<AnimationState>('idle')

  const enabledBones = useMemo(
    () => new Set(bones.filter(b => b.enabled).map(b => b.id)),
    [bones]
  )

  const clip = animationPresets[currentState] || animationPresets['idle']

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = CANVAS_SIZE
    canvas.height = CANVAS_SIZE
  }, [])

  useEffect(() => {
    startRef.current = performance.now()
  }, [currentState])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageCanvas || !clip) return
    const ctx = canvas.getContext('2d')!

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    const elapsed = performance.now() - startRef.current
    const transforms = evaluateAnimation(clip, elapsed, enabledBones)

    ctx.save()
    const scale = CANVAS_SIZE / Math.max(imageCanvas.width, imageCanvas.height)
    const ox = (CANVAS_SIZE - imageCanvas.width * scale) / 2
    const oy = (CANVAS_SIZE - imageCanvas.height * scale) / 2
    ctx.translate(ox, oy)
    ctx.scale(scale, scale)
    renderDeformedImage(ctx, imageCanvas, bones, transforms, imageCanvas.width, imageCanvas.height)
    ctx.restore()

    animRef.current = requestAnimationFrame(render)
  }, [clip, enabledBones, bones, imageCanvas])

  useEffect(() => {
    animRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animRef.current)
  }, [render])

  // 晕倒状态下 canvas 旋转
  const isFaint = currentState === 'faint'

  return (
    <div className="animation-preview">
      <canvas
        ref={canvasRef}
        className={`animation-preview-canvas ${isFaint ? 'faint-rotate' : ''}`}
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
      />
      <div className="animation-state-buttons">
        {ANIMATION_STATES.map(({ state, label, emoji }) => (
          <button
            key={state}
            className={`animation-state-btn${currentState === state ? ' active' : ''}`}
            onClick={() => setCurrentState(state)}
          >
            <span className="animation-state-emoji">{emoji}</span>
            <span className="animation-state-label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
