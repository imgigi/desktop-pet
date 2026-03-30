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
    const radius = bone.influence * 2

    if (dist > radius) continue

    // Smooth cubic falloff
    const t = dist / radius
    const w = 1 - t
    const weight = w * w * (3 - 2 * w)

    const bt = transforms.get(bone.id)
    if (!bt || weight < 0.001) continue

    // Rotation around bone pivot
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

// Render deformed image using per-pixel displacement (no triangle mesh, no tearing)
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
  const enabledBones = bones.filter(b => b.enabled)

  // If no transforms, just draw the image directly
  if (transforms.size === 0 || enabledBones.length === 0) {
    ctx.drawImage(image, 0, 0)
    return
  }

  // Use quad-based rendering: draw each grid cell as a warped rectangle
  // by applying the displacement at the cell center as a simple translate.
  // This avoids triangle clipping artifacts entirely.
  const gridSize = 4
  const cols = Math.ceil(width / gridSize)
  const rows = Math.ceil(height / gridSize)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const sx = col * gridSize
      const sy = row * gridSize
      const sw = Math.min(gridSize, width - sx)
      const sh = Math.min(gridSize, height - sy)

      // Compute displacement at cell center
      const pcx = sx + sw / 2
      const pcy = sy + sh / 2
      const { dx, dy } = computeDisplacement(pcx, pcy, cx, cy, enabledBones, transforms)

      // Draw the source cell shifted by displacement
      ctx.drawImage(image, sx, sy, sw, sh, sx + dx, sy + dy, sw, sh)
    }
  }
}
