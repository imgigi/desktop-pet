import type { ChatMessage } from '../core/types'

interface Props {
  messages: ChatMessage[]
  userId: string
}

export default function ChatHistory({ messages, userId }: Props) {
  const sorted = [...messages].sort((a, b) => b.timestamp - a.timestamp)

  if (sorted.length === 0) {
    return (
      <div className="chat-history">
        <div className="chat-history-empty">还没有对话记录</div>
      </div>
    )
  }

  return (
    <div className="chat-history">
      {sorted.map(msg => {
        const isMine = msg.from_user === userId
        const time = new Date(msg.timestamp)
        const timeStr = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`

        return (
          <div key={msg.id} className={`chat-history-item ${isMine ? 'mine' : 'friend'}`}>
            <div className="chat-history-meta">
              <span className="chat-history-sender">{isMine ? '我' : '好友'}</span>
              <span className="chat-history-time">{timeStr}</span>
            </div>
            <div className="chat-history-content">{msg.content}</div>
          </div>
        )
      })}
    </div>
  )
}
