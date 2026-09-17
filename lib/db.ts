import 'server-only'
import { db } from '@/prisma/db'

export async function getProfile(userId: string) {
  const row = await db.orm.public.Profiles.select(
    'id',
    'username',
    'avatarUrl',
    'role',
    'createdAt'
  ).first({ id: userId })

  if (!row) return null

  return {
    ...row
  }
}
