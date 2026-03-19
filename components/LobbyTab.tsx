'use client'

import { useState, useTransition } from 'react'
import { startPlanningSession } from '@/app/actions/planning'
import { useRouter } from 'next/navigation'

export default function LobbyTab({
  room, members, currentUser, myRole, sessionData
}: {
  room: any
  members: any[]
  currentUser: any
  myRole: string
  sessionData: any
}) {
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  function copyRoomId() {
    navigator.clipboard.writeText(room.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleStartPlanning() {
    startTransition(async () => {
      await startPlanningSession(room.id)
      router.refresh()
    })
  }

  const isAdmin = myRole === 'admin'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Room Info */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Room Info</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <span className="text-sm text-gray-500">Room Name</span>
              <span className="text-sm font-medium text-gray-900">{room.name}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <span className="text-sm text-gray-500">Status</span>
              <span className="text-sm font-medium capitalize text-gray-900">{room.status}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <span className="text-sm text-gray-500">Members</span>
              <span className="text-sm font-medium text-gray-900">{members.length}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-gray-500">Room ID</span>
              <button
                onClick={copyRoomId}
                className="flex items-center gap-1.5 text-xs text-gray-400 font-mono hover:text-gray-700 transition-colors"
              >
                {copied ? '✓ Copied!' : room.id.slice(0, 12) + '…'}
              </button>
            </div>
          </div>
        </div>

        {/* Share Card */}
        <div className="bg-gray-900 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold mb-1">Invite others</h3>
              <p className="text-gray-400 text-sm">Share this ID with friends so they can join</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3 font-mono text-sm text-gray-300 break-all">{room.id}</div>
          <button
            onClick={copyRoomId}
            className="mt-3 w-full py-2.5 bg-white text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            {copied ? '✓ Copied to clipboard' : 'Copy Room ID'}
          </button>
        </div>
      </div>

      {/* Members + Actions */}
      <div className="space-y-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Members</h2>
          <div className="space-y-3">
            {members.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3">
                {m.users?.avatar_url ? (
                  <img src={m.users.avatar_url} alt={m.users.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                    {(m.users?.name || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.users?.name || m.users?.email}</p>
                  <p className="text-xs text-gray-400 capitalize">{m.role}</p>
                </div>
                {m.user_id === currentUser?.id && (
                  <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">You</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {isAdmin && room.status === 'waiting' && (
          <button
            onClick={handleStartPlanning}
            disabled={isPending}
            className="w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Starting…' : '🚀 Start Planning'}
          </button>
        )}

        {sessionData && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-800">Planning in progress</p>
            <p className="text-xs text-blue-600 mt-1">Go to the Planning tab to answer questions</p>
          </div>
        )}
      </div>
    </div>
  )
}
