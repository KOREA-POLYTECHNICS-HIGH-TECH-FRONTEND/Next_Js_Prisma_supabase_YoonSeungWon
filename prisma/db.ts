import 'server-only'
import 'temporal-polyfill/full/global'
import { Pool } from 'pg'
import postgres from '@prisma/orm-postgres/runtime'
import type { Contract } from './contract.d'
import contractJson from './contract.json' with { type: 'json' }

// Prisma 8 클라이언트
//
// contract.prisma 가 원본이고, `npm run db:emit` 이 contract.json 과 contract.d.ts 를 만듭니다.
// 런타임은 이 두 파일만 읽습니다. 계약을 고치면 반드시 다시 emit 해야 합니다.
//
// 이 파일은 데이터베이스 비밀번호가 담긴 연결 문자열을 사용합니다.
// 클라이언트 컴포넌트에서 실수로 가져오면 server-only 가 빌드를 실패시킵니다.

function createDb() {
  // Supabase의 Transaction pooler는 연결 수가 넉넉하지 않으므로 풀 크기를 작게 잡습니다.
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })

  return postgres<Contract>({ contractJson, pg: pool })
}

// 개발 중에는 파일을 고칠 때마다 모듈이 다시 평가됩니다.
// 그때마다 풀을 새로 만들면 연결이 쌓이므로 globalThis 에 붙여 재사용합니다.
const globalForDb = globalThis as unknown as {
  prismaDb?: ReturnType<typeof createDb>
}

export const db = globalForDb.prismaDb ?? createDb()

if (process.env.NODE_ENV !== 'production') {
  globalForDb.prismaDb = db
}
