'use server'

import { createClient } from '@/utils/supabase/server'

export async function sendMessage(roomId: string, messageText: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('messages').insert({
    room_id: roomId,
    user_id: user.id,
    message_text: messageText,
  })

  if (error) throw new Error(error.message)
}

export async function getMessages(roomId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('messages')
    .select('*, users(id, name, avatar_url)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) return []
  return data
}
