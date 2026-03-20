import { useState, useEffect, useCallback, useRef } from 'react'
import PetDisplay, { type BubbleItem } from './components/PetDisplay'
import ChatInput from './components/ChatInput'
import SettingsPanel from './components/SettingsPanel'
import { supabase, isOnline, generateFriendCode } from './lib/supabase'
import {
  subscribeMessages,
  sendMessage,
  markReadAndDelete,
  type PetMessage,
} from './lib/realtime'
import { getDefaultBones } from './core/skeleton'
import type { Bone, AnimationState, PetData, UserProfile, FriendInfo } from './core/types'
import { useWindowManager } from './hooks/useWindowManager'
import './App.css'

const STORAGE_KEY = 'desktop-pet-user'

let bubbleIdCounter = 0

// 旧格式迁移
function migrateIfNeeded(raw: Record<string, unknown>): UserProfile {
  if ('pet_image_data' in raw) {
    // 旧格式 → 新格式
    const savedFriend = localStorage.getItem('desktop-pet-friend')
    const friend = savedFriend ? JSON.parse(savedFriend) as FriendInfo : undefined

    const profile: UserProfile = {
      id: raw.id as string,
      friend_code: raw.friend_code as string,
      nickname: (raw.nickname as string) || '',
      pets: [],
      active_pet_index: 0,
      chat_history: [],
    }
    if (raw.pet_image_data) {
      profile.pets.push({
        id: crypto.randomUUID(),
        name: '宠物1',
        image_data: raw.pet_image_data as string,
        bones: (raw.pet_bones as Bone[]) || getDefaultBones(),
        created_at: Date.now(),
        friend,
      })
    }
    localStorage.removeItem('desktop-pet-friend')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    return profile
  }

  // 中间版本迁移：全局 friend → 第一只宠物的 friend
  const p = raw as unknown as UserProfile
  const savedFriend = localStorage.getItem('desktop-pet-friend')
  if (savedFriend && p.pets?.length > 0 && !p.pets[0].friend) {
    p.pets[0].friend = JSON.parse(savedFriend) as FriendInfo
    localStorage.removeItem('desktop-pet-friend')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  }

  return p
}

function loadImageToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      resolve(canvas)
    }
    img.src = dataUrl
  })
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // 宠物状态
  const [petState, setPetState] = useState<AnimationState>('idle')
  const [friendSetState, setFriendSetState] = useState<AnimationState | null>(null)
  const [mySetState, setMySetState] = useState<AnimationState | null>(null)
  const friendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const myTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 气泡
  const [myBubble, setMyBubble] = useState<BubbleItem | null>(null)
  const [friendBubble, setFriendBubble] = useState<BubbleItem | null>(null)

  // 未读消息
  const [unreadMessages, setUnreadMessages] = useState<PetMessage[]>([])

  // 宠物画布
  const [petCanvas, setPetCanvas] = useState<HTMLCanvasElement | null>(null)
  const bonesRef = useRef<Bone[]>(getDefaultBones())

  // 设置面板
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<'pets' | 'create' | 'friend' | 'chat'>('pets')

  const { switchToFloat, switchToPanel, initPanel, startDragging } = useWindowManager()
  const listeningRef = useRef(false)

  // 状态优先级
  useEffect(() => {
    if (friendSetState) setPetState(friendSetState)
    else if (mySetState) setPetState(mySetState)
    else setPetState('idle')
  }, [friendSetState, mySetState])

  // 保存 profile
  const saveProfile = useCallback((updater: (p: UserProfile) => UserProfile) => {
    setProfile(prev => {
      if (!prev) return prev
      const next = updater(prev)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // 加载当前宠物画布
  const loadActivePet = useCallback(async (p: UserProfile) => {
    const pet = p.pets[p.active_pet_index]
    if (pet) {
      const canvas = await loadImageToCanvas(pet.image_data)
      setPetCanvas(canvas)
      bonesRef.current = pet.bones
    } else {
      setPetCanvas(null)
      bonesRef.current = getDefaultBones()
    }
  }, [])

  // 开始监听消息
  const startListening = useCallback((uid: string) => {
    if (listeningRef.current) return
    listeningRef.current = true

    subscribeMessages(uid,
      (msg) => {
        if (msg.pet_state && msg.pet_state !== 'idle') {
          if (friendTimerRef.current) clearTimeout(friendTimerRef.current)
          setFriendSetState(msg.pet_state as AnimationState)
          friendTimerRef.current = setTimeout(() => {
            setFriendSetState(null)
            friendTimerRef.current = null
          }, 3000)
        }
        setUnreadMessages(prev => [...prev, msg])
        saveProfile(p => ({
          ...p,
          chat_history: [...p.chat_history, {
            id: msg.id,
            from_user: msg.from_user,
            to_user: msg.to_user,
            content: msg.content,
            pet_state: msg.pet_state,
            timestamp: Date.now(),
          }].slice(-200),
        }))
      },
      (update) => {
        if (update.set_by !== uid) {
          setFriendSetState(update.state as AnimationState)
        }
      }
    )
  }, [saveProfile])

  // 初始化
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    let p: UserProfile

    if (saved) {
      p = migrateIfNeeded(JSON.parse(saved))
    } else {
      p = {
        id: crypto.randomUUID(),
        friend_code: generateFriendCode(),
        nickname: '',
        pets: [],
        active_pet_index: 0,
        chat_history: [],
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    }

    setProfile(p)
    loadActivePet(p)
    startListening(p.id)

    // 首次无宠物 → 打开设置面板
    if (p.pets.length === 0) {
      setSettingsOpen(true)
      setSettingsInitialTab('create')
      initPanel()
    } else {
      switchToFloat()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 打开设置面板（叠加在宠物上方，宠物位置不变）
  const openSettings = useCallback(async (tab: 'pets' | 'create' | 'friend' | 'chat' = 'pets') => {
    setSettingsInitialTab(tab)
    setSettingsOpen(true)
    await switchToPanel()
  }, [switchToPanel])

  // 关闭设置面板
  const closeSettings = useCallback(async () => {
    if (!profile || profile.pets.length === 0) return
    setSettingsOpen(false)
    await switchToFloat()
  }, [switchToFloat, profile])

  // 菜单圆点点击
  const handleMenuDotClick = useCallback(async () => {
    if (unreadMessages.length > 0) {
      const msg = unreadMessages[0]
      setFriendBubble({ id: `friend-${++bubbleIdCounter}`, text: msg.content, type: 'friend' })
      if (msg.pet_state && msg.pet_state !== 'idle') {
        if (friendTimerRef.current) clearTimeout(friendTimerRef.current)
        setFriendSetState(msg.pet_state as AnimationState)
        friendTimerRef.current = setTimeout(() => {
          setFriendSetState(null)
          friendTimerRef.current = null
        }, 3000)
      }
      if (isOnline) {
        await markReadAndDelete(msg.id)
      }
      setUnreadMessages(prev => prev.slice(1))
    }
    await openSettings('pets')
  }, [unreadMessages, openSettings])

  // 发消息（目标 = 当前宠物绑定的好友）
  const handleSend = useCallback(async (text: string, state: AnimationState) => {
    if (!profile) return
    const activePet = profile.pets[profile.active_pet_index]
    const targetId = activePet?.friend?.id || profile.id
    setMyBubble({ id: `mine-${++bubbleIdCounter}`, text, type: 'mine' })
    if (state !== 'idle') {
      if (myTimerRef.current) clearTimeout(myTimerRef.current)
      setMySetState(state)
      myTimerRef.current = setTimeout(() => {
        setMySetState(null)
        myTimerRef.current = null
      }, 3000)
    }
    if (isOnline) {
      await sendMessage(profile.id, targetId, text, state)
    }
    saveProfile(p => ({
      ...p,
      chat_history: [...p.chat_history, {
        id: crypto.randomUUID(),
        from_user: p.id,
        to_user: targetId,
        content: text,
        pet_state: state,
        timestamp: Date.now(),
      }].slice(-200),
    }))
  }, [profile, saveProfile])

  // 选择宠物
  const handleSelectPet = useCallback(async (index: number) => {
    saveProfile(p => ({ ...p, active_pet_index: index }))
    if (profile) {
      const pet = profile.pets[index]
      if (pet) {
        const canvas = await loadImageToCanvas(pet.image_data)
        setPetCanvas(canvas)
        bonesRef.current = pet.bones
      }
    }
  }, [profile, saveProfile])

  // 删除宠物
  const handleDeletePet = useCallback((index: number) => {
    if (!profile) return
    const pets = profile.pets.filter((_, i) => i !== index)
    let activeIdx = profile.active_pet_index
    if (activeIdx >= pets.length) activeIdx = Math.max(0, pets.length - 1)

    const next = { ...profile, pets, active_pet_index: activeIdx }
    setProfile(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))

    const activePet = pets[activeIdx]
    if (activePet) {
      loadImageToCanvas(activePet.image_data).then(canvas => {
        setPetCanvas(canvas)
        bonesRef.current = activePet.bones
      })
    } else {
      setPetCanvas(null)
      bonesRef.current = getDefaultBones()
    }
  }, [profile])

  // 创建宠物
  const handlePetCreated = useCallback(async (pet: PetData) => {
    saveProfile(p => ({
      ...p,
      pets: [...p.pets.slice(0, 2), pet],
      active_pet_index: Math.min(p.pets.length, 2),
    }))
    const canvas = await loadImageToCanvas(pet.image_data)
    setPetCanvas(canvas)
    bonesRef.current = pet.bones

    if (isOnline && profile) {
      supabase!.from('users').upsert({
        id: profile.id,
        friend_code: profile.friend_code,
        pet_image_data: pet.image_data,
        pet_bones: pet.bones,
      })
    }
  }, [profile, saveProfile])

  // 绑定好友到指定宠物
  const handleBindFriend = useCallback((petIndex: number, friend: FriendInfo) => {
    saveProfile(p => {
      const pets = [...p.pets]
      pets[petIndex] = { ...pets[petIndex], friend }
      return { ...p, pets }
    })
  }, [saveProfile])

  // 解绑好友
  const handleUnbindFriend = useCallback((petIndex: number) => {
    saveProfile(p => {
      const pets = [...p.pets]
      const { friend: _, ...petWithoutFriend } = pets[petIndex]
      pets[petIndex] = petWithoutFriend
      return { ...p, pets }
    })
  }, [saveProfile])

  // 拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.chat-input-area, .state-picker, .settings-panel, button, input, a')) return
    startDragging()
  }, [startDragging])

  if (!profile) return null

  // 设置面板打开时：全屏覆盖
  if (settingsOpen) {
    return (
      <div className="app-root panel-mode">
        <SettingsPanel
          profile={profile}
          onSelectPet={handleSelectPet}
          onDeletePet={handleDeletePet}
          onPetCreated={handlePetCreated}
          onBindFriend={handleBindFriend}
          onUnbindFriend={handleUnbindFriend}
          onClose={closeSettings}
          initialTab={settingsInitialTab}
        />
      </div>
    )
  }

  // 浮窗模式
  return (
    <div className="app-root pet-mode" onMouseDown={handleMouseDown}>
      <PetDisplay
        imageCanvas={petCanvas}
        bones={bonesRef.current}
        state={petState}
        myBubble={myBubble}
        friendBubble={friendBubble}
        unreadCount={unreadMessages.length}
        onMenuDotClick={handleMenuDotClick}
      />
      <ChatInput onSend={handleSend} />
    </div>
  )
}
