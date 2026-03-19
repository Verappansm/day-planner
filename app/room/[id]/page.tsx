import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getRoomDetails } from '@/app/actions/rooms'
import { getPlanningSession, getPolls } from '@/app/actions/planning'
import { getMessages } from '@/app/actions/chat'
import { getItinerary } from '@/app/actions/itinerary'
import Navbar from '@/components/Navbar'
import RoomTabs from '@/components/RoomTabs'

export default async function RoomPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single()
  const { room, members } = await getRoomDetails(params.id)

  if (!room) notFound()

  // Check membership
  const isMember = members.some((m: any) => m.user_id === user.id)
  if (!isMember) redirect('/dashboard')

  const myRole = members.find((m: any) => m.user_id === user.id)?.role

  // Fetch all data in parallel
  const sessionData = await getPlanningSession(params.id)
  const polls = sessionData ? await getPolls(sessionData.session.id) : []
  const messages = await getMessages(params.id)
  const itinerary = sessionData ? await getItinerary(sessionData.session.id) : null

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <Navbar user={userData} />
      <RoomTabs
        room={room}
        members={members}
        currentUser={userData}
        myRole={myRole}
        sessionData={sessionData}
        polls={polls}
        initialMessages={messages}
        itinerary={itinerary}
      />
    </div>
  )
}
