'use client'
import TextField from '@/components/TextField'
import ImageField from '@/components/ImageField'
import type { Profile } from '@/lib/db'
import { updateProfile } from '@/serverActions/profile'
import Image from 'next/image'
import { useState } from 'react'

interface Props {
  profile: Profile
}

export default function ProfileForm({ profile }: Props) {
  const [username, setUsername] = useState(profile?.username)
  const [avatar, setAvatar] = useState<File | null>(null)
  const avatarUrl = avatar
    ? URL.createObjectURL(avatar)
    : profile?.avatarUrl || ''

  return (
    <>
      <h1>{username}</h1>
      <Image
        src={avatarUrl}
        alt={profile?.username || ''}
        width={100}
        height={100}
      />
      <form action={updateProfile}>
        <TextField
          name="username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <ImageField
          name="avatar"
          maxCount={1}
          onChange={files => setAvatar(files[0])}
        />
        <button type="submit">저장</button>
      </form>
    </>
  )
}
