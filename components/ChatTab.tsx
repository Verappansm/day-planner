'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { sendMessage } from '@/app/actions/chat'
import { createClient } from '@/utils/supabase/client'

export default function ChatTab({
  roomId, currentUser, initialMessages
}: {
  roomId: string
  currentUser: any
  initialMessages: any[]
}) {
  const [messages, setMessages] = useState<any[]>(initialMessages)
  const [text, setText] = useState('')
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Subscribe to realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`room-chat-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          // Fetch the user info for the new message
          const { data: user } = await supabase
            .from('users')
            .select('id, name, avatar_url')
            .eq('id', payload.new.user_id)
            .single()

          setMessages((prev) => [...prev, { ...payload.new, users: user }])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  function handleSend() {
    if (!text.trim()) return
    const msgText = text.trim()
    setText('')
    startTransition(async () => {
      await sendMessage(roomId, msgText)
    })
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[400px] bg-white border border-gray-100 rounded-2xl overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-3xl mb-2">💬</span>
            <p className="text-gray-400 text-sm">No messages yet. Say hello!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.user_id === currentUser?.id
          const showAvatar = i === 0 || messages[i - 1]?.user_id !== msg.user_id

          return (
            <div key={msg.id || i} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isMe && (
                <div className="w-7 h-7 flex-shrink-0">
                  {showAvatar && (
                    msg.users?.avatar_url ? (
                      <img src={msg.users.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                        {(msg.users?.name || '?')[0].toUpperCase()}
                      </div>
                    )
                  )}
                </div>
              )}

              <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isMe && showAvatar && (
                  <span className="text-[11px] text-gray-400 mb-1 ml-1">{msg.users?.name}</span>
                )}
                <div className={`rounded-2xl px-3.5 py-2 text-sm ${
                  isMe ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}>
                  {msg.message_text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 mx-1">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3 flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message…"
          className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isPending}
          className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          <svg className="w-4 h-4 text-white rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
