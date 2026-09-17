import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 요청마다 Supabase 세션을 갱신합니다.
//
// 액세스 토큰은 수명이 짧아서(기본 1시간) 그대로 두면 만료됩니다.
// 아래 getClaims() 호출이 만료가 임박한 토큰을 자동으로 새로 발급받고,
// 새 토큰을 응답 쿠키에 실어 브라우저와 서버가 계속 같은 세션을 보게 합니다.
//
// 여기서 클라이언트를 직접 만드는 이유는 쿠키를 다루는 방식이 다르기 때문입니다.
// lib/supabase/server.ts 의 createClient 는 next/headers 의 쿠키를 읽지만,
// Proxy 는 요청과 응답을 모두 손에 쥐고 있어서 새 토큰을 응답에 실어 보낼 수 있습니다.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        }
      }
    }
  )

  // 이 호출로 만료된 세션을 갱신합니다.
  // createServerClient 와 getClaims 사이에 다른 코드를 작성하지 않아야 합니다.
  await supabase.auth.getClaims()

  return supabaseResponse
}

export const config = {
  // 정적 파일과 이미지는 세션 갱신이 필요 없으므로 제외합니다.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
