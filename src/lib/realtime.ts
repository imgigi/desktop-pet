import { supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface PetMessage {
  id: string
  from_user: string
  to_user: string
  content: string
  pet_state: string
  created_at: string
}

export interface PetStateUpdate {
  owner_id: string
  set_by: string
  state: string
}

let channel: RealtimeChannel | null = null

export function subscribeMessages(
  userId: string,
  onMessage: (msg: PetMessage) => void,
  onStateChange: (update: PetStateUpdate) => void
) {
  if (!supabase) return

  // 清理旧 channel，防止泄漏
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }

  channel = supabase
    .channel(`user:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `to_user=eq.${userId}`,
      },
      (payload) => onMessage(payload.new as PetMessage)
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pet_states',
        filter: `owner_id=eq.${userId}`,
      },
      (payload) => onStateChange(payload.new as PetStateUpdate)
    )
    .subscribe()
}

export function unsubscribe() {
  if (channel && supabase) {
    supabase.removeChannel(channel)
    channel = null
  }
}

export async function sendMessage(
  fromUser: string,
  toUser: string,
  content: string,
  petState: string = 'idle'
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: '离线模式无法发送' }
  const { error } = await supabase.from('messages').insert({
    from_user: fromUser,
    to_user: toUser,
    content,
    pet_state: petState,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function markReadAndDelete(messageId: string) {
  if (!supabase) return
  await supabase.from('messages').delete().eq('id', messageId)
}

export async function setPetState(ownerId: string, setBy: string, state: string) {
  if (!supabase) return
  await supabase.from('pet_states').upsert(
    { owner_id: ownerId, set_by: setBy, state },
    { onConflict: 'owner_id' }
  )
}
