export interface Point {
  x: number
  y: number
}

export interface Bone {
  id: string
  label: string
  emoji: string
  offset: Point       // absolute position relative to image center
  rotation: number
  length: number
  enabled: boolean
  influence: number   // radius of influence for deformation
}

export interface Keyframe {
  t: number
  rotation?: number
  offsetX?: number
  offsetY?: number
  scaleX?: number
  scaleY?: number
}

export interface AnimationTrack {
  boneId: string
  keyframes: Keyframe[]
}

export interface AnimationClip {
  name: string
  label: string
  emoji: string
  duration: number
  loop: boolean
  tracks: AnimationTrack[]
}

export type AnimationState = 'idle' | 'dance' | 'wave' | 'bounce' | 'faint'

export interface PetData {
  id: string
  name: string
  image_data: string      // dataURL（兼容旧数据）或空字符串（图片存 IndexedDB）
  image_id?: string       // IndexedDB 图片 key，新数据用此字段
  bones: Bone[]
  created_at: number
  friend?: FriendInfo      // 每只宠物绑定一个好友
}

export interface ChatMessage {
  id: string
  from_user: string
  to_user: string
  content: string
  pet_state: string
  timestamp: number
}

export interface UserProfile {
  id: string
  friend_code: string
  nickname: string
  pets: PetData[]
  active_pet_index: number
  chat_history: ChatMessage[]
}

export interface FriendInfo {
  id: string
  nickname: string
  pet_image_data: string | null
  pet_bones: Bone[]
}
