import { useState } from 'react'
import type { PetData, FriendInfo } from '../core/types'

interface Props {
  pets: PetData[]
  activeIndex: number
  friendCode?: string
  onSelect: (index: number) => void
  onCreateNew: () => void
  onDelete: (index: number) => void
  onBindFriend?: (index: number, friend: FriendInfo) => void
  onUnbindFriend: (index: number) => void
  onGoBindTab: () => void
}

export default function PetGallery({
  pets, activeIndex,
  onSelect, onCreateNew, onDelete,
  onUnbindFriend, onGoBindTab,
}: Props) {
  const slots = [0, 1, 2]
  const [confirmUnbind, setConfirmUnbind] = useState<number | null>(null)

  return (
    <div className="pet-gallery">
      <div className="pet-gallery-title">我的宠物</div>
      <div className="pet-gallery-grid">
        {slots.map(i => {
          const pet = pets[i]
          if (!pet) {
            return (
              <div
                key={i}
                className="pet-slot pet-slot-empty"
                onClick={pets.length < 3 ? onCreateNew : undefined}
              >
                <span className="pet-slot-add">+</span>
              </div>
            )
          }
          return (
            <div
              key={pet.id}
              className={`pet-slot ${i === activeIndex ? 'pet-slot-active' : ''}`}
              onClick={() => onSelect(i)}
            >
              <img src={pet.image_data} alt={pet.name} className="pet-slot-img" />
              <div className="pet-slot-name">{pet.name}</div>
              {pet.friend && (
                <div className="pet-slot-friend">🔗 {pet.friend.nickname}</div>
              )}
              {pets.length > 1 && (
                <button
                  className="pet-slot-delete"
                  onClick={e => { e.stopPropagation(); onDelete(i) }}
                  title="删除"
                >
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* 当前宠物的好友绑定区域 */}
      {pets[activeIndex] && (
        <div className="gallery-friend-section">
          <div className="gallery-friend-header">
            <span className="gallery-friend-label">
              「{pets[activeIndex].name}」的好友
            </span>
          </div>

          {pets[activeIndex].friend ? (
            <div className="gallery-friend-bound">
              <div className="gallery-friend-info">
                <span className="gallery-friend-icon">🔗</span>
                <span className="gallery-friend-name">{pets[activeIndex].friend!.nickname}</span>
              </div>
              {confirmUnbind === activeIndex ? (
                <div className="gallery-unbind-confirm">
                  <span className="gallery-unbind-text">确定解除绑定？</span>
                  <button
                    className="gallery-unbind-yes"
                    onClick={e => {
                      e.stopPropagation()
                      onUnbindFriend(activeIndex)
                      setConfirmUnbind(null)
                    }}
                  >
                    确定
                  </button>
                  <button
                    className="gallery-unbind-no"
                    onClick={e => { e.stopPropagation(); setConfirmUnbind(null) }}
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  className="gallery-unbind-btn"
                  onClick={e => { e.stopPropagation(); setConfirmUnbind(activeIndex) }}
                >
                  解绑
                </button>
              )}
            </div>
          ) : (
            <div className="gallery-friend-empty">
              <span className="gallery-friend-empty-text">未绑定好友</span>
              <button
                className="gallery-bind-btn"
                onClick={e => { e.stopPropagation(); onGoBindTab() }}
              >
                去绑定
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
