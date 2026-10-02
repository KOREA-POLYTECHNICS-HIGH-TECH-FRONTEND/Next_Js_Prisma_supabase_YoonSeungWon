import Image from 'next/image'
import { getProfile } from '@/lib/db'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'

export default async function ProfilePage() {
  const profile = await getProfile()
  if (!profile) redirect('/signin')

  return (
    <>
      <h1>{profile?.username}</h1>
      <Image
        src={profile?.avatarUrl || ''}
        alt={profile?.username || ''}
        width={100}
        height={100}
      />
      <ProfileForm profile={profile} />
    </>
  )
}
