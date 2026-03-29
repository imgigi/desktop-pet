import { useState } from 'react'
import type { PetData, FriendInfo } from '../core/types'
import { isOnline } from '../lib/supabase'
import { bindFriendByCode } from '../lib/friend'

interface Props {
  pets: PetData[]
  activeIndex: number
  friendCode: string
  userId: string
  petImages?: Map<string, string>
  onSelect: (index: number) => void
  onCreateNew: () => void
  onDelete: (index: number) => void
  onBindFriend: (index: number, friend: FriendInfo) => void
  onUnbindFriend: (index: number) => void
  onEditPet: (index: number) => void
  onRenamePet: (index: number, name: string) => void
}

export default function PetGallery({
  pets, activeIndex, friendCode, userId, petImages = new Map(),
  onSelect, onCreateNew, onDelete,
  onBindFriend, onUnbindFriend, onEditPet, onRenamePet,
}: Props) {
  const [editingName, setEditingName] = useState<number | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [bindInput, setBindInput] = useState('')
  const [binding, setBinding] = useState(false)
  const [bindError, setBindError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const startEditName = (index: number, currentName: string) => {
    setEditingName(index)
    setNameInput(currentName)
  }

  const saveName = (index: number) => {
    const trimmed = nameInput.trim()
    if (trimmed) onRenamePet(index, trimmed)
    setEditingName(null)
  }

  const handleBind = async (petIndex: number) => {
    const code = bindInput.trim().toUpperCase()
    if (code.length !== 6) return

    setBinding(true)
    setBindError('')

    const result = await bindFriendByCode(code, userId)
    if (result.success && result.friend) {
      onBindFriend(petIndex, result.friend)
      setBindInput('')
      setExpandedCard(null)
    } else {
      setBindError(result.error || '绑定失败')
    }

    setBinding(false)
  }

  const getPetImageSrc = (pet: PetData): string => {
    if (pet.image_id) {
      return petImages.get(pet.image_id) || pet.image_data
    }
    return pet.image_data
  }

  return (
    <div className="pet-gallery">
      {/* 我的配对码 */}
      <div className="my-code-section">
        <span className="my-code-label">我的配对码：</span>
        <span className="my-code-value">{friendCode}</span>
        <span className="my-code-hint">分享给朋友，让TA绑定你</span>
      </div>

      {/* 宠物卡片列表 */}
      <div className="pet-cards">
        {pets.map((pet, i) => (
          <div
            key={pet.id}
            className={`pet-card ${i === activeIndex ? 'pet-card-active' : ''}`}
            onClick={() => onSelect(i)}
          >
            <div className="pet-card-main">
              <img src={getPetImageSrc(pet)} alt={pet.name} className="pet-card-avatar" />
              <div className="pet-card-info">
                {/* 可编辑名称 */}
                {editingName === i ? (
                  <div className="pet-card-name-edit" onClick={e => e.stopPropagation()}>
                    <input
                      className="pet-card-name-input"
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveName(i) }}
                      onBlur={() => saveName(i)}
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div
                    className="pet-card-name"
                    onClick={e => { e.stopPropagation(); startEditName(i, pet.name) }}
                    title="点击修改名称"
                  >
                    {pet.name} ✏️
                  </div>
                )}

                {/* 好友绑定状态 */}
                {pet.friend ? (
                  <div className="pet-card-friend">
                    🔗 {pet.friend.nickname}
                  </div>
                ) : (
                  <div className="pet-card-no-friend">未绑定好友</div>
                )}

                {/* 动作按钮行 */}
                <div className="pet-card-actions" onClick={e => e.stopPropagation()}>
                  <button
                    className="pet-card-action-btn"
                    onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                    disabled={!isOnline}
                    title={isOnline ? undefined : '离线模式不可用'}
                  >
                    {pet.friend ? '换绑' : '绑定'}
                  </button>
                  <button className="pet-card-action-btn" onClick={() => onEditPet(i)}>
                    修改
                  </button>
                  {pets.length > 1 && (
                    confirmDelete === i ? (
                      <div className="pet-card-delete-confirm">
                        <button className="pet-card-delete-yes" onClick={() => { onDelete(i); setConfirmDelete(null) }}>确定删</button>
                        <button className="pet-card-action-btn" onClick={() => setConfirmDelete(null)}>取消</button>
                      </div>
                    ) : (
                      <button
                        className="pet-card-action-btn pet-card-delete-btn"
                        onClick={() => setConfirmDelete(i)}
                      >
                        删除
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* 展开的绑定区域 */}
            {expandedCard === i && (
              <div className="pet-card-bind-section" onClick={e => e.stopPropagation()}>
                {pet.friend && (
                  <div className="pet-card-bind-current">
                    <span>当前绑定：{pet.friend.nickname}</span>
                    <button className="pet-card-unbind-btn" onClick={() => { onUnbindFriend(i); setExpandedCard(null) }}>
                      解除绑定
                    </button>
                  </div>
                )}
                <div className="pet-card-bind-row">
                  <input
                    className="pet-card-bind-input"
                    value={bindInput}
                    onChange={e => setBindInput(e.target.value.toUpperCase())}
                    placeholder="输入朋友的6位配对码"
                    maxLength={6}
                  />
                  <button
                    className="pet-card-bind-btn"
                    onClick={() => handleBind(i)}
                    disabled={bindInput.trim().length !== 6 || binding}
                  >
                    {binding ? '...' : '绑定'}
                  </button>
                </div>
                {bindError && <div className="pet-card-bind-error">{bindError}</div>}
              </div>
            )}
          </div>
        ))}

        {/* 创建新宠物卡片 */}
        {pets.length < 3 && (
          <div className="pet-card pet-card-new" onClick={onCreateNew}>
            <div className="pet-card-new-inner">
              <span className="pet-card-new-icon">+</span>
              <span className="pet-card-new-text">养一只新宠物</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
