import { useState, useEffect, useCallback, useRef } from 'react'
import type { AnimationState } from '../core/types'
import type { ChatMessage } from '../core/types'
import {
  subscribeMessages,
  sendMessage,
  markReadAndDelete,
  type PetMessage,
} from '../lib/realtime'
import { isOnline } from '../lib/supabase'

interface UseMessagingOptions {
  userId: string
  friendId: string | null
  onFriendState: (state: AnimationState) => void
  onAddChat: (msg: ChatMessage) => void
}

export function useMessaging({ userId, friendId, onFriendState, onAddChat }: UseMessagingOptions) {
  const [unreadMessages, setUnreadMessages] = useState<PetMessage[]>([])
  const listeningRef = useRef(false)

  useEffect(() => {
    if (!userId || listeningRef.current) return
    listeningRef.current = true

    subscribeMessages(userId,
      (msg) => {
        if (msg.pet_state) {
          onFriendState(msg.pet_state as AnimationState)
          setTimeout(() => onFriendState('idle'), 10000)
        }
        setUnreadMessages(prev => [...prev, msg])
        // 保存到历史
        onAddChat({
          id: msg.id,
          from_user: msg.from_user,
          to_user: msg.to_user,
          content: msg.content,
          pet_state: msg.pet_state,
          timestamp: Date.now(),
        })
      },
      (update) => {
        if (update.set_by !== userId) {
          onFriendState(update.state as AnimationState)
        }
      }
    )
  }, [userId, onFriendState, onAddChat])

  const send = useCallback(async (text: string, state: AnimationState) => {
    const targetId = friendId || userId
    if (isOnline) {
      await sendMessage(userId, targetId, text, state)
    }
    // 保存自己发的到历史
    onAddChat({
      id: crypto.randomUUID(),
      from_user: userId,
      to_user: targetId,
      content: text,
      pet_state: state,
      timestamp: Date.now(),
    })
  }, [userId, friendId, onAddChat])

  const popUnread = useCallback(async () => {
    if (unreadMessages.length === 0) return null
    const msg = unreadMessages[0]
    if (isOnline) {
      await markReadAndDelete(msg.id)
    }
    setUnreadMessages(prev => prev.slice(1))
    return msg
  }, [unreadMessages])

  return {
    unreadMessages,
    unreadCount: unreadMessages.length,
    send,
    popUnread,
  }
}
