'use client'

import { useState } from 'react'
import LobbyTab from './LobbyTab'
import PlanningTab from './PlanningTab'
import ChatTab from './ChatTab'
import ItineraryTab from './ItineraryTab'

const TABS = ['Lobby', 'Planning', 'Chat', 'Itinerary'] as const
type Tab = typeof TABS[number]

export default function RoomTabs({
  room, members, currentUser, myRole, sessionData, polls, initialMessages, itinerary
}: {
  room: any
  members: any[]
  currentUser: any
  myRole: string
  sessionData: any
  polls: any[]
  initialMessages: any[]
  itinerary: any
}) {
  const [activeTab, setActiveTab] = useState<Tab>('Lobby')

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8 pb-20">
      {/* Room Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <a href="/dashboard" className="hover:text-gray-600 transition-colors">Dashboard</a>
          <span>/</span>
          <span className="text-gray-700 font-medium">{room.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
          <button
            onClick={() => { navigator.clipboard.writeText(room.id); }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-mono border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 transition-all"
            title="Click to copy Room ID"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {room.id.slice(0, 8)}…
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'Lobby' && (
        <LobbyTab room={room} members={members} currentUser={currentUser} myRole={myRole} sessionData={sessionData} />
      )}
      {activeTab === 'Planning' && (
        <PlanningTab room={room} sessionData={sessionData} polls={polls} currentUser={currentUser} myRole={myRole} />
      )}
      {activeTab === 'Chat' && (
        <ChatTab roomId={room.id} currentUser={currentUser} initialMessages={initialMessages} />
      )}
      {activeTab === 'Itinerary' && (
        <ItineraryTab itinerary={itinerary} sessionData={sessionData} roomId={room.id} myRole={myRole} />
      )}
    </div>
  )
}
