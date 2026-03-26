import type { AnimationClip } from '../core/types'

const idle: AnimationClip = {
  name: 'idle',
  label: '休闲',
  emoji: '✦',
  duration: 4000,
  loop: true,
  tracks: [
    { boneId: 'body', keyframes: [
      { t: 0, offsetY: 0 }, { t: 2000, offsetY: -3 }, { t: 4000, offsetY: 0 },
    ]},
    { boneId: 'head', keyframes: [
      { t: 0, rotation: 0 }, { t: 1500, rotation: 4 }, { t: 3000, rotation: -3 }, { t: 4000, rotation: 0 },
    ]},
    { boneId: 'arm_l', keyframes: [
      { t: 0, rotation: 0 }, { t: 2000, rotation: 3 }, { t: 4000, rotation: 0 },
    ]},
    { boneId: 'arm_r', keyframes: [
      { t: 0, rotation: 0 }, { t: 2000, rotation: -3 }, { t: 4000, rotation: 0 },
    ]},
    { boneId: 'leg_l', keyframes: [{ t: 0, rotation: 0 }, { t: 4000, rotation: 0 }] },
    { boneId: 'leg_r', keyframes: [{ t: 0, rotation: 0 }, { t: 4000, rotation: 0 }] },
    { boneId: 'tail', keyframes: [
      { t: 0, rotation: -8 }, { t: 500, rotation: 8 }, { t: 1000, rotation: -8 },
      { t: 1500, rotation: 6 }, { t: 2000, rotation: -6 }, { t: 3000, rotation: 5 }, { t: 4000, rotation: -8 },
    ]},
    { boneId: 'ear_l', keyframes: [
      { t: 0, rotation: 0 }, { t: 2500, rotation: -6 }, { t: 2800, rotation: 0 }, { t: 4000, rotation: 0 },
    ]},
    { boneId: 'ear_r', keyframes: [
      { t: 0, rotation: 0 }, { t: 2700, rotation: 6 }, { t: 3000, rotation: 0 }, { t: 4000, rotation: 0 },
    ]},
    { boneId: 'wing_l', keyframes: [
      { t: 0, rotation: 0 }, { t: 1000, rotation: -5 }, { t: 2000, rotation: 0 },
      { t: 3000, rotation: -5 }, { t: 4000, rotation: 0 },
    ]},
    { boneId: 'wing_r', keyframes: [
      { t: 0, rotation: 0 }, { t: 1000, rotation: 5 }, { t: 2000, rotation: 0 },
      { t: 3000, rotation: 5 }, { t: 4000, rotation: 0 },
    ]},
    { boneId: 'hat', keyframes: [
      { t: 0, rotation: 0 }, { t: 1500, rotation: 3 }, { t: 3000, rotation: -3 }, { t: 4000, rotation: 0 },
    ]},
  ],
}

const dance: AnimationClip = {
  name: 'dance',
  label: '跳舞',
  emoji: '♪',
  duration: 3000,
  loop: true,
  tracks: [
    { boneId: 'body', keyframes: [
      { t: 0, offsetY: 0, rotation: -3 },
      { t: 375, offsetY: -10, rotation: 3 },
      { t: 750, offsetY: 0, rotation: -3 },
      { t: 1125, offsetY: -10, rotation: 3 },
      { t: 1500, offsetY: 0, rotation: -3 },
      { t: 1875, offsetY: -12, rotation: 4 },
      { t: 2250, offsetY: 0, rotation: -3 },
      { t: 2625, offsetY: -10, rotation: 3 },
      { t: 3000, offsetY: 0, rotation: -3 },
    ]},
    { boneId: 'head', keyframes: [
      { t: 0, rotation: -5 }, { t: 750, rotation: 8 },
      { t: 1500, rotation: -8 }, { t: 2250, rotation: 8 }, { t: 3000, rotation: -5 },
    ]},
    { boneId: 'arm_l', keyframes: [
      { t: 0, rotation: -30 }, { t: 750, rotation: 20 },
      { t: 1500, rotation: -30 }, { t: 2250, rotation: 25 }, { t: 3000, rotation: -30 },
    ]},
    { boneId: 'arm_r', keyframes: [
      { t: 0, rotation: 20 }, { t: 750, rotation: -30 },
      { t: 1500, rotation: 25 }, { t: 2250, rotation: -30 }, { t: 3000, rotation: 20 },
    ]},
    { boneId: 'leg_l', keyframes: [
      { t: 0, rotation: -10 }, { t: 750, rotation: 15 },
      { t: 1500, rotation: -10 }, { t: 2250, rotation: 15 }, { t: 3000, rotation: -10 },
    ]},
    { boneId: 'leg_r', keyframes: [
      { t: 0, rotation: 15 }, { t: 750, rotation: -10 },
      { t: 1500, rotation: 15 }, { t: 2250, rotation: -10 }, { t: 3000, rotation: 15 },
    ]},
    { boneId: 'tail', keyframes: [
      { t: 0, rotation: -20 }, { t: 375, rotation: 20 },
      { t: 750, rotation: -20 }, { t: 1125, rotation: 20 },
      { t: 1500, rotation: -20 }, { t: 1875, rotation: 20 },
      { t: 2250, rotation: -20 }, { t: 2625, rotation: 20 }, { t: 3000, rotation: -20 },
    ]},
    { boneId: 'ear_l', keyframes: [
      { t: 0, rotation: 0 }, { t: 375, rotation: -10 }, { t: 750, rotation: 0 },
      { t: 1125, rotation: -10 }, { t: 1500, rotation: 0 },
      { t: 1875, rotation: -10 }, { t: 2250, rotation: 0 },
      { t: 2625, rotation: -10 }, { t: 3000, rotation: 0 },
    ]},
    { boneId: 'ear_r', keyframes: [
      { t: 0, rotation: 0 }, { t: 375, rotation: 10 }, { t: 750, rotation: 0 },
      { t: 1125, rotation: 10 }, { t: 1500, rotation: 0 },
      { t: 1875, rotation: 10 }, { t: 2250, rotation: 0 },
      { t: 2625, rotation: 10 }, { t: 3000, rotation: 0 },
    ]},
    { boneId: 'wing_l', keyframes: [
      { t: 0, rotation: -25 }, { t: 750, rotation: 25 },
      { t: 1500, rotation: -25 }, { t: 2250, rotation: 25 }, { t: 3000, rotation: -25 },
    ]},
    { boneId: 'wing_r', keyframes: [
      { t: 0, rotation: 25 }, { t: 750, rotation: -25 },
      { t: 1500, rotation: 25 }, { t: 2250, rotation: -25 }, { t: 3000, rotation: 25 },
    ]},
    { boneId: 'hat', keyframes: [
      { t: 0, rotation: -8, offsetY: 0 }, { t: 750, rotation: 8, offsetY: -6 },
      { t: 1500, rotation: -8, offsetY: 0 }, { t: 2250, rotation: 8, offsetY: -6 },
      { t: 3000, rotation: -8, offsetY: 0 },
    ]},
  ],
}

const wave: AnimationClip = {
  name: 'wave',
  label: '招手',
  emoji: '✿',
  duration: 3000,
  loop: true,
  tracks: [
    { boneId: 'body', keyframes: [
      { t: 0, rotation: -2 }, { t: 1500, rotation: 2 }, { t: 3000, rotation: -2 },
    ]},
    { boneId: 'head', keyframes: [
      { t: 0, rotation: -3 }, { t: 1000, rotation: 5 }, { t: 2000, rotation: -3 }, { t: 3000, rotation: -3 },
    ]},
    { boneId: 'arm_l', keyframes: [
      { t: 0, rotation: 5 }, { t: 3000, rotation: 5 },
    ]},
    { boneId: 'arm_r', keyframes: [
      { t: 0, rotation: -40 }, { t: 400, rotation: -20 },
      { t: 800, rotation: -40 }, { t: 1200, rotation: -20 },
      { t: 1600, rotation: -40 }, { t: 2000, rotation: -20 },
      { t: 2400, rotation: -40 }, { t: 2800, rotation: -20 }, { t: 3000, rotation: -40 },
    ]},
    { boneId: 'leg_l', keyframes: [{ t: 0, rotation: 0 }, { t: 3000, rotation: 0 }] },
    { boneId: 'leg_r', keyframes: [{ t: 0, rotation: 0 }, { t: 3000, rotation: 0 }] },
    { boneId: 'tail', keyframes: [
      { t: 0, rotation: -5 }, { t: 500, rotation: 8 },
      { t: 1000, rotation: -5 }, { t: 1500, rotation: 8 },
      { t: 2000, rotation: -5 }, { t: 2500, rotation: 8 }, { t: 3000, rotation: -5 },
    ]},
    { boneId: 'ear_l', keyframes: [
      { t: 0, rotation: 0 }, { t: 1500, rotation: -4 }, { t: 3000, rotation: 0 },
    ]},
    { boneId: 'ear_r', keyframes: [
      { t: 0, rotation: 0 }, { t: 1500, rotation: 4 }, { t: 3000, rotation: 0 },
    ]},
    { boneId: 'wing_l', keyframes: [
      { t: 0, rotation: 5 }, { t: 3000, rotation: 5 },
    ]},
    { boneId: 'wing_r', keyframes: [
      { t: 0, rotation: -30 }, { t: 400, rotation: -15 },
      { t: 800, rotation: -30 }, { t: 1200, rotation: -15 },
      { t: 1600, rotation: -30 }, { t: 2000, rotation: -15 },
      { t: 2400, rotation: -30 }, { t: 3000, rotation: -30 },
    ]},
    { boneId: 'hat', keyframes: [
      { t: 0, rotation: -2 }, { t: 1500, rotation: 2 }, { t: 3000, rotation: -2 },
    ]},
  ],
}

const bounce: AnimationClip = {
  name: 'bounce',
  label: '弹跳',
  emoji: '❤',
  duration: 2500,
  loop: true,
  tracks: [
    { boneId: 'body', keyframes: [
      { t: 0, offsetY: 0, scaleY: 1, scaleX: 1 },
      { t: 300, offsetY: 5, scaleY: 0.9, scaleX: 1.05 },
      { t: 600, offsetY: -20, scaleY: 1.1, scaleX: 0.95 },
      { t: 1000, offsetY: 0, scaleY: 0.92, scaleX: 1.04 },
      { t: 1300, offsetY: -15, scaleY: 1.08, scaleX: 0.96 },
      { t: 1700, offsetY: 0, scaleY: 0.95, scaleX: 1.02 },
      { t: 2000, offsetY: -8, scaleY: 1.04, scaleX: 0.98 },
      { t: 2500, offsetY: 0, scaleY: 1, scaleX: 1 },
    ]},
    { boneId: 'head', keyframes: [
      { t: 0, offsetY: 0 }, { t: 300, offsetY: 3 },
      { t: 600, offsetY: -8 }, { t: 1000, offsetY: 2 },
      { t: 1300, offsetY: -6 }, { t: 1700, offsetY: 1 },
      { t: 2000, offsetY: -3 }, { t: 2500, offsetY: 0 },
    ]},
    { boneId: 'arm_l', keyframes: [
      { t: 0, rotation: 5 }, { t: 300, rotation: 10 },
      { t: 600, rotation: -15 }, { t: 1000, rotation: 8 },
      { t: 1300, rotation: -10 }, { t: 2500, rotation: 5 },
    ]},
    { boneId: 'arm_r', keyframes: [
      { t: 0, rotation: -5 }, { t: 300, rotation: -10 },
      { t: 600, rotation: 15 }, { t: 1000, rotation: -8 },
      { t: 1300, rotation: 10 }, { t: 2500, rotation: -5 },
    ]},
    { boneId: 'leg_l', keyframes: [
      { t: 0, rotation: 0 }, { t: 300, rotation: 5 },
      { t: 600, rotation: -8 }, { t: 1000, rotation: 3 }, { t: 2500, rotation: 0 },
    ]},
    { boneId: 'leg_r', keyframes: [
      { t: 0, rotation: 0 }, { t: 300, rotation: -5 },
      { t: 600, rotation: 8 }, { t: 1000, rotation: -3 }, { t: 2500, rotation: 0 },
    ]},
    { boneId: 'tail', keyframes: [
      { t: 0, rotation: 0 }, { t: 600, rotation: -15 },
      { t: 1000, rotation: 10 }, { t: 1700, rotation: -8 }, { t: 2500, rotation: 0 },
    ]},
    { boneId: 'ear_l', keyframes: [
      { t: 0, rotation: 0 }, { t: 300, rotation: 3 },
      { t: 600, rotation: -10 }, { t: 1000, rotation: 2 }, { t: 2500, rotation: 0 },
    ]},
    { boneId: 'ear_r', keyframes: [
      { t: 0, rotation: 0 }, { t: 300, rotation: -3 },
      { t: 600, rotation: 10 }, { t: 1000, rotation: -2 }, { t: 2500, rotation: 0 },
    ]},
    { boneId: 'wing_l', keyframes: [
      { t: 0, rotation: 0 }, { t: 600, rotation: -25 },
      { t: 1000, rotation: 5 }, { t: 1300, rotation: -18 }, { t: 2500, rotation: 0 },
    ]},
    { boneId: 'wing_r', keyframes: [
      { t: 0, rotation: 0 }, { t: 600, rotation: 25 },
      { t: 1000, rotation: -5 }, { t: 1300, rotation: 18 }, { t: 2500, rotation: 0 },
    ]},
    { boneId: 'hat', keyframes: [
      { t: 0, offsetY: 0 }, { t: 600, offsetY: -10 },
      { t: 1000, offsetY: 3 }, { t: 1300, offsetY: -6 }, { t: 2500, offsetY: 0 },
    ]},
  ],
}

// 晕倒：宠物向右倒下（主要通过CSS旋转实现，这里提供轻微的骨骼辅助动画）
const faint: AnimationClip = {
  name: 'faint',
  label: '晕倒',
  emoji: '💫',
  duration: 1500,
  loop: false,
  tracks: [
    { boneId: 'body', keyframes: [
      { t: 0, offsetY: 0 }, { t: 1500, offsetY: 5 },
    ]},
    { boneId: 'head', keyframes: [
      { t: 0, rotation: 0 }, { t: 800, rotation: 10 }, { t: 1500, rotation: 20 },
    ]},
    { boneId: 'arm_l', keyframes: [
      { t: 0, rotation: 0 }, { t: 1500, rotation: 25 },
    ]},
    { boneId: 'arm_r', keyframes: [
      { t: 0, rotation: 0 }, { t: 1500, rotation: -35 },
    ]},
    { boneId: 'leg_l', keyframes: [
      { t: 0, rotation: 0 }, { t: 1500, rotation: 10 },
    ]},
    { boneId: 'leg_r', keyframes: [
      { t: 0, rotation: 0 }, { t: 1500, rotation: -5 },
    ]},
    { boneId: 'tail', keyframes: [
      { t: 0, rotation: 0 }, { t: 1500, rotation: -15 },
    ]},
    { boneId: 'ear_l', keyframes: [
      { t: 0, rotation: 0 }, { t: 1500, rotation: -15 },
    ]},
    { boneId: 'ear_r', keyframes: [
      { t: 0, rotation: 0 }, { t: 1500, rotation: 15 },
    ]},
    { boneId: 'wing_l', keyframes: [
      { t: 0, rotation: 0 }, { t: 1500, rotation: 15 },
    ]},
    { boneId: 'wing_r', keyframes: [
      { t: 0, rotation: 0 }, { t: 1500, rotation: -15 },
    ]},
    { boneId: 'hat', keyframes: [
      { t: 0, rotation: 0, offsetY: 0 }, { t: 1500, rotation: 15, offsetY: 5 },
    ]},
  ],
}

export const animationPresets: Record<string, AnimationClip> = {
  idle, dance, wave, bounce, faint,
}
