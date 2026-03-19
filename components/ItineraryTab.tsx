'use client'

import { useState, useTransition } from 'react'
import { generateAndSaveItinerary } from '@/app/actions/itinerary'
import { useRouter } from 'next/navigation'

export default function ItineraryTab({
  itinerary, sessionData, roomId, myRole
}: {
  itinerary: any
  sessionData: any
  roomId: string
  myRole: string
}) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const isAdmin = myRole === 'admin'

  async function handleGenerate() {
    if (!sessionData) return
    setIsGenerating(true)
    try {
      await generateAndSaveItinerary(sessionData.session.id, roomId)
      router.refresh()
    } catch (e) {
      alert('Failed to generate itinerary. Check your Gemini API key.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!sessionData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-3xl mb-3">🗓️</div>
        <p className="text-gray-500 font-medium">No planning session yet</p>
        <p className="text-gray-400 text-sm mt-1">Start planning from the Lobby tab</p>
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-3xl mb-3">✨</div>
        <p className="text-gray-700 font-semibold text-lg mb-2">Itinerary not generated yet</p>
        <p className="text-gray-400 text-sm mb-6">Once everyone has voted on the polls, the admin can generate the AI itinerary.</p>
        {isAdmin && (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-gray-900 text-white font-medium px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isGenerating ? '⚙️ Generating itinerary…' : '🤖 Generate AI Itinerary'}
          </button>
        )}
      </div>
    )
  }

  const plan = itinerary.plan_json as any

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="bg-gray-900 text-white rounded-2xl p-6">
        <p className="text-gray-400 text-sm mb-1">{plan.city} · {plan.date}</p>
        <h2 className="text-xl font-bold mb-2">{plan.summary}</h2>
        <p className="text-gray-300 text-sm leading-relaxed">{plan.reasoning}</p>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
          <div className="space-y-4">
            {(plan.timeline || []).map((item: any, i: number) => (
              <div key={i} className="relative flex gap-5 pl-10">
                <div className="absolute left-0 w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold z-10 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {item.location}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">{item.time}</span>
                      <p className="text-xs text-gray-400 mt-1">{item.duration}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  {item.notes && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5 mt-2">
                      📌 {item.notes}
                    </p>
                  )}
                  {item.attendees?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.attendees.map((a: string, j: number) => (
                        <span key={j} className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tradeoffs */}
      {plan.tradeoffs?.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Tradeoffs & Notes</h3>
          <ul className="space-y-2">
            {plan.tradeoffs.map((t: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-gray-300 mt-0.5">—</span> {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
