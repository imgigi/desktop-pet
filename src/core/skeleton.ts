import type { Bone } from './types'

// All available bones — user picks which ones to enable
// Default: human-like preset (head, body, arms, legs enabled)
export const allBones: Bone[] = [
  { id: 'head',       label: '头部',   emoji: '👤', offset: { x: 0, y: -80 },  rotation: 0, length: 35, enabled: true,  influence: 60 },
  { id: 'body',       label: '身体',   emoji: '👕', offset: { x: 0, y: 0 },    rotation: 0, length: 60, enabled: true,  influence: 80 },
  { id: 'arm_l',      label: '左手臂', emoji: '💪', offset: { x: -50, y: -20 },rotation: 0, length: 45, enabled: true,  influence: 50 },
  { id: 'arm_r',      label: '右手臂', emoji: '🤚', offset: { x: 50, y: -20 }, rotation: 0, length: 45, enabled: true,  influence: 50 },
  { id: 'leg_l',      label: '左腿',   emoji: '🦵', offset: { x: -20, y: 60 }, rotation: 0, length: 55, enabled: true,  influence: 55 },
  { id: 'leg_r',      label: '右腿',   emoji: '🦶', offset: { x: 20, y: 60 },  rotation: 0, length: 55, enabled: true,  influence: 55 },
  { id: 'ear_l',      label: '左耳',   emoji: '👂', offset: { x: -25, y: -100},rotation: 0, length: 20, enabled: false, influence: 30 },
  { id: 'ear_r',      label: '右耳',   emoji: '👂', offset: { x: 25, y: -100 },rotation: 0, length: 20, enabled: false, influence: 30 },
  { id: 'tail',       label: '尾巴',   emoji: '🐾', offset: { x: 0, y: 50 },   rotation: 0, length: 40, enabled: false, influence: 40 },
  { id: 'wing_l',     label: '左翅膀', emoji: '🪽', offset: { x: -60, y: -10 },rotation: 0, length: 40, enabled: false, influence: 45 },
  { id: 'wing_r',     label: '右翅膀', emoji: '🪽', offset: { x: 60, y: -10 }, rotation: 0, length: 40, enabled: false, influence: 45 },
  { id: 'hat',        label: '帽子/角',emoji: '🎩', offset: { x: 0, y: -110 }, rotation: 0, length: 20, enabled: false, influence: 25 },
]

export function getDefaultBones(): Bone[] {
  return allBones.map(b => ({ ...b, offset: { ...b.offset } }))
}
