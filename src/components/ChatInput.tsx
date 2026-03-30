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
    if (key !== 'idle' && onStatePreview) {
      onStatePreview(key)
    }
  }

  const activePet = pets?.[activePetIndex]

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
              <span className="state-option-emoji">{emoji}</span>
              <span className="state-option-label">{label}</span>
            </button>
          ))}
        </div>
      )}

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
          className={`chat-action-btn chat-state-btn ${petState !== 'idle' ? 'has-state' : ''}`}
          onClick={() => { setShowStates(!showStates); setShowSwitcher(false) }}
          title={`动作: ${currentStateInfo.label}`}
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
        {pets && pets.length > 1 && (
          <button
            className="chat-action-btn chat-switch-btn"
            onClick={() => { setShowSwitcher(!showSwitcher); setShowStates(false) }}
            title="切换宠物"
          >
            {activePet ? (
              <img src={activePet.image_data} alt="" className="chat-switch-avatar" />
            ) : '↔'}
          </button>
        )}
        <button
          className="chat-action-btn chat-send-btn"
          onClick={handleSend}
          disabled={!text.trim()}
          title="发送"
        >
          ↑
        </button>
      </div>
    </div>
  )
}
