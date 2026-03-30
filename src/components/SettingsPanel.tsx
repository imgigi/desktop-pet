import { useState, useEffect } from 'react'
import PetGallery from './PetGallery'
import CreatePetFlow from './CreatePetFlow'
import type { PetData, UserProfile, FriendInfo } from '../core/types'
import type { AppConfig } from '../lib/config'

type TabKey = 'pets' | 'settings'

interface Props {
  profile: UserProfile
  onSelectPet: (index: number) => void
  onDeletePet: (index: number) => void
  onPetCreated: (pet: PetData) => void
  onPetUpdated: (index: number, pet: PetData) => void
  onBindFriend: (petIndex: number, friend: FriendInfo) => void
  onUnbindFriend: (petIndex: number) => void
  onRenamePet: (index: number, name: string) => void
  onClose: () => void
  initialTab?: TabKey | 'chat'
  petOpacity: number
  onOpacityChange: (val: number) => void
  appConfig?: AppConfig
}

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: 'pets', label: '宠物栏', emoji: '🐾' },
  { key: 'settings', label: '设置', emoji: '⚙️' },
]

export default function SettingsPanel({
  profile,
  onSelectPet, onDeletePet, onPetCreated, onPetUpdated,
  onBindFriend, onUnbindFriend, onRenamePet,
  onClose, initialTab = 'pets',
  petOpacity, onOpacityChange, appConfig,
}: Props) {
  // 兼容旧的 'chat' tab，映射到 'pets'
  const normalizedTab: TabKey = initialTab === 'chat' ? 'pets' : initialTab as TabKey
  const [activeTab, setActiveTab] = useState<TabKey>(normalizedTab)
  const [creatingPet, setCreatingPet] = useState(false)
  const [editingPetIndex, setEditingPetIndex] = useState<number | null>(null)

  useEffect(() => {
    setActiveTab(initialTab === 'chat' ? 'pets' : initialTab as TabKey)
  }, [initialTab])

  const hasPets = profile.pets.length > 0

  useEffect(() => {
    if (!hasPets && !creatingPet) {
      setCreatingPet(true)
    }
  }, [hasPets]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditPet = (index: number) => {
    setEditingPetIndex(index)
    setCreatingPet(true)
  }

  const handlePetCreatedOrUpdated = (pet: PetData) => {
    if (editingPetIndex !== null) {
      onPetUpdated(editingPetIndex, pet)
    } else {
      onPetCreated(pet)
    }
    setCreatingPet(false)
    setEditingPetIndex(null)
    setActiveTab('pets')
  }

  const handleCancelCreate = () => {
    if (hasPets) {
      setCreatingPet(false)
      setEditingPetIndex(null)
    }
  }

  if (creatingPet) {
    const editPet = editingPetIndex !== null ? profile.pets[editingPetIndex] : undefined
    return (
      <div className="settings-panel">
        <div className="settings-header">
          <div className="settings-title">{editPet ? '修改宠物' : '创建宠物'}</div>
          {hasPets && (
            <button className="settings-close" onClick={handleCancelCreate}>×</button>
          )}
        </div>
        <div className="settings-content">
          <CreatePetFlow
            existingCount={profile.pets.length}
            onPetCreated={handlePetCreatedOrUpdated}
            editingPet={editPet}
            appConfig={appConfig}
            onCancel={hasPets ? handleCancelCreate : undefined}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <div className="settings-title">✨ 桌宠基地</div>
        {hasPets && (
          <button className="settings-close" onClick={onClose}>×</button>
        )}
      </div>

      <div className="settings-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`settings-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeTab === 'pets' && (
          <PetGallery
            pets={profile.pets}
            activeIndex={profile.active_pet_index}
            friendCode={profile.friend_code}
            userId={profile.id}
            chatHistory={profile.chat_history}
            onSelect={(i) => { onSelectPet(i); onClose() }}
            onCreateNew={() => { setEditingPetIndex(null); setCreatingPet(true) }}
            onDelete={onDeletePet}
            onBindFriend={onBindFriend}
            onUnbindFriend={onUnbindFriend}
            onEditPet={handleEditPet}
            onRenamePet={onRenamePet}
          />
        )}

        {activeTab === 'settings' && (
          <div className="settings-page">
            <div className="settings-section">
              <div className="settings-section-title">宠物透明度</div>
              <div className="settings-opacity-row">
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={petOpacity}
                  onChange={e => onOpacityChange(Number(e.target.value))}
                  className="settings-slider"
                />
                <span className="settings-opacity-val">{petOpacity}%</span>
              </div>
              <div className="settings-hint">调低透明度，让宠物更融入桌面</div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">关于</div>
              <div className="settings-hint">Desktop Pet v0.1.0</div>
              <div className="settings-hint">把朋友养成桌宠，每天陪你摸鱼</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
