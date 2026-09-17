import Image from 'next/image'
import { getUserId } from '@/lib/auth'
import { getProfile } from '@/lib/db'

export default async function ProfilePage() {
  const userId = await getUserId()
  if (!userId) throw new Error('인증이 되어 있지 않습니다.')
  const profile = await getProfile(userId)
  return (
    <>
      <h1>{profile?.username}</h1>
      <Image
        src={profile?.avatarUrl || ''}
        alt={profile?.username || ''}
        width={100}
        height={100}
      />
    </>
  )
}
