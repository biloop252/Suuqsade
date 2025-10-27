import { NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export function createRequestClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || ''
  const token = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7)
    : ''

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }
  })
}

export async function getAuthenticatedUserId(request: NextRequest): Promise<string> {
  const supabase = createRequestClient(request)
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user?.id) {
    throw new Error('UNAUTHORIZED')
  }
  return data.user.id
}


