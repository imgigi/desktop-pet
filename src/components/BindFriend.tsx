import { useState, useCallback } from 'react'
import type { FriendInfo } from '../core/types'
import { isOnline } from '../lib/supabase'
import { bindFriendByCode } from '../lib/friend'

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

    const result = await bindFriendByCode(code, userId)
    if (result.success && result.friend) {
      onFriendBound(result.friend)
      setBindInput('')
    } else {
      setError(result.error || '绑定失败')
    }

    setBinding(false)
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
            {!isOnline && (
              <div className="bind-error">当前离线，绑定功能需要联网</div>
            )}
            <div className="bind-input-row">
              <input
                className="bind-code-input"
                value={bindInput}
                onChange={e => setBindInput(e.target.value.toUpperCase())}
                placeholder="6位配对码"
                maxLength={6}
                disabled={!isOnline}
              />
              <button
                className="setup-btn primary bind-submit-btn"
                onClick={handleBind}
                disabled={bindInput.trim().length !== 6 || binding || !isOnline}
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
