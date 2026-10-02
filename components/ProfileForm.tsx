'use client'
import TextField from '@/components/TextField'
import ImageField from '@/components/ImageField'
import type { Profile } from '@/lib/db'
import { updateProfile } from '@/serverActions/profile'

interface Props {
  profile: Profile
}

export default function ProfileForm({ profile }: Props) {
  return (
    <form action={updateProfile}>
      <TextField
        name="username"
        defaultValue={profile?.username}
      />
      <ImageField name="avatar" />
      <button type="submit">저장</button>
    </form>
  )
}
