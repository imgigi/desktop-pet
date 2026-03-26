import { useRef, useEffect, useState, useCallback } from 'react'
import type { Bone } from '../core/types'
import { getDefaultBones } from '../core/skeleton'

interface Props {
  imageCanvas: HTMLCanvasElement
  initialBones: Bone[] | null
  onConfirm: (bones: Bone[]) => void
  onBack: () => void
}

export default function SkeletonEditor({ imageCanvas, initialBones, onConfirm, onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [bones, setBones] = useState<Bone[]>(() =>
    initialBones ? initialBones.map(b => ({ ...b, offset: { ...b.offset } })) : getDefaultBones()
  )
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const imgW = imageCanvas.width
  const imgH = imageCanvas.height
  const cx = imgW / 2
  const cy = imgH / 2

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = imgW
    canvas.height = imgH

    ctx.drawImage(imageCanvas, 0, 0)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.fillRect(0, 0, imgW, imgH)

    // 影响范围圆圈 - 提高透明度使其更明显
    for (const bone of bones) {
      if (!bone.enabled) continue
      const bx = cx + bone.offset.x
      const by = cy + bone.offset.y

      ctx.beginPath()
      ctx.arc(bx, by, bone.influence, 0, Math.PI * 2)
      ctx.fillStyle = dragging === bone.id ? 'rgba(244, 167, 185, 0.25)' : 'rgba(201, 184, 232, 0.22)'
      ctx.fill()
      ctx.strokeStyle = dragging === bone.id ? 'rgba(244, 167, 185, 0.6)' : 'rgba(201, 184, 232, 0.45)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])
    }

    // 骨骼点
    for (const bone of bones) {
      if (!bone.enabled) continue
      const bx = cx + bone.offset.x
      const by = cy + bone.offset.y
      const isActive = dragging === bone.id

      ctx.beginPath()
      ctx.arc(bx, by, isActive ? 14 : 10, 0, Math.PI * 2)
      ctx.fillStyle = isActive ? '#F4A7B9' : '#C9B8E8'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2.5
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(bx, by, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()

      const label = `${bone.emoji} ${bone.label}`
      ctx.font = '600 12px "ZCOOL KuaiLe", system-ui, sans-serif'
      ctx.textAlign = 'center'
      const labelW = ctx.measureText(label).width + 12
      const labelH = 20
      const labelX = bx - labelW / 2
      const labelY = by - 32

      const r = 4
      ctx.beginPath()
      ctx.moveTo(labelX + r, labelY)
      ctx.lineTo(labelX + labelW - r, labelY)
      ctx.quadraticCurveTo(labelX + labelW, labelY, labelX + labelW, labelY + r)
      ctx.lineTo(labelX + labelW, labelY + labelH - r)
      ctx.quadraticCurveTo(labelX + labelW, labelY + labelH, labelX + labelW - r, labelY + labelH)
      ctx.lineTo(labelX + r, labelY + labelH)
      ctx.quadraticCurveTo(labelX, labelY + labelH, labelX, labelY + labelH - r)
      ctx.lineTo(labelX, labelY + r)
      ctx.quadraticCurveTo(labelX, labelY, labelX + r, labelY)
      ctx.closePath()
      ctx.fillStyle = isActive ? 'rgba(244, 167, 185, 0.9)' : 'rgba(90, 78, 110, 0.8)'
      ctx.fill()

      ctx.fillStyle = '#fff'
      ctx.fillText(label, bx, labelY + 14)
    }
  }, [bones, imageCanvas, imgW, imgH, cx, cy, dragging])

  useEffect(() => { draw() }, [draw])

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const { x: mx, y: my } = getMousePos(e)
    let closest: Bone | null = null
    let minDist = 25

    for (const bone of bones) {
      if (!bone.enabled) continue
      const bx = cx + bone.offset.x
      const by = cy + bone.offset.y
      const dist = Math.hypot(bx - mx, by - my)
      if (dist < minDist) {
        minDist = dist
        closest = bone
      }
    }

    if (closest) {
      const bx = cx + closest.offset.x
      const by = cy + closest.offset.y
      setDragging(closest.id)
      setDragOffset({ x: mx - bx, y: my - by })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const { x: mx, y: my } = getMousePos(e)

    setBones(prev => prev.map(b => {
      if (b.id !== dragging) return b
      return {
        ...b,
        offset: {
          x: mx - dragOffset.x - cx,
          y: my - dragOffset.y - cy,
        },
      }
    }))
  }

  const handleMouseUp = () => setDragging(null)

  const toggleBone = (id: string) => {
    setBones(prev => prev.map(b =>
      b.id === id ? { ...b, enabled: !b.enabled } : b
    ))
  }

  const updateInfluence = (id: string, value: number) => {
    setBones(prev => prev.map(b =>
      b.id === id ? { ...b, influence: value } : b
    ))
  }

  return (
    <div className="setup-step skeleton-step">
      <div className="setup-title">调整骨骼</div>
      <div className="setup-desc">拖拽圆点到宠物对应位置，让TA动起来更自然</div>

      <div className="skeleton-editor-layout">
        <div className="skeleton-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="skeleton-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        <div className="bone-panel">
          <div className="bone-list">
            {bones.map(bone => (
              <div key={bone.id} className={`bone-item ${bone.enabled ? 'bone-enabled' : ''}`}>
                <label className="bone-toggle">
                  <input
                    type="checkbox"
                    checked={bone.enabled}
                    onChange={() => toggleBone(bone.id)}
                  />
                  <span className="bone-emoji">{bone.emoji}</span>
                  <span className="bone-name">{bone.label}</span>
                </label>
                {bone.enabled && (
                  <div className="bone-influence">
                    <input
                      type="range"
                      min={10}
                      max={120}
                      value={bone.influence}
                      onChange={e => updateInfluence(bone.id, Number(e.target.value))}
                      className="influence-slider"
                    />
                    <span className="influence-value">{bone.influence}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="skeleton-actions">
        <button className="back-link" onClick={onBack}>
          ← 返回修改形象
        </button>
        <button className="setup-btn primary" onClick={() => onConfirm(bones)}>
          下一步：预览效果 →
        </button>
      </div>
    </div>
  )
}
