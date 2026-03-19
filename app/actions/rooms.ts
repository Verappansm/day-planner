'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRoom(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: room, error } = await supabase
    .from('rooms')
    .insert({ name, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Automatically add creator as admin
  await supabase.from('room_members').insert({
    room_id: room.id,
    user_id: user.id,
    role: 'admin',
  })

  revalidatePath('/dashboard')
  return room
}

export async function joinRoom(roomId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if room exists
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, name, status')
    .eq('id', roomId)
    .single()

  if (roomError || !room) throw new Error('Room not found')

  // Check if already a member
  const { data: existing } = await supabase
    .from('room_members')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()

  if (existing) return room // already a member, just navigate

  const { error } = await supabase.from('room_members').insert({
    room_id: roomId,
    user_id: user.id,
    role: 'member',
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  return room
}

export async function getUserRooms() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('room_members')
    .select(`
      role,
      joined_at,
      rooms (
        id,
        name,
        status,
        created_by,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  if (error) return []
  return data
}

export async function getRoomDetails(roomId: string) {
  const supabase = await createClient()

  const [{ data: room }, { data: members }] = await Promise.all([
    supabase.from('rooms').select('*').eq('id', roomId).single(),
    supabase
      .from('room_members')
      .select('*, users(id, name, email, avatar_url)')
      .eq('room_id', roomId),
  ])

  return { room, members: members || [] }
}

export async function updateRoomStatus(roomId: string, status: 'waiting' | 'planning' | 'finalized') {
  const supabase = await createClient()
  const { error } = await supabase
    .from('rooms')
    .update({ status })
    .eq('id', roomId)
  if (error) throw new Error(error.message)
  revalidatePath(`/room/${roomId}`)
}
