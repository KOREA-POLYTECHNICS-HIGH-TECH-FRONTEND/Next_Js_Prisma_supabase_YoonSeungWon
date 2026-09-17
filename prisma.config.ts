import { config } from 'dotenv'
import { definePrismaConfig } from 'prisma/config'
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config'

// Prisma CLI는 환경 변수를 자동으로 읽지 않습니다.
// Next.js가 사용하는 .env.local 을 먼저 읽도록 직접 지정합니다.
config({ path: ['.env.local', '.env'], quiet: true })

export default definePrismaConfig({
  // 코딩 에이전트용 스킬 파일은 설치하지 않습니다. 없으면 CLI가 매번 경고를 냅니다.
  skills: {
    agents: []
  },
  orm: ormConfig({
    // 데이터 계약의 원본 파일입니다.
    contract: './prisma/contract.prisma',
    db: {
      // contract infer 같은 CLI 명령은 Transaction pooler를 거치지 않는 DIRECT_URL을 사용합니다.
      connection: process.env.DIRECT_URL ?? process.env.DATABASE_URL
    }
  })
})
