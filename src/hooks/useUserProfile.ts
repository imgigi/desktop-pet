import { useState, useEffect, useCallback } from 'react'
import type { UserProfile, PetData, ChatMessage, Bone } from '../core/types'
import { generateFriendCode } from '../lib/supabase'
import { getDefaultBones } from '../core/skeleton'

const STORAGE_KEY = 'desktop-pet-user'

interface OldProfile {
  id: string
  friend_code: string
  nickname: string
  pet_image_data: string | null
  pet_bones: Bone[]
}

function migrateOldProfile(old: OldProfile): UserProfile {
  const profile: UserProfile = {
    id: old.id,
    friend_code: old.friend_code,
    nickname: old.nickname,
    pets: [],
    active_pet_index: 0,
    chat_history: [],
  }
  if (old.pet_image_data) {
    profile.pets.push({
      id: crypto.randomUUID(),
      name: '宠物1',
      image_data: old.pet_image_data,
      bones: old.pet_bones || getDefaultBones(),
      created_at: Date.now(),
    })
  }
  return profile
}

function loadProfile(): UserProfile | null {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return null
  const parsed = JSON.parse(saved)
  // 检测旧格式：有 pet_image_data 字段说明是旧格式
  if ('pet_image_data' in parsed) {
    const migrated = migrateOldProfile(parsed as OldProfile)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
    return migrated
  }
  return parsed as UserProfile
}

function createNewProfile(): UserProfile {
  const profile: UserProfile = {
    id: crypto.randomUUID(),
    friend_code: generateFriendCode(),
    nickname: '',
    pets: [],
    active_pet_index: 0,
    chat_history: [],
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  return profile
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const p = loadProfile() || createNewProfile()
    setProfile(p)
  }, [])

  const saveProfile = useCallback((updater: (prev: UserProfile) => UserProfile) => {
    setProfile(prev => {
      if (!prev) return prev
      const next = updater(prev)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const addPet = useCallback((pet: PetData) => {
    saveProfile(p => ({
      ...p,
      pets: [...p.pets.slice(0, 2), pet],  // 最多3个
      active_pet_index: Math.min(p.pets.length, 2),
    }))
  }, [saveProfile])

  const removePet = useCallback((index: number) => {
    saveProfile(p => {
      const pets = p.pets.filter((_, i) => i !== index)
      let activeIdx = p.active_pet_index
      if (activeIdx >= pets.length) activeIdx = Math.max(0, pets.length - 1)
      return { ...p, pets, active_pet_index: activeIdx }
    })
  }, [saveProfile])

  const setActivePet = useCallback((index: number) => {
    saveProfile(p => ({ ...p, active_pet_index: index }))
  }, [saveProfile])

  const addChatMessage = useCallback((msg: ChatMessage) => {
    saveProfile(p => {
      const history = [...p.chat_history, msg].slice(-200) // 上限200条
      return { ...p, chat_history: history }
    })
  }, [saveProfile])

  const activePet = profile?.pets[profile.active_pet_index] ?? null

  return {
    profile,
    activePet,
    saveProfile,
    addPet,
    removePet,
    setActivePet,
    addChatMessage,
  }
}
