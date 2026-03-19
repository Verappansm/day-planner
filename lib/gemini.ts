const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error: ${err}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export interface PlanningContext {
  city?: string
  answers: Array<{ user: string; question: string; answer: string }>
}

export interface PollOption {
  id: string
  label: string
  description: string
}

export interface Poll {
  title: string
  options: PollOption[]
}

export async function generatePollOptions(context: PlanningContext): Promise<Poll[]> {
  const answersText = context.answers
    .map((a) => `${a.user} — ${a.question}: ${a.answer}`)
    .join('\n')

  const prompt = `
You are a day planning assistant helping a group plan a day out in ${context.city || 'an unspecified city'}.

Here are all the group members' answers to planning questions:
${answersText}

Based on everyone's preferences, generate 2-3 polls to help the group decide on key aspects of their day.
Each poll should have a clear title and 3-4 options.

Return ONLY valid JSON in this exact format:
{
  "polls": [
    {
      "title": "Where should we eat lunch?",
      "options": [
        { "id": "opt1", "label": "Italian Restaurant", "description": "Pasta and pizza near the city centre" },
        { "id": "opt2", "label": "Street Food Market", "description": "Casual and diverse options" }
      ]
    }
  ]
}
`
  const raw = await callGemini(prompt)
  const parsed = JSON.parse(raw)
  return parsed.polls as Poll[]
}

export interface ItineraryItem {
  time: string
  title: string
  location: string
  description: string
  duration: string
  attendees: string[]
  notes?: string
}

export interface Itinerary {
  date: string
  city: string
  summary: string
  timeline: ItineraryItem[]
  tradeoffs: string[]
  reasoning: string
}

export async function generateItinerary(context: {
  city: string
  answers: PlanningContext['answers']
  pollResults: Array<{ question: string; winner: string }>
  chatSummary?: string
}): Promise<Itinerary> {
  const answersText = context.answers
    .map((a) => `${a.user} — ${a.question}: ${a.answer}`)
    .join('\n')

  const pollText = context.pollResults
    .map((p) => `${p.question}: ${p.winner}`)
    .join('\n')

  const prompt = `
You are an expert day trip planner. Create a detailed itinerary for a group visiting ${context.city}.

Group answers:
${answersText}

Group poll decisions:
${pollText}

${context.chatSummary ? `Chat summary: ${context.chatSummary}` : ''}

Create a practical, fun, hour-by-hour itinerary for the group's day out.

Return ONLY valid JSON in this format:
{
  "date": "Today",
  "city": "${context.city}",
  "summary": "A fun packed day in the city",
  "timeline": [
    {
      "time": "10:00 AM",
      "title": "Morning Coffee",
      "location": "Blue Tokai Coffee, Hauz Khas",
      "description": "Start the day with great coffee and snacks",
      "duration": "45 min",
      "attendees": ["Everyone"],
      "notes": "Check for seating availability"
    }
  ],
  "tradeoffs": ["Skipping the museum to save time", "Choosing lunch near transport hub"],
  "reasoning": "The itinerary prioritizes activities everyone agreed on while working within the budget constraints."
}
`
  const raw = await callGemini(prompt)
  return JSON.parse(raw) as Itinerary
}

export async function summarizeChat(messages: Array<{ user: string; text: string }>): Promise<string> {
  if (messages.length === 0) return ''

  const chatText = messages.map((m) => `${m.user}: ${m.text}`).join('\n')

  const prompt = `
Summarize the following group chat in 2-3 sentences, highlighting any decisions made, preferences mentioned, or important notes relevant to day planning:

${chatText}

Return ONLY a plain text summary, no JSON.
`
  return await callGemini(prompt)
}
