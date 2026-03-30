import type { FriendInfo } from '../core/types'
import { supabase, isOnline } from './supabase'
import { getDefaultBones } from '../core/skeleton'

export interface BindResult {
  success: boolean
  friend?: FriendInfo
  error?: string
}

export async function bindFriendByCode(code: string, userId: string): Promise<BindResult> {
  if (!isOnline) {
    return { success: false, error: '当前处于离线模式，无法绑定好友' }
  }

  try {
    // 先确保自己的记录存在于 Supabase
    const localData = localStorage.getItem('desktop-pet-user')
    if (localData) {
      const me = JSON.parse(localData)
      await supabase!.from('users').upsert(
        {
          id: me.id,
          friend_code: me.friend_code,
          nickname: me.nickname || null,
        },
        { onConflict: 'id' }
      )
    }

    const { data, error } = await supabase!
      .from('users')
      .select('id, nickname, friend_code, pet_image_data, pet_bones')
      .eq('friend_code', code)
      .maybeSingle()

    if (error) {
      console.error('[friend] lookup error:', error.message)
      return { success: false, error: '查询失败，请检查网络连接' }
    }

    if (!data) {
      return { success: false, error: '找不到这个配对码，确认对方已打开过应用？' }
    }

    if (data.id === userId) {
      return { success: false, error: '不能绑定自己哦' }
    }

    const friend: FriendInfo = {
      id: data.id,
      nickname: data.nickname || code,
      pet_image_data: data.pet_image_data,
      pet_bones: data.pet_bones || getDefaultBones(),
    }

    // 记录好友关系
    await supabase!.from('friendships').upsert(
      { user_a: userId, user_b: data.id },
      { onConflict: 'user_a,user_b' }
    )

    return { success: true, friend }
  } catch (e) {
    console.error('[friend] bind error:', e)
    return { success: false, error: '绑定失败，稍后再试试' }
  }
}
