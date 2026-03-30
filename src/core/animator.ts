import type { AnimationClip, Bone, Keyframe } from './types'

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

function interpolateKeyframes(
  keyframes: Keyframe[],
  time: number,
  prop: keyof Keyframe
): number | undefined {
  if (keyframes.length === 0) return undefined

  let prev = keyframes[0]
  let next = keyframes[keyframes.length - 1]

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (time >= keyframes[i].t && time <= keyframes[i + 1].t) {
      prev = keyframes[i]
      next = keyframes[i + 1]
      break
    }
  }

  const prevVal = prev[prop] as number | undefined
  const nextVal = next[prop] as number | undefined

  if (prevVal === undefined && nextVal === undefined) return undefined
  if (prevVal === undefined) return nextVal
  if (nextVal === undefined) return prevVal
  if (prev.t === next.t) return prevVal

  const progress = (time - prev.t) / (next.t - prev.t)
  return lerp(prevVal, nextVal, smoothstep(progress))
}

export interface BoneTransform {
  rotation: number
  offsetX: number
  offsetY: number
  scaleX: number
  scaleY: number
}

export function evaluateAnimation(
  clip: AnimationClip,
  time: number,
  enabledBones: Set<string>
): Map<string, BoneTransform> {
  const loopedTime = clip.loop ? time % clip.duration : Math.min(time, clip.duration)
  const result = new Map<string, BoneTransform>()

  for (const track of clip.tracks) {
    if (!enabledBones.has(track.boneId)) continue

    const transform: BoneTransform = {
      rotation: interpolateKeyframes(track.keyframes, loopedTime, 'rotation') ?? 0,
      offsetX: interpolateKeyframes(track.keyframes, loopedTime, 'offsetX') ?? 0,
      offsetY: interpolateKeyframes(track.keyframes, loopedTime, 'offsetY') ?? 0,
      scaleX: interpolateKeyframes(track.keyframes, loopedTime, 'scaleX') ?? 1,
      scaleY: interpolateKeyframes(track.keyframes, loopedTime, 'scaleY') ?? 1,
    }

    result.set(track.boneId, transform)
  }

  return result
}

// Compute displacement for a point based on bone transforms
function computeDisplacement(
  px: number,
  py: number,
  cx: number,
  cy: number,
  enabledBones: Bone[],
  transforms: Map<string, BoneTransform>
): { dx: number; dy: number } {
  let totalDx = 0
  let totalDy = 0
  let totalWeight = 0

  for (const bone of enabledBones) {
    const boneX = cx + bone.offset.x
    const boneY = cy + bone.offset.y
    const dist = Math.hypot(px - boneX, py - boneY)
    const influence = bone.influence

    if (dist > influence * 2.5) continue

    // Smooth falloff using smootherstep (quintic) — very smooth, no hard edges
    const normalized = Math.min(dist / (influence * 2.5), 1)
    const x = 1 - normalized
    const weight = x * x * x * (x * (x * 6 - 15) + 10) // smootherstep(1-t)

    const bt = transforms.get(bone.id)
    if (!bt || weight === 0) continue

    // Rotation contribution: rotate pixel around bone pivot
    const rotRad = bt.rotation * Math.PI / 180
    const relX = px - boneX
    const relY = py - boneY
    const cosR = Math.cos(rotRad)
    const sinR = Math.sin(rotRad)
    const rotDx = relX * cosR - relY * sinR - relX
    const rotDy = relX * sinR + relY * cosR - relY

    totalDx += (bt.offsetX + rotDx) * weight
    totalDy += (bt.offsetY + rotDy) * weight
    totalWeight += weight
  }

  if (totalWeight > 0) {
    totalDx /= totalWeight
    totalDy /= totalWeight
  }

  return { dx: totalDx, dy: totalDy }
}

// Render whole image with triangle mesh deformation driven by bone transforms
// Triangle mesh uses shared vertices — adjacent triangles share edge vertices,
// so there can never be gaps or tears between cells.
export function renderDeformedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  bones: Bone[],
  transforms: Map<string, BoneTransform>,
  width: number,
  height: number
) {
  const cx = width / 2
  const cy = height / 2

  const gridSize = 20
  const cols = Math.ceil(width / gridSize)
  const rows = Math.ceil(height / gridSize)

  const enabledBones = bones.filter(b => b.enabled)

  // Pre-compute deformed vertex positions for the entire grid
  // Vertices are shared between adjacent cells — this is what prevents tearing
  const vertexCount = (cols + 1) * (rows + 1)
  const deformedX = new Float32Array(vertexCount)
  const deformedY = new Float32Array(vertexCount)

  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const px = Math.min(c * gridSize, width)
      const py = Math.min(r * gridSize, height)
      const idx = r * (cols + 1) + c

      const { dx, dy } = computeDisplacement(px, py, cx, cy, enabledBones, transforms)
      deformedX[idx] = px + dx
      deformedY[idx] = py + dy
    }
  }

  // Draw each grid cell as two triangles using drawImage with path clipping
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const sx = col * gridSize
      const sy = row * gridSize
      const sw = Math.min(gridSize, width - sx)
      const sh = Math.min(gridSize, height - sy)

      // Four corner vertex indices
      const i00 = row * (cols + 1) + col
      const i10 = row * (cols + 1) + col + 1
      const i01 = (row + 1) * (cols + 1) + col
      const i11 = (row + 1) * (cols + 1) + col + 1

      // Deformed corners
      const x00 = deformedX[i00], y00 = deformedY[i00]
      const x10 = deformedX[i10], y10 = deformedY[i10]
      const x01 = deformedX[i01], y01 = deformedY[i01]
      const x11 = deformedX[i11], y11 = deformedY[i11]

      // Use affine transform to map source quad to deformed quad
      // Split into two triangles for accuracy

      // Triangle 1: top-left (00, 10, 01)
      drawTriangle(ctx, image,
        sx, sy, sx + sw, sy, sx, sy + sh,         // source triangle
        x00, y00, x10, y10, x01, y01              // dest triangle
      )

      // Triangle 2: bottom-right (10, 11, 01)
      drawTriangle(ctx, image,
        sx + sw, sy, sx + sw, sy + sh, sx, sy + sh,  // source triangle
        x10, y10, x11, y11, x01, y01                  // dest triangle
      )
    }
  }
}

// Draw a textured triangle using affine transform + clipping
function drawTriangle(
  ctx: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  // Source triangle vertices (in image space)
  sx0: number, sy0: number, sx1: number, sy1: number, sx2: number, sy2: number,
  // Destination triangle vertices (in canvas space)
  dx0: number, dy0: number, dx1: number, dy1: number, dx2: number, dy2: number
) {
  ctx.save()

  // Slightly expand triangle to prevent sub-pixel gaps between adjacent triangles
  const ecx = (dx0 + dx1 + dx2) / 3
  const ecy = (dy0 + dy1 + dy2) / 3
  const expand = 0.6
  const ex0 = dx0 + (dx0 - ecx) * expand / Math.hypot(dx0 - ecx, dy0 - ecy || 1)
  const ey0 = dy0 + (dy0 - ecy) * expand / Math.hypot(dx0 - ecx, dy0 - ecy || 1)
  const ex1 = dx1 + (dx1 - ecx) * expand / Math.hypot(dx1 - ecx, dy1 - ecy || 1)
  const ey1 = dy1 + (dy1 - ecy) * expand / Math.hypot(dx1 - ecx, dy1 - ecy || 1)
  const ex2 = dx2 + (dx2 - ecx) * expand / Math.hypot(dx2 - ecx, dy2 - ecy || 1)
  const ey2 = dy2 + (dy2 - ecy) * expand / Math.hypot(dx2 - ecx, dy2 - ecy || 1)

  ctx.beginPath()
  ctx.moveTo(ex0, ey0)
  ctx.lineTo(ex1, ey1)
  ctx.lineTo(ex2, ey2)
  ctx.closePath()
  ctx.clip()

  // Compute affine transform that maps source triangle to destination triangle
  // [sx0, sy0] -> [dx0, dy0]
  // [sx1, sy1] -> [dx1, dy1]
  // [sx2, sy2] -> [dx2, dy2]
  //
  // We need matrix M such that M * [sx, sy, 1]^T = [dx, dy, 1]^T
  // This gives us the setTransform parameters

  const denom = (sx0 * (sy1 - sy2) + sx1 * (sy2 - sy0) + sx2 * (sy0 - sy1))

  if (Math.abs(denom) < 0.001) {
    ctx.restore()
    return
  }

  const invDenom = 1 / denom

  // Affine transform coefficients: dx = a*sx + c*sy + e, dy = b*sx + d*sy + f
  const a = (dx0 * (sy1 - sy2) + dx1 * (sy2 - sy0) + dx2 * (sy0 - sy1)) * invDenom
  const b = (dy0 * (sy1 - sy2) + dy1 * (sy2 - sy0) + dy2 * (sy0 - sy1)) * invDenom
  const c = (dx0 * (sx2 - sx1) + dx1 * (sx0 - sx2) + dx2 * (sx1 - sx0)) * invDenom
  const d = (dy0 * (sx2 - sx1) + dy1 * (sx0 - sx2) + dy2 * (sx1 - sx0)) * invDenom
  const e = (dx0 * (sx1 * sy2 - sx2 * sy1) + dx1 * (sx2 * sy0 - sx0 * sy2) + dx2 * (sx0 * sy1 - sx1 * sy0)) * invDenom
  const f = (dy0 * (sx1 * sy2 - sx2 * sy1) + dy1 * (sx2 * sy0 - sx0 * sy2) + dy2 * (sx0 * sy1 - sx1 * sy0)) * invDenom

  ctx.setTransform(a, b, c, d, e, f)
  ctx.drawImage(image, 0, 0)

  ctx.restore()
}
