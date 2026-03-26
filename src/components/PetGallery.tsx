import { useState } from 'react'
import type { PetData, FriendInfo } from '../core/types'
import { supabase, isOnline } from '../lib/supabase'
import { getDefaultBones } from '../core/skeleton'

interface Props {
  pets: PetData[]
  activeIndex: number
  friendCode: string
  userId: string
  onSelect: (index: number) => void
  onCreateNew: () => void
  onDelete: (index: number) => void
  onBindFriend: (index: number, friend: FriendInfo) => void
  onUnbindFriend: (index: number) => void
  onEditPet: (index: number) => void
  onRenamePet: (index: number, name: string) => void
}

// 新手引导提示
const TIPS_KEY = 'desktop-pet-dismissed-tips'

function getDismissedTips(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(TIPS_KEY) || '[]'))
  } catch { return new Set() }
}

function dismissTip(id: string) {
  const tips = getDismissedTips()
  tips.add(id)
  localStorage.setItem(TIPS_KEY, JSON.stringify([...tips]))
}

export default function PetGallery({
  pets, activeIndex, friendCode, userId,
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
  const [dismissedTips, setDismissedTips] = useState(() => getDismissedTips())

  const handleDismissTip = (id: string) => {
    dismissTip(id)
    setDismissedTips(prev => new Set([...prev, id]))
  }

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

    try {
      if (!isOnline) {
        const mockFriend: FriendInfo = {
          id: 'friend-' + code,
          nickname: code,
          pet_image_data: null,
          pet_bones: getDefaultBones(),
        }
        onBindFriend(petIndex, mockFriend)
        setBindInput('')
        setExpandedCard(null)
        return
      }

      const { data } = await supabase!
        .from('users').select('*').eq('friend_code', code).single()

      if (data) {
        const fi: FriendInfo = {
          id: data.id,
          nickname: data.nickname || code,
          pet_image_data: data.pet_image_data,
          pet_bones: data.pet_bones || getDefaultBones(),
        }
        onBindFriend(petIndex, fi)
        await supabase!.from('friendships').upsert({ user_a: userId, user_b: data.id })
        setBindInput('')
        setExpandedCard(null)
      } else {
        setBindError('找不到这个配对码，再检查一下？')
      }
    } catch {
      setBindError('绑定失败，稍后再试试')
    } finally {
      setBinding(false)
    }
  }

  const showCreateTip = pets.length === 0 && !dismissedTips.has('create')
  const showChatTip = pets.length > 0 && !dismissedTips.has('chat')
  const showStateTip = pets.length > 0 && !dismissedTips.has('state')

  return (
    <div className="pet-gallery">
      {/* 新手引导 */}
      {showCreateTip && (
        <div className="onboarding-tip">
          <span className="onboarding-text">🎉 上传一张朋友的图片，把TA养成你的桌宠吧！</span>
          <button className="onboarding-dismiss" onClick={() => handleDismissTip('create')}>✕</button>
        </div>
      )}
      {showChatTip && (
        <div className="onboarding-tip">
          <span className="onboarding-text">💬 在底部输入框跟宠物说话，消息会发送给绑定的好友~</span>
          <button className="onboarding-dismiss" onClick={() => handleDismissTip('chat')}>✕</button>
        </div>
      )}
      {showStateTip && !showChatTip && (
        <div className="onboarding-tip">
          <span className="onboarding-text">✨ 发消息时点左侧图标选动作，宠物会表演给对方看！</span>
          <button className="onboarding-dismiss" onClick={() => handleDismissTip('state')}>✕</button>
        </div>
      )}

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
              <img src={pet.image_data} alt={pet.name} className="pet-card-avatar" />
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
