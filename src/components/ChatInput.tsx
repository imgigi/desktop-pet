import { useState, useRef } from 'react'
import type { AnimationState } from '../core/types'

const STATE_OPTIONS: { key: AnimationState; emoji: string; label: string }[] = [
  { key: 'idle', emoji: '✦', label: '休闲' },
  { key: 'sleep', emoji: '☁', label: '睡觉' },
  { key: 'active', emoji: '⚡', label: '活跃' },
  { key: 'dance', emoji: '♪', label: '跳舞' },
  { key: 'wave', emoji: '✿', label: '招手' },
  { key: 'bounce', emoji: '❤', label: '弹跳' },
]

interface Props {
  onSend: (text: string, petState: AnimationState) => void
}

export default function ChatInput({ onSend }: Props) {
  const [text, setText] = useState('')
  const [petState, setPetState] = useState<AnimationState>('idle')
  const [showStates, setShowStates] = useState(false)
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

  return (
    <div className="chat-input-area">
      {showStates && (
        <div className="state-picker">
          {STATE_OPTIONS.map(({ key, emoji, label }) => (
            <button
              key={key}
              className={`state-option ${petState === key ? 'active' : ''}`}
              onClick={() => { setPetState(key); setShowStates(false); inputRef.current?.focus() }}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="chat-input-wrap">
        <button
          className="state-inline-btn"
          onClick={() => setShowStates(!showStates)}
          title="选择状态"
        >
          {currentStateInfo.emoji}
        </button>
        <input
          ref={inputRef}
          className="chat-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter 发送..."
          maxLength={200}
        />
      </div>
    </div>
  )
}
