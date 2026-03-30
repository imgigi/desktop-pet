import { useState, useEffect, useCallback, useRef } from 'react'
import PetDisplay, { type BubbleItem } from './components/PetDisplay'
import ChatInput from './components/ChatInput'
import SettingsPanel from './components/SettingsPanel'
import Onboarding, { type OnboardingStep, getOnboardingStep, setOnboardingStep } from './components/Onboarding'
import { supabase, isOnline, generateFriendCode } from './lib/supabase'
import { loadAppConfig, type AppConfig } from './lib/config'
import {
  subscribeMessages,
  sendMessage,
} from './lib/realtime'
import { getDefaultBones } from './core/skeleton'
import type { Bone, AnimationState, PetData, UserProfile, FriendInfo } from './core/types'
import { useWindowManager } from './hooks/useWindowManager'
import './App.css'

const STORAGE_KEY = 'desktop-pet-user'
const OPACITY_KEY = 'desktop-pet-opacity'

let bubbleIdCounter = 0

// 旧格式迁移
function migrateIfNeeded(raw: Record<string, unknown>): UserProfile {
  if ('pet_image_data' in raw) {
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
  return new Promise((resolve, reject) => {
    if (!dataUrl) {
      reject(new Error('Empty dataUrl'))
      return
    }
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      resolve(canvas)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [appConfig, setAppConfig] = useState<AppConfig | undefined>()

  // 宠物状态
  const [petState, setPetState] = useState<AnimationState>('idle')
  const [friendSetState, setFriendSetState] = useState<AnimationState | null>(null)
  const [mySetState, setMySetState] = useState<AnimationState | null>(null)
  const friendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const myTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 气泡（实时发送/接收的短暂显示）
  const [myBubble, setMyBubble] = useState<BubbleItem | null>(null)
  const [friendBubble, setFriendBubble] = useState<BubbleItem | null>(null)

  // 宠物画布
  const [petCanvas, setPetCanvas] = useState<HTMLCanvasElement | null>(null)
  const bonesRef = useRef<Bone[]>(getDefaultBones())

  // 设置面板
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<'pets' | 'chat' | 'settings'>('pets')

  // 输入框显示状态
  const [showInput, setShowInput] = useState(true)

  // 新手引导
  const [onboardingStep, setOnboardingStepState] = useState<OnboardingStep>(getOnboardingStep)

  const handleOnboardingChange = useCallback((step: OnboardingStep) => {
    setOnboardingStepState(step)
    setOnboardingStep(step)
  }, [])

  // 透明度
  const [petOpacity, setPetOpacity] = useState(() => {
    const saved = localStorage.getItem(OPACITY_KEY)
    return saved ? Number(saved) : 100
  })

  const { switchToFloat, switchToPanel, initPanel, startDragging } = useWindowManager()
  const listeningRef = useRef(false)

  // 加载远程配置
  useEffect(() => {
    loadAppConfig().then(setAppConfig)
  }, [])

  // 透明度持久化
  useEffect(() => {
    localStorage.setItem(OPACITY_KEY, String(petOpacity))
  }, [petOpacity])

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
        // 过滤自己发的消息（本地已保存，避免重复）
        if (msg.from_user === uid) return
        if (msg.pet_state && msg.pet_state !== 'idle') {
          if (friendTimerRef.current) clearTimeout(friendTimerRef.current)
          setFriendSetState(msg.pet_state as AnimationState)
          friendTimerRef.current = setTimeout(() => {
            setFriendSetState(null)
            friendTimerRef.current = null
          }, 3000)
        }
        // 显示为气泡
        setFriendBubble({ id: `friend-${++bubbleIdCounter}`, text: msg.content, type: 'friend' })
        // 添加到历史记录（去重）
        saveProfile(p => {
          if (p.chat_history.some(m => m.id === msg.id)) return p
          const activePetId = p.pets[p.active_pet_index]?.id
          return {
            ...p,
            chat_history: [...p.chat_history, {
              id: msg.id,
              from_user: msg.from_user,
              to_user: msg.to_user,
              content: msg.content,
              pet_state: msg.pet_state,
              timestamp: Date.now(),
              pet_id: activePetId,
            }].slice(-200),
          }
        })
      },
      (update) => {
        if (update.set_by !== uid) {
          setFriendSetState(update.state as AnimationState)
        }
      }
    )
  }, [saveProfile])

  // 监听系统托盘事件 — ref 在 openSettings 定义后赋值
  const openSettingsRef = useRef<typeof openSettings | null>(null)

  useEffect(() => {
    let unlisten: (() => void) | undefined

    const setupTrayListener = async () => {
      if (!('__TAURI__' in window)) return
      try {
        const { listen } = await import('@tauri-apps/api/event')
        unlisten = await listen('open-settings', () => {
          openSettingsRef.current?.('pets')
        })
      } catch {
        // 非 Tauri 环境忽略
      }
    }
    setupTrayListener()
    return () => { unlisten?.() }
  }, [])

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

    // 同步到 Supabase — 确保用户记录存在，否则配对码查不到
    if (isOnline) {
      supabase!.from('users').upsert(
        {
          id: p.id,
          friend_code: p.friend_code,
          nickname: p.nickname || null,
        },
        { onConflict: 'id' }
      ).then(({ error }) => {
        if (error) console.error('[supabase] user upsert failed:', error.message)
      })
    }

    if (p.pets.length === 0) {
      setSettingsOpen(true)
      setSettingsInitialTab('pets')
      initPanel()
    } else {
      switchToFloat()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 打开设置面板
  const openSettings = useCallback(async (tab: 'pets' | 'chat' | 'settings' = 'pets') => {
    setSettingsInitialTab(tab)
    setSettingsOpen(true)
    setShowInput(false)
    await switchToPanel()
  }, [switchToPanel])

  openSettingsRef.current = openSettings

  // 关闭设置面板
  const closeSettings = useCallback(async () => {
    if (!profile || profile.pets.length === 0) return
    setSettingsOpen(false)
    setShowInput(true)
    await switchToFloat()
  }, [switchToFloat, profile])

  // 发消息
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
    saveProfile(p => {
      const msgId = crypto.randomUUID()
      const activePetId = p.pets[p.active_pet_index]?.id
      return {
        ...p,
        chat_history: [...p.chat_history, {
          id: msgId,
          from_user: p.id,
          to_user: targetId,
          content: text,
          pet_state: state,
          timestamp: Date.now(),
          pet_id: activePetId,
        }].slice(-200),
      }
    })
  }, [profile, saveProfile])

  // 状态预览
  const handleStatePreview = useCallback((state: AnimationState) => {
    if (myTimerRef.current) clearTimeout(myTimerRef.current)
    setMySetState(state)
    myTimerRef.current = setTimeout(() => {
      setMySetState(null)
      myTimerRef.current = null
    }, 3000)
  }, [])

  // 选择宠物
  const handleSelectPet = useCallback(async (index: number) => {
    let targetPet: PetData | undefined
    saveProfile(p => {
      targetPet = p.pets[index]
      return { ...p, active_pet_index: index }
    })
    if (targetPet) {
      const canvas = await loadImageToCanvas(targetPet.image_data)
      setPetCanvas(canvas)
      bonesRef.current = targetPet.bones
    }
  }, [saveProfile])

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
    saveProfile(p => {
      if (p.pets.length >= 3) return p
      return {
        ...p,
        pets: [...p.pets, pet],
        active_pet_index: p.pets.length,
      }
    })
    const canvas = await loadImageToCanvas(pet.image_data)
    setPetCanvas(canvas)
    bonesRef.current = pet.bones

    // 创建宠物后触发浮窗引导
    if (onboardingStep === 'create-hint' || onboardingStep === 'welcome') {
      handleOnboardingChange('pet-click')
    }

    if (isOnline && profile) {
      supabase!.from('users').upsert(
        {
          id: profile.id,
          friend_code: profile.friend_code,
          pet_image_data: pet.image_data,
          pet_bones: pet.bones,
        },
        { onConflict: 'id' }
      ).then(({ error }) => {
        if (error) console.error('[supabase] pet sync failed:', error.message)
      })
    }
  }, [profile, saveProfile])

  // 修改宠物
  const handlePetUpdated = useCallback(async (index: number, pet: PetData) => {
    let isActive = false
    saveProfile(p => {
      isActive = index === p.active_pet_index
      const pets = [...p.pets]
      pets[index] = { ...pet, friend: pets[index]?.friend }
      return { ...p, pets }
    })
    if (isActive) {
      const canvas = await loadImageToCanvas(pet.image_data)
      setPetCanvas(canvas)
      bonesRef.current = pet.bones
    }
  }, [saveProfile])

  // 改名
  const handleRenamePet = useCallback((index: number, name: string) => {
    saveProfile(p => {
      const pets = [...p.pets]
      pets[index] = { ...pets[index], name }
      return { ...p, pets }
    })
  }, [saveProfile])

  // 绑定好友
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

  // 切换宠物
  const handleSwitchPet = useCallback(async (index: number) => {
    let targetPet: PetData | undefined
    saveProfile(p => {
      targetPet = p.pets[index]
      return { ...p, active_pet_index: index }
    })
    if (targetPet) {
      const canvas = await loadImageToCanvas(targetPet.image_data)
      setPetCanvas(canvas)
      bonesRef.current = targetPet.bones
    }
  }, [saveProfile])

  // 按住宠物拖动窗口
  const handlePetDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    startDragging()
  }, [startDragging])

  if (!profile) return null

  // 设置面板
  if (settingsOpen) {
    return (
      <div className="app-root panel-mode">
        {/* 可拖拽的顶部区域 */}
        <div className="panel-drag-bar" onMouseDown={handlePetDrag}>
          <div className="panel-drag-dots">· · ·</div>
        </div>
        <Onboarding
          step={onboardingStep}
          onStepChange={handleOnboardingChange}
          hasPets={profile.pets.length > 0}
          multiPets={profile.pets.length > 1}
          mode="panel"
        />
        <SettingsPanel
          profile={profile}
          onSelectPet={handleSelectPet}
          onDeletePet={handleDeletePet}
          onPetCreated={handlePetCreated}
          onPetUpdated={handlePetUpdated}
          onBindFriend={handleBindFriend}
          onUnbindFriend={handleUnbindFriend}
          onRenamePet={handleRenamePet}
          onClose={closeSettings}
          initialTab={settingsInitialTab}
          petOpacity={petOpacity}
          onOpacityChange={setPetOpacity}
          appConfig={appConfig}
        />
      </div>
    )
  }

  // 浮窗模式：只有宠物 + 对话气泡 + 输入框
  return (
    <div className="app-root pet-mode">
      <Onboarding
        step={onboardingStep}
        onStepChange={handleOnboardingChange}
        hasPets={profile.pets.length > 0}
        multiPets={profile.pets.length > 1}
        mode="float"
      />
      <PetDisplay
        imageCanvas={petCanvas}
        bones={bonesRef.current}
        state={petState}
        myBubble={myBubble}
        friendBubble={friendBubble}
        recentMessages={profile.chat_history}
        userId={profile.id}
        opacity={petOpacity}
        onDrag={handlePetDrag}
      />
      {showInput && (
        <ChatInput
          onSend={handleSend}
          onStatePreview={handleStatePreview}
          pets={profile.pets}
          activePetIndex={profile.active_pet_index}
          onSwitchPet={handleSwitchPet}
        />
      )}
    </div>
  )
}
