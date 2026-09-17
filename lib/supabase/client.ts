import { createBrowserClient } from '@supabase/ssr'

// 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 클라이언트
//
// createBrowserClient 는 세션을 쿠키에서 읽으므로 서버와 같은 로그인 상태를 공유합니다.
// 서버용 클라이언트는 next/headers 를 가져오므로 여기에 함께 둘 수 없어 lib/supabase/server.ts 에 있습니다.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
