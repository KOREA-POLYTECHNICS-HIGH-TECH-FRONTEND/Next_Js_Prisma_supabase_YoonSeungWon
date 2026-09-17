import { signInWithGoogle } from '@/serverActions/auth'

export default function SigninPage() {
  return (
    <>
      <form action={signInWithGoogle}>
        <button type="submit">구글 계정으로 로그인</button>
      </form>
    </>
  )
}
