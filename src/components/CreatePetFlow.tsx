import { useState, useRef, useEffect, useCallback } from 'react'
import SkeletonEditor from './SkeletonEditor'
import AnimationPreview from './AnimationPreview'
import type { Bone, PetData } from '../core/types'
import type { AppConfig } from '../lib/config'

const RATIOS = [
  { label: '4:3', w: 4, h: 3 },
  { label: '1:1', w: 1, h: 1 },
  { label: '3:4', w: 3, h: 4 },
]

interface Props {
  onPetCreated: (pet: PetData) => void
  existingCount: number
  editingPet?: PetData
  appConfig?: AppConfig
  onCancel?: () => void
}

export default function CreatePetFlow({ onPetCreated, existingCount, editingPet, appConfig, onCancel }: Props) {
  const [step, setStep] = useState<'upload' | 'skeleton' | 'preview'>('upload')
  const [imageCanvas, setImageCanvas] = useState<HTMLCanvasElement | null>(null)
  const [bones, setBones] = useState<Bone[] | null>(editingPet?.bones || null)
  const [name, setName] = useState(editingPet?.name || `宠物${existingCount + 1}`)
  const [ratioIdx, setRatioIdx] = useState(0)
  const [rawImage, setRawImage] = useState<HTMLImageElement | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // 图片变换状态
  const [imgScale, setImgScale] = useState(1)
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 })
  const draggingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })

  const ratio = RATIOS[ratioIdx]
  const maxSize = 256
  const frameW = ratio.w >= ratio.h ? maxSize : Math.round(maxSize * ratio.w / ratio.h)
  const frameH = ratio.w >= ratio.h ? Math.round(maxSize * ratio.h / ratio.w) : maxSize
  const displayW = 180
  const displayH = Math.round(displayW * ratio.h / ratio.w)

  const cutoutUrl = appConfig?.cutout_url || 'https://www.remove.bg/zh'

  const generateCanvas = useCallback((img: HTMLImageElement, scale: number, offset: { x: number, y: number }, fw: number, fh: number) => {
    const baseScale = Math.min(fw / img.naturalWidth, fh / img.naturalHeight)
    const totalScale = baseScale * scale
    const drawW = img.naturalWidth * totalScale
    const drawH = img.naturalHeight * totalScale
    const canvas = document.createElement('canvas')
    canvas.width = fw
    canvas.height = fh
    const ctx = canvas.getContext('2d')!
    const displayToCanvas = fw / displayW
    const cx = (fw - drawW) / 2 + offset.x * displayToCanvas
    const cy = (fh - drawH) / 2 + offset.y * displayToCanvas
    ctx.drawImage(img, cx, cy, drawW, drawH)
    return canvas
  }, [displayW])

  const updatePreview = useCallback((img: HTMLImageElement, scale: number, offset: { x: number, y: number }, fw: number, fh: number) => {
    const canvas = generateCanvas(img, scale, offset, fw, fh)
    setImageCanvas(canvas)
  }, [generateCanvas])

  // 编辑模式：加载已有图片
  useEffect(() => {
    if (editingPet && !rawImage) {
      const img = new Image()
      img.onload = () => {
        setRawImage(img)
        updatePreview(img, 1, { x: 0, y: 0 }, frameW, frameH)
      }
      img.src = editingPet.image_data
    }
  }, [editingPet]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (rawImage && step === 'upload') {
      setImgScale(1)
      setImgOffset({ x: 0, y: 0 })
      const fw = ratio.w >= ratio.h ? maxSize : Math.round(maxSize * ratio.w / ratio.h)
      const fh = ratio.w >= ratio.h ? Math.round(maxSize * ratio.h / ratio.w) : maxSize
      updatePreview(rawImage, 1, { x: 0, y: 0 }, fw, fh)
    }
  }, [ratioIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (rawImage && step === 'upload') {
      updatePreview(rawImage, imgScale, imgOffset, frameW, frameH)
    }
  }, [imgScale, imgOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if ((step === 'skeleton' || step === 'preview') && !imageCanvas) {
      setStep('upload')
    }
  }, [step, imageCanvas])

  const loadFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        setRawImage(img)
        setImgScale(1)
        setImgOffset({ x: 0, y: 0 })
        updatePreview(img, 1, { x: 0, y: 0 }, frameW, frameH)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  // 全局粘贴监听（修复粘贴无效的问题）
  useEffect(() => {
    if (step !== 'upload') return
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) loadFile(file)
          return
        }
      }
    }
    window.addEventListener('paste', handleGlobalPaste)
    return () => window.removeEventListener('paste', handleGlobalPaste)
  }, [step, frameW, frameH]) // eslint-disable-line react-hooks/exhaustive-deps

  // 拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      loadFile(file)
    }
  }

  // 鼠标拖拽移动图片
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!rawImage) return
    e.preventDefault()
    e.stopPropagation()
    draggingRef.current = true
    lastPosRef.current = { x: e.clientX, y: e.clientY }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return
      const dx = e.clientX - lastPosRef.current.x
      const dy = e.clientY - lastPosRef.current.y
      lastPosRef.current = { x: e.clientX, y: e.clientY }
      setImgOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }))
    }
    const handleMouseUp = () => { draggingRef.current = false }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleWheel = (e: React.WheelEvent) => {
    if (!rawImage) return
    e.preventDefault()
    e.stopPropagation()
    setImgScale(prev => {
      const delta = e.deltaY > 0 ? 0.95 : 1.05
      return Math.max(0.2, Math.min(5, prev * delta))
    })
  }

  const handleSkeletonConfirm = (confirmedBones: Bone[]) => {
    setBones(confirmedBones)
    setStep('preview')
  }

  const handleConfirm = () => {
    if (!imageCanvas || !bones) return
    const pet: PetData = {
      id: editingPet?.id || crypto.randomUUID(),
      name: name.trim() || `宠物${existingCount + 1}`,
      image_data: imageCanvas.toDataURL('image/png'),
      bones,
      created_at: editingPet?.created_at || Date.now(),
      friend: editingPet?.friend,
    }
    onPetCreated(pet)
  }

  const openUrl = async (url: string) => {
    try {
      const { open } = await import('@tauri-apps/plugin-shell')
      await open(url)
    } catch {
      window.open(url, '_blank')
    }
  }

  const previewTransform = rawImage ? (() => {
    const baseScale = Math.min(displayW / rawImage.naturalWidth, displayH / rawImage.naturalHeight)
    const drawW = rawImage.naturalWidth * baseScale * imgScale
    const drawH = rawImage.naturalHeight * baseScale * imgScale
    const cx = (displayW - drawW) / 2 + imgOffset.x
    const cy = (displayH - drawH) / 2 + imgOffset.y
    return { left: cx, top: cy, width: drawW, height: drawH }
  })() : null

  return (
    <div className="create-pet-flow">
      {/* 步骤指示器 */}
      <div className="setup-steps-indicator">
        <span className={`setup-step-badge ${step === 'upload' ? 'active' : imageCanvas ? 'done' : ''}`}>
          ① 形象
        </span>
        <span className="setup-step-arrow">→</span>
        <span className={`setup-step-badge ${step === 'skeleton' ? 'active' : bones ? 'done' : ''}`}>
          ② 骨骼
        </span>
        <span className="setup-step-arrow">→</span>
        <span className={`setup-step-badge ${step === 'preview' ? 'active' : ''}`}>
          ③ 预览
        </span>
      </div>

      {step === 'upload' && (
        <div className="setup-step">
          <div className="setup-title">{editingPet ? '修改宠物形象' : '打造你的专属桌宠'}</div>
          <div className="setup-desc">
            {editingPet ? '重新调整图片，让TA更可爱' : '选一张朋友的照片，把TA变成你桌面上的小伙伴'}
          </div>

          <div className="create-pet-name-row">
            <label>昵称：</label>
            <input
              className="create-pet-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={10}
              placeholder="给TA起个好玩的名字"
            />
          </div>

          {/* 比例选择器 */}
          <div className="ratio-picker">
            <span className="ratio-label">画框比例：</span>
            {RATIOS.map((r, i) => (
              <button
                key={r.label}
                className={`ratio-btn ${i === ratioIdx ? 'active' : ''}`}
                onClick={() => setRatioIdx(i)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* 上传 + 编辑区域（支持拖拽） */}
          <div
            className={`avatar-upload-frame ${rawImage ? 'has-image' : ''} ${isDragOver ? 'drag-over' : ''}`}
            style={{ width: displayW, height: displayH }}
            onClick={() => { if (!rawImage) fileRef.current?.click() }}
            onMouseDown={rawImage ? handleMouseDown : undefined}
            onWheel={rawImage ? handleWheel : undefined}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
            {rawImage && previewTransform ? (
              <img
                src={rawImage.src}
                alt="avatar"
                className="avatar-img-transform"
                style={{
                  position: 'absolute',
                  left: previewTransform.left,
                  top: previewTransform.top,
                  width: previewTransform.width,
                  height: previewTransform.height,
                }}
                draggable={false}
              />
            ) : (
              <div className="avatar-placeholder">
                <span>🖼</span>
                <span>{isDragOver ? '松手放下图片~' : '点击上传 / 粘贴 / 拖拽图片到这里'}</span>
              </div>
            )}
          </div>

          {rawImage && (
            <div className="avatar-edit-hint">滚轮缩放 · 拖拽移动 · 怎么好看怎么调</div>
          )}

          {/* 抠图按钮 */}
          <button className="cutout-fixed-btn" onClick={() => openUrl(cutoutUrl)}>
            ✂️ 点击去抠图，让你的宠物更好看
          </button>

          {rawImage && (
            <div className="avatar-edit-actions">
              <button className="setup-btn avatar-reupload-btn" onClick={() => fileRef.current?.click()}>
                换一张
              </button>
              <button className="setup-btn primary" onClick={() => setStep('skeleton')}>
                下一步：调骨骼 →
              </button>
            </div>
          )}

          {onCancel && (
            <button className="back-link" onClick={onCancel}>
              ← 取消
            </button>
          )}
        </div>
      )}

      {step === 'skeleton' && imageCanvas && (
        <SkeletonEditor
          imageCanvas={imageCanvas}
          initialBones={bones}
          onConfirm={handleSkeletonConfirm}
          onBack={() => setStep('upload')}
        />
      )}

      {step === 'preview' && imageCanvas && bones && (
        <div className="setup-step">
          <div className="setup-title">看看效果</div>
          <div className="setup-desc">试试各种动作，满意就保存吧</div>

          <AnimationPreview imageCanvas={imageCanvas} bones={bones} />

          <button className="setup-btn primary" onClick={handleConfirm}>
            {editingPet ? '保存修改' : '完成，加入宠物栏！'}
          </button>

          <button className="back-link" onClick={() => setStep('skeleton')}>
            ← 返回调整骨骼
          </button>
        </div>
      )}
    </div>
  )
}
