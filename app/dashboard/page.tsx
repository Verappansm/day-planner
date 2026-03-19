import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getUserRooms } from '@/app/actions/rooms'
import Navbar from '@/components/Navbar'
import RoomCard from '@/components/RoomCard'
import CreateRoomModal from '@/components/CreateRoomModal'
import JoinRoomModal from '@/components/JoinRoomModal'

export const metadata = { title: 'Dashboard — Day Planner' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single()
  const rooms = await getUserRooms()

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      <Navbar user={userData} />

      <main className="max-w-5xl mx-auto px-4 pt-12 pb-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Rooms</h1>
            <p className="text-gray-500 mt-1 text-sm">Plan your day out with friends</p>
          </div>
          <div className="flex items-center gap-3">
            <JoinRoomModal />
            <CreateRoomModal />
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No rooms yet</p>
            <p className="text-gray-400 text-sm mt-1">Create a room or join one with a room ID</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((r: any) => (
              <RoomCard key={r.rooms?.id} room={r.rooms} role={r.role} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
