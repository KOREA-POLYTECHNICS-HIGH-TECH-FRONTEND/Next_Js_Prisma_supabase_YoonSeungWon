import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 서버(서버 컴포넌트, 서버 액션, 라우트 핸들러)에서 쓰는 Supabase 클라이언트
//
// 두 값 모두 브라우저에 노출되어도 되는 값이라 NEXT_PUBLIC_ 접두사를 붙였습니다.
// Publishable 키는 프로젝트를 가리킬 뿐이고, 실제 사용자 신원은 쿠키에 담긴 액세스 토큰이 증명합니다.
//
// 브라우저용 클라이언트는 이 파일에 둘 수 없습니다.
// next/headers 를 가져오는 순간 클라이언트 컴포넌트에서 못 쓰게 되어 lib/supabase/client.ts 로 나눠 두었습니다.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      // @supabase/ssr 은 세션을 브라우저 저장소가 아니라 쿠키에 둡니다.
      // 쿠키를 어떻게 읽고 쓸지는 프레임워크마다 달라서 이렇게 직접 연결해 줍니다.
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // 서버 컴포넌트에서는 쿠키를 수정할 수 없습니다.
            // 세션 갱신은 Proxy(proxy.ts)에서 처리하므로 무시합니다.
          }
        }
      }
    }
  )
}
