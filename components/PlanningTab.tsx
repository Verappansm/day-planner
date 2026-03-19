'use client'

import { useState, useTransition } from 'react'
import { submitAnswers, generateAndSavePolls, submitVote } from '@/app/actions/planning'
import { useRouter } from 'next/navigation'

export default function PlanningTab({
  room, sessionData, polls, currentUser, myRole
}: {
  room: any
  sessionData: any
  polls: any[]
  currentUser: any
  myRole: string
}) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [votingPollId, setVotingPollId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  if (!sessionData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-2xl">⏳</div>
        <p className="text-gray-600 font-medium">Planning hasn't started yet</p>
        <p className="text-gray-400 text-sm mt-1">The room admin needs to click "Start Planning" in the Lobby tab</p>
      </div>
    )
  }

  const { session, questions } = sessionData
  const isPolling = session.status === 'polling'
  const isAdmin = myRole === 'admin'

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmitAnswers() {
    const pairs = questions.map((q: any) => ({
      question_id: q.id,
      answer_json: { value: answers[q.id] || '' },
    }))
    startTransition(async () => {
      await submitAnswers(session.id, pairs)
      setSubmitted(true)
    })
  }

  async function handleGeneratePolls() {
    setIsGenerating(true)
    try {
      await generateAndSavePolls(session.id, room.id)
      router.refresh()
    } catch (e) {
      alert('Failed to generate polls. Ensure your Gemini API key is configured.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleVote(pollId: string, option: string) {
    setVotingPollId(pollId)
    await submitVote(pollId, option)
    router.refresh()
    setVotingPollId(null)
  }

  if (isPolling) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Vote on Options</h2>
          <p className="text-gray-500 text-sm mt-1">Cast your votes below</p>
        </div>

        {polls.map((poll) => {
          const options: any[] = poll.options_json || []
          const totalVotes = poll.votes?.length || 0

          return (
            <div key={poll.id} className="bg-white border border-gray-100 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{poll.title}</h3>
              <div className="space-y-2.5">
                {options.map((opt: any) => {
                  const voteCount = poll.votes?.filter((v: any) => v.selected_option === opt.id).length || 0
                  const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
                  const isMyVote = poll.userVote === opt.id

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleVote(poll.id, opt.id)}
                      disabled={votingPollId === poll.id}
                      className={`w-full text-left rounded-xl border p-3.5 transition-all relative overflow-hidden ${
                        isMyVote ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gray-900 opacity-5 origin-left transition-transform"
                        style={{ transform: `scaleX(${pct / 100})` }} />
                      <div className="relative flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{opt.label}</p>
                          {opt.description && <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>}
                        </div>
                        <span className="text-sm text-gray-500 ml-3 whitespace-nowrap">
                          {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                          {isMyVote && <span className="ml-1 text-gray-900">✓</span>}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Answers submitted!</h2>
          <p className="text-gray-500 text-sm">Waiting for everyone else to complete their answers.</p>

          {isAdmin && (
            <button
              onClick={handleGeneratePolls}
              disabled={isGenerating}
              className="mt-6 bg-gray-900 text-white font-medium px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Generating with AI…' : '⚡ Generate Polls with AI'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Planning Questions</h2>
        <p className="text-gray-500 text-sm mt-1">Answer these to help the AI plan your day</p>
      </div>

      {questions.map((q: any, i: number) => (
        <div key={q.id} className="bg-white border border-gray-100 rounded-2xl p-5">
          <label className="block text-sm font-medium text-gray-900 mb-3">
            <span className="text-gray-400 mr-2">Q{i + 1}.</span>
            {q.question_text}
          </label>
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-800 placeholder:text-gray-400"
            rows={2}
            placeholder="Your answer…"
            value={answers[q.id] || ''}
            onChange={(e) => handleAnswer(q.id, e.target.value)}
          />
        </div>
      ))}

      <button
        onClick={handleSubmitAnswers}
        disabled={isPending}
        className="w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Submitting…' : 'Submit My Answers →'}
      </button>
    </div>
  )
}
