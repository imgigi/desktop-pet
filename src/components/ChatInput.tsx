import { useState, useRef } from 'react'
import type { AnimationState, PetData } from '../core/types'

const STATE_OPTIONS: { key: AnimationState; emoji: string; label: string }[] = [
  { key: 'idle', emoji: '✦', label: '休闲' },
  { key: 'dance', emoji: '♪', label: '跳舞' },
  { key: 'wave', emoji: '✿', label: '招手' },
  { key: 'bounce', emoji: '❤', label: '弹跳' },
  { key: 'faint', emoji: '💫', label: '晕倒' },
]

interface Props {
  onSend: (text: string, petState: AnimationState) => void
  onStatePreview?: (state: AnimationState) => void
  pets?: PetData[]
  activePetIndex?: number
  onSwitchPet?: (index: number) => void
}

export default function ChatInput({ onSend, onStatePreview, pets, activePetIndex = 0, onSwitchPet }: Props) {
  const [text, setText] = useState('')
  const [petState, setPetState] = useState<AnimationState>('idle')
  const [showStates, setShowStates] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentStateInfo = STATE_OPTIONS.find(s => s.key === petState)!

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed, petState)
    setText('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleStateSelect = (key: AnimationState) => {
    setPetState(key)
    setShowStates(false)
    inputRef.current?.focus()
    // 选择状态时预览动画3秒
    if (key !== 'idle' && onStatePreview) {
      onStatePreview(key)
    }
  }

  return (
    <div className="chat-input-area">
      {showStates && (
        <div className="state-picker">
          {STATE_OPTIONS.map(({ key, emoji, label }) => (
            <button
              key={key}
              className={`state-option ${petState === key ? 'active' : ''}`}
              onClick={() => handleStateSelect(key)}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 宠物切换面板 */}
      {showSwitcher && pets && pets.length > 1 && (
        <div className="pet-switcher-panel">
          {pets.map((pet, i) => (
            <button
              key={pet.id}
              className={`pet-switcher-item ${i === activePetIndex ? 'active' : ''}`}
              onClick={() => {
                onSwitchPet?.(i)
                setShowSwitcher(false)
              }}
            >
              <img src={pet.image_data} alt={pet.name} className="pet-switcher-img" />
              <span className="pet-switcher-name">{pet.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-wrap">
        <button
          className="state-inline-btn"
          onClick={() => { setShowStates(!showStates); setShowSwitcher(false) }}
          title="选择动作状态"
        >
          {currentStateInfo.emoji}
        </button>
        <input
          ref={inputRef}
          className="chat-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="说点什么..."
          maxLength={200}
        />
        {/* 宠物切换按钮 */}
        {pets && pets.length > 1 && (
          <button
            className="pet-switch-btn"
            onClick={() => { setShowSwitcher(!showSwitcher); setShowStates(false) }}
            title="切换宠物"
          >
            🔄
          </button>
        )}
      </div>
    </div>
  )
}
