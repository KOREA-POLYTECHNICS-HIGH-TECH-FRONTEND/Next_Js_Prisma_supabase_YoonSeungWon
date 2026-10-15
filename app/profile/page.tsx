import { getProfile } from '@/lib/db'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'

export default async function ProfilePage() {
  const profile = await getProfile()
  if (!profile) redirect('/signin')

  return (
    <>
      <ProfileForm profile={profile} />
    </>
  )
}
