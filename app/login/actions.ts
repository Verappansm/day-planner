'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function signInWithGoogle() {
  const supabase = await createClient()
  const headersList = await headers()

  // Derive the real origin from request headers — works reliably on Vercel and locally.
  // x-forwarded-host is set by Vercel (and most proxies) and is always the real hostname.
  const host =
    headersList.get('x-forwarded-host') ||
    headersList.get('host') ||
    'localhost:3000'

  const proto =
    headersList.get('x-forwarded-proto') ||
    (host.startsWith('localhost') ? 'http' : 'https')

  // Allow explicit override via env var (e.g. for custom domains)
  const origin = process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
    : `${proto}://${host}`

  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (data.url) {
    redirect(data.url)
  }
}
