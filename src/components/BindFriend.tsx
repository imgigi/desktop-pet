import { useState, useCallback } from 'react'
import type { FriendInfo } from '../core/types'
import { supabase, isOnline } from '../lib/supabase'
import { getDefaultBones } from '../core/skeleton'

interface Props {
  friendCode: string
  userId: string
  currentFriend?: FriendInfo
  petName: string
  onFriendBound: (friend: FriendInfo) => void
  onUnbind: () => void
}

export default function BindFriend({ friendCode, userId, currentFriend, petName, onFriendBound, onUnbind }: Props) {
  const [bindInput, setBindInput] = useState('')
  const [binding, setBinding] = useState(false)
  const [error, setError] = useState('')

  const handleBind = useCallback(async () => {
    const code = bindInput.trim().toUpperCase()
    if (code.length !== 6) return

    setBinding(true)
    setError('')

    try {
      if (!isOnline) {
        const mockFriend: FriendInfo = {
          id: 'friend-' + code,
          nickname: code,
          pet_image_data: null,
          pet_bones: getDefaultBones(),
        }
        onFriendBound(mockFriend)
        setBindInput('')
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
        onFriendBound(fi)
        await supabase!.from('friendships').upsert({ user_a: userId, user_b: data.id })
        setBindInput('')
      } else {
        setError('找不到这个配对码')
      }
    } catch {
      setError('绑定失败，请重试')
    } finally {
      setBinding(false)
    }
  }, [bindInput, userId, onFriendBound])

  return (
    <div className="bind-friend-tab">
      <div className="bind-pet-label">当前宠物：{petName}</div>

      {currentFriend ? (
        <div className="bind-section-block">
          <div className="bind-success-block">
            <span>✅</span>
            <span>已绑定好友：{currentFriend.nickname}</span>
          </div>
          <button className="setup-btn unbind-btn" onClick={onUnbind}>
            解除绑定
          </button>
        </div>
      ) : (
        <>
          <div className="bind-section-block">
            <div className="bind-label">你的配对码</div>
            <div className="bind-code-display">{friendCode}</div>
            <div className="bind-hint">把配对码发给朋友，让TA输入你的码</div>
          </div>

          <div className="bind-section-block">
            <div className="bind-label">输入朋友的配对码</div>
            <div className="bind-input-row">
              <input
                className="bind-code-input"
                value={bindInput}
                onChange={e => setBindInput(e.target.value.toUpperCase())}
                placeholder="6位配对码"
                maxLength={6}
              />
              <button
                className="setup-btn primary bind-submit-btn"
                onClick={handleBind}
                disabled={bindInput.trim().length !== 6 || binding}
              >
                {binding ? '...' : '绑定'}
              </button>
            </div>
            {error && <div className="bind-error">{error}</div>}
          </div>
        </>
      )}
    </div>
  )
}
