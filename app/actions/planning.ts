'use server'

import { createClient } from '@/utils/supabase/server'
import { generatePollOptions } from '@/lib/gemini'
import { revalidatePath } from 'next/cache'

const PLANNING_QUESTIONS = [
  { question_type: 'city', question_text: 'Which city are you planning to explore?', sort_order: 0 },
  { question_type: 'areas', question_text: 'Any specific areas or neighbourhoods you prefer? (optional)', sort_order: 1 },
  { question_type: 'availability', question_text: 'What time are you available? (e.g. 10am-8pm)', sort_order: 2 },
  { question_type: 'transport', question_text: 'How will you get around? (car / bike / public transport / walking)', sort_order: 3 },
  { question_type: 'budget', question_text: 'What is your budget per person? (e.g. ₹500-1000)', sort_order: 4 },
  { question_type: 'preferences', question_text: 'What activities do you enjoy? (cafes, gaming, movies, outdoor, shopping…)', sort_order: 5 },
  { question_type: 'constraints', question_text: 'Any dietary restrictions, allergies, or things to avoid?', sort_order: 6 },
]

export async function startPlanningSession(roomId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Create session
  const { data: session, error } = await supabase
    .from('planning_sessions')
    .insert({ room_id: roomId, started_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Insert standard questions
  await supabase.from('questions').insert(
    PLANNING_QUESTIONS.map((q) => ({ ...q, planning_session_id: session.id }))
  )

  // Update room status
  await supabase.from('rooms').update({ status: 'planning' }).eq('id', roomId)

  revalidatePath(`/room/${roomId}`)
  return session
}

export async function getPlanningSession(roomId: string) {
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('planning_sessions')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!session) return null

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('planning_session_id', session.id)
    .order('sort_order')

  return { session, questions: questions || [] }
}

export async function submitAnswers(
  sessionId: string,
  questionAnswerPairs: Array<{ question_id: string; answer_json: Record<string, string> }>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const inserts = questionAnswerPairs.map((qa) => ({
    question_id: qa.question_id,
    user_id: user.id,
    answer_json: qa.answer_json,
  }))

  const { error } = await supabase
    .from('answers')
    .upsert(inserts, { onConflict: 'question_id,user_id' })

  if (error) throw new Error(error.message)
  revalidatePath(`/room`)
}

export async function getUserAnswers(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .eq('planning_session_id', sessionId)

  if (!questions?.length) return []

  const questionIds = questions.map((q) => q.id)
  const { data: answers } = await supabase
    .from('answers')
    .select('*')
    .eq('user_id', user.id)
    .in('question_id', questionIds)

  return answers || []
}

export async function getAllAnswersForSession(sessionId: string) {
  const supabase = await createClient()

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('planning_session_id', sessionId)
    .order('sort_order')

  if (!questions?.length) return { questions: [], answers: [] }

  const questionIds = questions.map((q) => q.id)
  const { data: answers } = await supabase
    .from('answers')
    .select('*, users(name, email)')
    .in('question_id', questionIds)

  return { questions, answers: answers || [] }
}

export async function generateAndSavePolls(sessionId: string, roomId: string) {
  const supabase = await createClient()

  // Get all answers with questions
  const { questions, answers } = await getAllAnswersForSession(sessionId)

  const flatAnswers = answers.map((a: any) => {
    const q = questions.find((q: any) => q.id === a.question_id)
    return {
      user: (a.users as any)?.name || 'Anonymous',
      question: q?.question_text || '',
      answer: (a.answer_json as any)?.value || '',
    }
  })

  const city = flatAnswers.find((a) => a.question.includes('city'))?.answer || ''

  const polls = await generatePollOptions({ city, answers: flatAnswers })

  // Save polls to DB
  const pollInserts = polls.map((p) => ({
    planning_session_id: sessionId,
    title: p.title,
    options_json: p.options,
  }))

  const { error } = await supabase.from('polls').insert(pollInserts)
  if (error) throw new Error(error.message)

  // Update session status
  await supabase.from('planning_sessions').update({ status: 'polling' }).eq('id', sessionId)

  revalidatePath(`/room/${roomId}`)
}

export async function getPolls(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: polls } = await supabase
    .from('polls')
    .select('*')
    .eq('planning_session_id', sessionId)
    .order('created_at')

  if (!polls) return []

  const pollIds = polls.map((p) => p.id)
  const { data: votes } = await supabase
    .from('poll_votes')
    .select('*')
    .in('poll_id', pollIds)

  return polls.map((poll) => ({
    ...poll,
    votes: (votes || []).filter((v) => v.poll_id === poll.id),
    userVote: (votes || []).find((v) => v.poll_id === poll.id && v.user_id === user?.id)?.selected_option ?? null,
  }))
}

export async function submitVote(pollId: string, selectedOption: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('poll_votes').upsert(
    { poll_id: pollId, user_id: user.id, selected_option: selectedOption },
    { onConflict: 'poll_id,user_id' }
  )

  if (error) throw new Error(error.message)
}
