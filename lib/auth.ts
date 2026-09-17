import 'server-only'
import { createClient } from './supabase/server'

export async function getUserId() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims.sub || null
}

export async function requireUserId() {}
