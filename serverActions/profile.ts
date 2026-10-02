'use server'
import { table } from '@/prisma/db'
import { getProfile } from '@/lib/db'
import { uploadImage } from '@/lib/storage'

export async function updateProfile(formData: FormData) {
  const profile = await getProfile()
  const username = formData.get('username') as string
  const avatar = formData.get('avatar') as File

  // 1. 아바타 이미지 파일을 스토리지에 저장
  const avatarUrl = await uploadImage(avatar, `${profile?.id}/avatar`)

  // 2. 반환된 주소를 DB에 저장
  await table.Profiles.where({ id: profile?.id }).update({
    username,
    avatarUrl
  })
}
