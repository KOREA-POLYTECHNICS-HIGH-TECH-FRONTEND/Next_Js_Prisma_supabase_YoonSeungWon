import Link from 'next/link'
import Image from 'next/image'
import { getProfile } from '@/lib/db'
import { signOut } from '@/serverActions/auth'

export default async function Header() {
  const profile = await getProfile()

  return (
    <header>
      <nav className="flex items-center gap-4">
        <Link href="/">Home</Link>
        {profile ? (
          <>
            <Image
              src={profile.avatarUrl}
              alt={profile.username}
              width={30}
              height={30}
            />
            <p>{profile.username} </p>
            <Link href="/write">글쓰기</Link>
            <Link href="/profile">프로필</Link>
            <form action={signOut}>
              <button type="submit">로그아웃</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/signin">로그인</Link>
          </>
        )}
      </nav>
    </header>
  )
}
