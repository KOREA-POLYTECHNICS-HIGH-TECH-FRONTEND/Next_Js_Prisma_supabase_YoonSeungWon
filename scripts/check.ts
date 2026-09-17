// 환경 변수와 연결 상태 점검
//
// .env.local 을 채우고 npm install 을 마친 뒤 `npm run check` 로 실행합니다.
// Supabase와 Prisma(데이터베이스)를 바로 쓸 수 있는 상태인지 확인하고,
// 실패한 항목에는 어디를 고쳐야 하는지 안내합니다.
//
// 비밀번호와 키는 화면에 찍지 않습니다. 호스트와 앞 몇 글자만 보여 줍니다.
// prisma/db.ts 는 server-only 를 가져와 Next.js 밖에서 실행할 수 없으므로 여기서 직접 연결합니다.

import { styleText } from 'node:util'
import { config } from 'dotenv'
import { Client, Pool } from 'pg'
import postgres from '@prisma/orm-postgres/runtime'
import contractJson from '../prisma/contract.json' with { type: 'json' }

config({ path: ['.env.local', '.env'], quiet: true })

type Status = 'ok' | 'warn' | 'fail'
type Result = { status: Status; name: string; detail: string }

const results: Result[] = []

// 색상은 터미널일 때만 입힙니다. 파일로 저장하거나 NO_COLOR 를 설정하면 기호만 남습니다.
const paint = {
  ok: (text: string) => styleText(['bold', 'green'], text),
  warn: (text: string) => styleText(['bold', 'yellow'], text),
  fail: (text: string) => styleText(['bold', 'red'], text),
  dim: (text: string) => styleText('dim', text),
  title: (text: string) => styleText('bold', text)
}

function section(title: string) {
  console.log(`\n${paint.title(title)}\n`)
}

function report(status: Status, name: string, detail: string) {
  results.push({ status, name, detail })
  const label = { ok: '[OK]', warn: '[WARN]', fail: '[FAIL]' }[status]
  console.log(`${paint[status](label)} ${name}`)
  if (detail) console.log(`       ${paint.dim(detail)}`)
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

// 비밀번호를 가리고 사용자, 호스트, 포트만 남깁니다.
function describeConnection(raw: string) {
  const url = new URL(raw)
  return `${url.username}:****@${url.hostname}:${url.port}${url.pathname}${url.search}`
}

function hasPlaceholder(value: string) {
  return /프로젝트ID|비밀번호|리전|\.\.\./.test(value)
}

// ---------- 1. 환경 변수 ----------

type EnvName =
  | 'NEXT_PUBLIC_SUPABASE_URL'
  | 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
  | 'DATABASE_URL'
  | 'DIRECT_URL'

// 값이 있을 때 이름별로 형식을 확인합니다. 통과하지 못하면 false 를 돌려줍니다.
const formatChecks: Record<EnvName, (value: string) => boolean> = {
  NEXT_PUBLIC_SUPABASE_URL(value) {
    if (/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(value)) {
      report('ok', 'NEXT_PUBLIC_SUPABASE_URL', new URL(value).hostname)
    } else {
      report(
        'warn',
        'NEXT_PUBLIC_SUPABASE_URL',
        `보통 https://프로젝트ID.supabase.co 형태입니다. 현재: ${value}`
      )
    }
    return true
  },

  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY(value) {
    const name = 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'

    if (value.startsWith('sb_publishable_')) {
      report('ok', name, `${value.slice(0, 20)}...`)
    } else if (value.startsWith('eyJ')) {
      report(
        'warn',
        name,
        '예전 anon 키(JWT)입니다. 동작은 하지만 sb_publishable_ 로 시작하는 새 키를 권장합니다.'
      )
    } else if (value.startsWith('sb_secret_')) {
      report(
        'fail',
        name,
        'Secret 키가 들어 있습니다. 이 키는 브라우저에 노출되면 안 됩니다. Publishable 키로 바꾸세요.'
      )
      return false
    } else {
      report(
        'warn',
        name,
        'sb_publishable_ 로 시작하는 키가 아닙니다. Project Settings > API Keys 에서 다시 확인하세요.'
      )
    }
    return true
  },

  DATABASE_URL(value) {
    return checkConnectionString('DATABASE_URL', value, '6543')
  },

  DIRECT_URL(value) {
    return checkConnectionString('DIRECT_URL', value, '5432')
  }
}

function checkConnectionString(
  name: EnvName,
  value: string,
  expectedPort: string
) {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    report(
      'fail',
      name,
      '연결 문자열 형식이 아닙니다. 대시보드의 Connect 버튼에서 다시 복사하세요.'
    )
    return false
  }

  if (!/^postgres(ql)?:$/.test(url.protocol)) {
    report(
      'fail',
      name,
      `postgresql:// 로 시작해야 합니다. 현재: ${url.protocol}//`
    )
    return false
  }

  if (!url.password) {
    report(
      'fail',
      name,
      '비밀번호가 없습니다. [YOUR-PASSWORD] 자리를 데이터베이스 비밀번호로 바꾸세요.'
    )
    return false
  }

  const notes: string[] = []
  if (url.port !== expectedPort) {
    notes.push(
      `포트가 ${expectedPort} 가 아닙니다(현재 ${url.port || '기본값'}).`
    )
  }

  report(
    notes.length ? 'warn' : 'ok',
    name,
    [describeConnection(value), ...notes].join(' ')
  )
  return true
}

function checkEnv() {
  section('1. 환경 변수 (.env.local)')

  const env: Partial<Record<EnvName, string>> = {}
  let complete = true

  for (const name of Object.keys(formatChecks) as EnvName[]) {
    const value = process.env[name]?.trim()

    if (!value) {
      report(
        'fail',
        name,
        '값이 없습니다. .env.example 을 참고해 .env.local 에 추가하세요.'
      )
      complete = false
      continue
    }

    if (hasPlaceholder(value)) {
      report(
        'fail',
        name,
        '예시 값이 그대로 들어 있습니다. 실제 값으로 바꾸세요.'
      )
      complete = false
      continue
    }

    if (!formatChecks[name](value)) {
      complete = false
      continue
    }

    env[name] = value
  }

  return complete ? (env as Record<EnvName, string>) : null
}

// ---------- 2. Supabase ----------

async function checkSupabase(url: string, key: string) {
  section('2. Supabase')

  // Auth 설정은 Publishable 키만으로 읽을 수 있어서 URL과 키를 한 번에 확인할 수 있습니다.
  const endpoint = `${url.replace(/\/$/, '')}/auth/v1/settings`
  let response: Response

  try {
    response = await fetch(endpoint, { headers: { apikey: key } })
  } catch (error) {
    report(
      'fail',
      'Supabase 연결',
      `요청 자체가 실패했습니다. URL을 확인하세요. (${errorMessage(error)})`
    )
    return
  }

  if (response.status === 401 || response.status === 403) {
    report(
      'fail',
      'Supabase 키',
      `키가 거부되었습니다(${response.status}). Publishable 키를 다시 복사하세요.`
    )
    return
  }

  if (!response.ok) {
    report(
      'fail',
      'Supabase 연결',
      `예상하지 못한 응답입니다(${response.status}). 프로젝트가 일시 중지(paused)되지 않았는지 확인하세요.`
    )
    return
  }

  report('ok', 'Supabase 연결', 'URL과 Publishable 키가 유효합니다.')

  const settings = (await response.json()) as {
    external?: Record<string, boolean>
  }
  if (settings.external?.google) {
    report(
      'ok',
      'Google 로그인 제공자',
      'Authentication > Providers 에서 Google 이 켜져 있습니다.'
    )
  } else {
    report(
      'warn',
      'Google 로그인 제공자',
      'Google 이 꺼져 있습니다. Google 로그인을 쓰려면 Authentication > Providers 에서 켜세요.'
    )
  }
}

// ---------- 3. 데이터베이스 ----------

async function checkDatabase(url: string) {
  section('3. 데이터베이스 (DATABASE_URL, 애플리케이션이 쓰는 연결)')

  // prisma/db.ts 와 같은 방식으로 Prisma 8 클라이언트를 만듭니다.
  const pool = new Pool({
    connectionString: url,
    max: 1,
    connectionTimeoutMillis: 10_000
  })

  try {
    const db = postgres({ contractJson, pg: pool })
    await db.connect()

    const { rows } = await pool.query<{ version: string; role: string }>(
      'select version() as version, current_user as role'
    )
    const version =
      rows[0].version.match(/PostgreSQL [\d.]+/)?.[0] ?? rows[0].version

    report('ok', 'Prisma 연결', `${version}, 역할 ${rows[0].role}`)

    const models = Object.keys(
      (
        contractJson as {
          domain: { namespaces: { public?: { models: object } } }
        }
      ).domain.namespaces.public?.models ?? {}
    )
    if (models.length === 0) {
      report(
        'warn',
        '데이터 계약',
        '아직 모델이 없습니다. 테이블을 만든 뒤 npm run db:infer 와 npm run db:emit 을 실행하세요.'
      )
    } else {
      report(
        'ok',
        '데이터 계약',
        `모델 ${models.length}개: ${models.join(', ')}`
      )
    }

    await db.close()
  } catch (error) {
    report('fail', 'Prisma 연결', explainPgError(error))
  } finally {
    await pool.end().catch(() => undefined)
  }
}

async function checkDirect(url: string) {
  section('4. 데이터베이스 (DIRECT_URL, Prisma CLI가 쓰는 연결)')

  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 10_000
  })

  try {
    await client.connect()
    await client.query('select 1')
    report('ok', 'CLI 연결', 'npm run db:infer 를 실행할 수 있습니다.')
  } catch (error) {
    report('fail', 'CLI 연결', explainPgError(error))
  } finally {
    await client.end().catch(() => undefined)
  }
}

function explainPgError(error: unknown) {
  const message = errorMessage(error)

  if (/password authentication failed/i.test(message)) {
    return '비밀번호가 틀렸습니다. Database > Settings 에서 재설정한 뒤 두 연결 문자열을 모두 고치세요.'
  }
  if (/Tenant or user not found/i.test(message)) {
    return '사용자 이름이 틀렸습니다. pooler 주소는 postgres.프로젝트ID 형태여야 합니다. Connect 버튼에서 다시 복사하세요.'
  }
  if (/ENOTFOUND|EAI_AGAIN/i.test(message)) {
    return `호스트를 찾을 수 없습니다. aws-0- 같은 접두사까지 통째로 복사했는지 확인하세요. (${message})`
  }
  if (/timeout|ETIMEDOUT|ECONNREFUSED/i.test(message)) {
    return `연결 시간이 초과되었습니다. 네트워크와 포트를 확인하세요. (${message})`
  }

  return message
}

// ---------- 실행 ----------

console.log(paint.title('Next.js + Supabase + Prisma 8 템플릿 점검'))

const env = checkEnv()

if (env) {
  await checkSupabase(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
  await checkDatabase(env.DATABASE_URL)
  await checkDirect(env.DIRECT_URL)
}

const failed = results.filter(r => r.status === 'fail').length
const warned = results.filter(r => r.status === 'warn').length

const passed = results.filter(r => r.status === 'ok').length

console.log('')
console.log(
  [
    paint.ok(`통과 ${passed}`),
    paint.warn(`주의 ${warned}`),
    paint.fail(`실패 ${failed}`)
  ].join(paint.dim(' / '))
)

if (failed > 0) {
  console.log(paint.fail('위 안내를 따라 고친 뒤 다시 실행하세요.'))
  process.exit(1)
} else if (warned > 0) {
  console.log(
    paint.warn('모든 연결이 됩니다. 주의 항목은 필요할 때 확인하세요.')
  )
} else {
  console.log(paint.ok('모든 항목을 통과했습니다. 바로 시작할 수 있습니다.'))
}
