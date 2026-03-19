'use server'

import { createClient } from '@/utils/supabase/server'
import { generateItinerary, summarizeChat } from '@/lib/gemini'
import { getAllAnswersForSession } from './planning'
import { revalidatePath } from 'next/cache'

export async function generateAndSaveItinerary(sessionId: string, roomId: string) {
  const supabase = await createClient()

  // Get answers
  const { questions, answers } = await getAllAnswersForSession(sessionId)
  const flatAnswers = answers.map((a: any) => {
    const q = questions.find((q: any) => q.id === a.question_id)
    return {
      user: (a.users as any)?.name || 'Anonymous',
      question: q?.question_text || '',
      answer: (a.answer_json as any)?.value || '',
    }
  })

  const city = flatAnswers.find((a) => a.question.includes('city'))?.answer || 'the city'

  // Get poll results (winning option per poll)
  const { data: polls } = await supabase
    .from('polls')
    .select('*, poll_votes(*)')
    .eq('planning_session_id', sessionId)

  const pollResults = (polls || []).map((poll: any) => {
    const votes: any[] = poll.poll_votes || []
    const tally: Record<string, number> = {}
    votes.forEach((v: any) => { tally[v.selected_option] = (tally[v.selected_option] || 0) + 1 })
    const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No votes'
    return { question: poll.title, winner }
  })

  // Get chat messages for summary
  const { data: messages } = await supabase
    .from('messages')
    .select('message_text, users(name)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(50)

  const chatMessages = (messages || []).map((m: any) => ({
    user: (m.users as any)?.name || 'User',
    text: m.message_text,
  }))

  const chatSummary = chatMessages.length > 0
    ? await summarizeChat(chatMessages.reverse())
    : undefined

  // Generate itinerary
  const plan = await generateItinerary({ city, answers: flatAnswers, pollResults, chatSummary })

  // Save to DB
  const { data: saved, error } = await supabase
    .from('itinerary')
    .insert({ planning_session_id: sessionId, plan_json: plan })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Finalize session and room
  await supabase.from('planning_sessions').update({ status: 'finalized' }).eq('id', sessionId)
  await supabase.from('rooms').update({ status: 'finalized' }).eq('id', roomId)

  revalidatePath(`/room/${roomId}`)
  return saved
}

export async function getItinerary(sessionId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('itinerary')
    .select('*')
    .eq('planning_session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data
}
