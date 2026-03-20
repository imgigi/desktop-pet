import { useState, useRef, useEffect, useCallback } from 'react'
import SkeletonEditor from './SkeletonEditor'
import AnimationPreview from './AnimationPreview'
import type { Bone, PetData } from '../core/types'

const RATIOS = [
  { label: '4:3', w: 4, h: 3 },
  { label: '1:1', w: 1, h: 1 },
  { label: '3:4', w: 3, h: 4 },
]

interface Props {
  onPetCreated: (pet: PetData) => void
  existingCount: number
}

export default function CreatePetFlow({ onPetCreated, existingCount }: Props) {
  const [step, setStep] = useState<'upload' | 'skeleton' | 'preview'>('upload')
  const [imageCanvas, setImageCanvas] = useState<HTMLCanvasElement | null>(null)
  const [bones, setBones] = useState<Bone[] | null>(null)
  const [name, setName] = useState(`宠物${existingCount + 1}`)
  const [ratioIdx, setRatioIdx] = useState(0)
  const [rawImage, setRawImage] = useState<HTMLImageElement | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // 图片变换状态：缩放、偏移
  const [imgScale, setImgScale] = useState(1)
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 })
  const draggingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const frameRef = useRef<HTMLDivElement>(null)

  const ratio = RATIOS[ratioIdx]

  // 画框像素尺寸（内部画布用 256 基准）
  const maxSize = 256
  const frameW = ratio.w >= ratio.h ? maxSize : Math.round(maxSize * ratio.w / ratio.h)
  const frameH = ratio.w >= ratio.h ? Math.round(maxSize * ratio.h / ratio.w) : maxSize

  // 显示尺寸
  const displayW = 180
  const displayH = Math.round(displayW * ratio.h / ratio.w)

  // 根据当前变换状态生成最终 canvas
  const generateCanvas = useCallback((img: HTMLImageElement, scale: number, offset: { x: number, y: number }, fw: number, fh: number) => {
    // 基础 contain 缩放
    const baseScale = Math.min(fw / img.naturalWidth, fh / img.naturalHeight)
    const totalScale = baseScale * scale
    const drawW = img.naturalWidth * totalScale
    const drawH = img.naturalHeight * totalScale

    const canvas = document.createElement('canvas')
    canvas.width = fw
    canvas.height = fh
    const ctx = canvas.getContext('2d')!
    // 居中 + 用户偏移（偏移量映射到画布坐标）
    const displayToCanvas = fw / displayW
    const cx = (fw - drawW) / 2 + offset.x * displayToCanvas
    const cy = (fh - drawH) / 2 + offset.y * displayToCanvas
    ctx.drawImage(img, cx, cy, drawW, drawH)
    return canvas
  }, [displayW])

  // 重新生成预览
  const updatePreview = useCallback((img: HTMLImageElement, scale: number, offset: { x: number, y: number }, fw: number, fh: number) => {
    const canvas = generateCanvas(img, scale, offset, fw, fh)
    setImageCanvas(canvas)
  }, [generateCanvas])

  // 切换比例时重置变换
  useEffect(() => {
    if (rawImage && step === 'upload') {
      setImgScale(1)
      setImgOffset({ x: 0, y: 0 })
      const fw = ratio.w >= ratio.h ? maxSize : Math.round(maxSize * ratio.w / ratio.h)
      const fh = ratio.w >= ratio.h ? Math.round(maxSize * ratio.h / ratio.w) : maxSize
      updatePreview(rawImage, 1, { x: 0, y: 0 }, fw, fh)
    }
  }, [ratioIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  // scale/offset 变化时更新（仅在上传步骤）
  useEffect(() => {
    if (rawImage && step === 'upload') {
      updatePreview(rawImage, imgScale, imgOffset, frameW, frameH)
    }
  }, [imgScale, imgOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  // 步骤守卫：骨骼/预览步骤需要 imageCanvas，丢失则回退
  useEffect(() => {
    if ((step === 'skeleton' || step === 'preview') && !imageCanvas) {
      setStep('upload')
    }
  }, [step, imageCanvas])

  const loadFile = (file: File) => {
    // 转为 data URL 避免 blob URL 被回收
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

  const handlePaste = (e: React.ClipboardEvent) => {
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

  // 滚轮缩放
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
      id: crypto.randomUUID(),
      name: name.trim() || `宠物${existingCount + 1}`,
      image_data: imageCanvas.toDataURL('image/png'),
      bones,
      created_at: Date.now(),
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

  // 预览画布 CSS 变换（用于实时显示，不用每次重绘 canvas）
  const previewTransform = rawImage ? (() => {
    const baseScale = Math.min(displayW / rawImage.naturalWidth, displayH / rawImage.naturalHeight)
    const drawW = rawImage.naturalWidth * baseScale * imgScale
    const drawH = rawImage.naturalHeight * baseScale * imgScale
    const cx = (displayW - drawW) / 2 + imgOffset.x
    const cy = (displayH - drawH) / 2 + imgOffset.y
    return { left: cx, top: cy, width: drawW, height: drawH }
  })() : null

  return (
    <div className="create-pet-flow" onPaste={handlePaste}>
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
          <div className="setup-title">创建你的形象</div>
          <div className="setup-desc">上传一张图片作为你在朋友屏幕上的宠物形象</div>

          {/* 抠图推荐 */}
          <div className="cutout-buttons">
            <span className="cutout-label">💡 建议先抠图去背景</span>
            <div className="cutout-btn-row">
              <button className="cutout-btn" onClick={() => openUrl('https://www.remove.bg/zh')}>
                remove.bg
              </button>
              <button className="cutout-btn" onClick={() => openUrl('https://pixian.ai/')}>
                pixian.ai
              </button>
            </div>
          </div>

          <div className="create-pet-name-row">
            <label>名字：</label>
            <input
              className="create-pet-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={10}
              placeholder="给宠物起个名字"
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

          {/* 上传 + 编辑区域 */}
          <div
            ref={frameRef}
            className={`avatar-upload-frame ${rawImage ? 'has-image' : ''}`}
            style={{ width: displayW, height: displayH }}
            onClick={() => { if (!rawImage) fileRef.current?.click() }}
            onMouseDown={rawImage ? handleMouseDown : undefined}
            onWheel={rawImage ? handleWheel : undefined}
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
                <span>点击上传 / Ctrl+V 粘贴</span>
              </div>
            )}
          </div>

          {rawImage && (
            <div className="avatar-edit-hint">滚轮缩放 · 拖拽移动 · 点击画框重新上传</div>
          )}

          {rawImage && (
            <div className="avatar-edit-actions">
              <button className="setup-btn avatar-reupload-btn" onClick={() => fileRef.current?.click()}>
                重新上传
              </button>
              <button className="setup-btn" onClick={() => setStep('skeleton')}>
                下一步：调整骨骼 →
              </button>
            </div>
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
          <div className="setup-title">预览动画效果</div>
          <div className="setup-desc">确认你的宠物看起来正确</div>

          <AnimationPreview imageCanvas={imageCanvas} bones={bones} />

          <button className="setup-btn primary" onClick={handleConfirm}>
            保存到宠物栏
          </button>

          <button className="back-link" onClick={() => setStep('skeleton')}>
            ← 返回修改骨骼
          </button>
        </div>
      )}
    </div>
  )
}
