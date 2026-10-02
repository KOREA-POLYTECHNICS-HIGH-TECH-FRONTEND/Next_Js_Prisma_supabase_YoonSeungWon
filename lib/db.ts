import 'server-only'
import { table } from '@/prisma/db'
import { createClient } from './supabase/server'

export async function getUserId() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return data?.claims.sub || null
}

export async function getProfile() {
  const userId = await getUserId()
  if (!userId) return null

  const row = await table.Profiles.select(
    'id',
    'username',
    'avatarUrl',
    'role'
  ).first({ id: userId })

  if (!row) return null

  return {
    ...row
  }
}

export type Profile = Awaited<ReturnType<typeof getProfile>>
