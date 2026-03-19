'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function signInWithGoogle() {
  const supabase = await createClient()
  const headersList = await headers()
  
  // Vercel-specific: x-forwarded-host is the most reliable way to get 
  // the domain the user is actually visiting in their browser.
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  
  // Prioritize the domain the user is currently on
  const origin = `${protocol}://${host}`

  console.log('Detected origin:', origin)
  console.log('Redirecting to:', `${origin}/auth/callback`)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('OAuth Error:', error)
    return redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  if (data.url) {
    redirect(data.url)
  }
}
