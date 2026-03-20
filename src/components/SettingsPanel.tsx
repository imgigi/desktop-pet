import { useState, useEffect } from 'react'
import PetGallery from './PetGallery'
import CreatePetFlow from './CreatePetFlow'
import BindFriend from './BindFriend'
import ChatHistory from './ChatHistory'
import type { PetData, UserProfile, FriendInfo } from '../core/types'

type TabKey = 'pets' | 'create' | 'friend' | 'chat'

interface Props {
  profile: UserProfile
  onSelectPet: (index: number) => void
  onDeletePet: (index: number) => void
  onPetCreated: (pet: PetData) => void
  onBindFriend: (petIndex: number, friend: FriendInfo) => void
  onUnbindFriend: (petIndex: number) => void
  onClose: () => void
  initialTab?: TabKey
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pets', label: '宠物栏' },
  { key: 'create', label: '创建' },
  { key: 'friend', label: '好友' },
  { key: 'chat', label: '对话' },
]

export default function SettingsPanel({
  profile,
  onSelectPet, onDeletePet, onPetCreated, onBindFriend, onUnbindFriend,
  onClose, initialTab = 'pets',
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const activePet = profile.pets[profile.active_pet_index]
  const hasPets = profile.pets.length > 0

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <div className="settings-title">设置</div>
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
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeTab === 'pets' && (
          <PetGallery
            pets={profile.pets}
            activeIndex={profile.active_pet_index}
            friendCode={profile.friend_code}
            onSelect={(i) => { onSelectPet(i); onClose() }}
            onCreateNew={() => setActiveTab('create')}
            onDelete={onDeletePet}
            onBindFriend={onBindFriend}
            onUnbindFriend={onUnbindFriend}
            onGoBindTab={() => setActiveTab('friend')}
          />
        )}

        {activeTab === 'create' && (
          <CreatePetFlow
            existingCount={profile.pets.length}
            onPetCreated={(pet) => { onPetCreated(pet); setActiveTab('pets') }}
          />
        )}

        {activeTab === 'friend' && (
          activePet ? (
            <BindFriend
              friendCode={profile.friend_code}
              userId={profile.id}
              currentFriend={activePet.friend}
              petName={activePet.name}
              onFriendBound={(fi) => onBindFriend(profile.active_pet_index, fi)}
              onUnbind={() => onUnbindFriend(profile.active_pet_index)}
            />
          ) : (
            <div className="bind-friend-tab">
              <div className="bind-pet-label">请先创建一只宠物</div>
            </div>
          )
        )}

        {activeTab === 'chat' && (
          <ChatHistory
            messages={profile.chat_history}
            userId={profile.id}
          />
        )}
      </div>
    </div>
  )
}
