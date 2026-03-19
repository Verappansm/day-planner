'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function signInWithGoogle() {
  const supabase = await createClient()
  const headersList = await headers()
  
  // host will be "localhost:3000" or "day-planner-amber.vercel.app"
  const host = headersList.get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  
  // Fallback to construction if NEXT_PUBLIC_SITE_URL is missing
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
    : `${protocol}://${host}`

  console.log('Redirecting to:', `${siteUrl}/auth/callback`)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
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
