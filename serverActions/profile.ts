'use server'
import { revalidatePath } from 'next/cache'
import { table } from '@/prisma/db'
import { getProfile } from '@/lib/db'
import { uploadImage } from '@/lib/storage'

export async function updateProfile(formData: FormData) {
  const profile = await getProfile()
  const username = formData.get('username') as string
  const avatar = formData.get('avatar') as File
  const avatarUrl = await uploadImage(avatar, `${profile?.id}/avatar`)

  await table.Profiles.where({ id: profile?.id }).update({
    username,
    avatarUrl
  })

  revalidatePath('/', 'layout')
}
