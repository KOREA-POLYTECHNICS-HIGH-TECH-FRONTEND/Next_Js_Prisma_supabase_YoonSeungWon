# Next.js + Supabase + Prisma 8 Template

Next.js 앱에 Supabase(인증, 스토리지, Realtime)와 Prisma 8(데이터베이스 질의)을 연결하는 데 필요한 설정만 갖춘 템플릿입니다.
화면이나 기능은 들어 있지 않습니다.
어떤 프로젝트든 이 상태에서 바로 시작할 수 있습니다.

| 영역 | 사용 | 버전 |
| --- | --- | --- |
| 프레임워크 | Next.js (App Router, React Compiler, Tailwind CSS 4) | 16 |
| 인증, 스토리지, Realtime | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) | 2 |
| 데이터베이스 질의 | Prisma 8 (`@prisma/orm-postgres`) | 8.0.0-rc |

## 시작하기

1. [Supabase](https://supabase.com/dashboard)에서 새 프로젝트를 만듭니다.
1. `.env.example`을 복사해 `.env.local`을 만들고 네 개의 값을 채웁니다.
1. 패키지를 설치하고 점검 명령을 실행합니다.

```bash
npm install
npm run check
```

점검을 통과하면 개발 서버를 실행합니다.

```bash
npm run dev
```

## 환경 변수

`.env.local`에 아래 네 개의 값을 작성합니다.
값은 큰따옴표로 묶습니다.

```bash
# 브라우저에 노출되어도 되는 값
NEXT_PUBLIC_SUPABASE_URL="https://프로젝트ID.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."

# 데이터베이스 비밀번호가 들어 있으므로 절대 NEXT_PUBLIC_ 을 붙이지 않습니다
DATABASE_URL="postgresql://postgres.프로젝트ID:비밀번호@aws-0-리전.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.프로젝트ID:비밀번호@aws-0-리전.pooler.supabase.com:5432/postgres"
```

### 프로젝트 만들기

[대시보드](https://supabase.com/dashboard/organizations)에서 조직을 선택하고 'New project' 버튼을 누릅니다.
프로젝트 이름(Project name), 데이터베이스 비밀번호(Database password), 리전(Region)을 입력합니다.

![새 프로젝트 생성](docs/images/new-project.jpg)

- 비밀번호는 'Generate a password'로 생성한 뒤 'Copy' 버튼으로 복사해 따로 저장합니다.
  생성 후에는 다시 확인할 수 없습니다.
- 리전은 사용자와 가까운 'Northeast Asia (Seoul)'을 선택합니다.
  연결 문자열의 `aws-0-ap-northeast-2` 부분이 이 리전에서 정해집니다.

### 프로젝트 ID와 API 키

프로젝트가 준비되면 홈 화면에 프로젝트 주소가 표시됩니다.
이 주소가 `NEXT_PUBLIC_SUPABASE_URL`이고, `https://` 뒤의 영문자 20자가 프로젝트 ID입니다.
연결 문자열의 `postgres.프로젝트ID` 부분에도 같은 값이 들어갑니다.

![프로젝트 홈](docs/images/project-home.jpg)

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`는 'Project Settings > API Keys' 페이지의 'Publishable key'를 복사합니다.
`sb_publishable_`로 시작하는 값입니다.
같은 페이지의 'Secret keys'는 브라우저에 노출되면 안 되므로 이 변수에 넣지 않습니다.

![API Keys 페이지](docs/images/api-keys.jpg)

### 연결 문자열

`DATABASE_URL`과 `DIRECT_URL`은 홈 화면 상단의 'Connect' 버튼을 눌러 확인합니다.
창이 열리면 'ORM' 탭을 선택하고 'Prisma'를 고릅니다.
'Configure ORM' 단계의 `.env.local` 탭에 두 값이 채워진 내용이 표시됩니다.

![Connect 창의 ORM 탭](docs/images/connect-orm.jpg)

- 두 값을 그대로 복사하고 `[YOUR-PASSWORD]` 자리를 앞서 저장한 데이터베이스 비밀번호로 바꿉니다.
- `DATABASE_URL`은 애플리케이션이 사용하는 Transaction pooler(포트 6543), `DIRECT_URL`은 Prisma CLI가 사용하는 Session pooler(포트 5432)입니다.
- 호스트의 `aws-0-ap-northeast-2` 부분은 프로젝트마다 다르고 `aws-1`처럼 다른 번호가 붙기도 하므로, 예시를 고쳐 쓰지 말고 Connect 창에서 복사한 값을 사용합니다.
- 비밀번호에 `#`, `/`, `?` 같은 특수문자가 있으면 `%23`, `%2F`, `%3F`로 바꿔 작성합니다.
  바꾸지 않으면 'Invalid URL' 오류로 연결에 실패합니다.
- 비밀번호를 잊었다면 Connect 창의 'Direct' 탭에 있는 'Reset database password' 버튼이나 'Database > Settings' 페이지에서 재설정합니다.

### 점검 명령

`npm run check`는 `.env.local`을 읽어 아래 항목을 순서대로 확인하고, 실패한 항목에는 고칠 곳을 안내합니다.
비밀번호와 키는 화면에 출력하지 않습니다.

| 항목 | 확인하는 것 |
| --- | --- |
| 환경 변수 | 네 개의 값이 있는지, 예시 값이 그대로 남아 있지 않은지, 형식이 맞는지 |
| Supabase | URL과 Publishable 키로 실제 접속이 되는지, Google 로그인 제공자가 켜져 있는지 |
| DATABASE_URL | Prisma 8 클라이언트로 연결되는지, 데이터 계약에 모델이 있는지 |
| DIRECT_URL | Prisma CLI 명령을 실행할 수 있는지 |

## 파일 구성

| 파일 | 역할 |
| --- | --- |
| `lib/supabase/server.ts` | 서버(서버 컴포넌트, 서버 액션, 라우트 핸들러)용 Supabase 클라이언트 |
| `lib/supabase/client.ts` | 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트 |
| `proxy.ts` | 요청마다 Supabase 세션(액세스 토큰)을 갱신 |
| `prisma.config.ts` | Prisma CLI 설정. 계약 파일 위치와 데이터베이스 연결 |
| `prisma/contract.prisma` | 데이터 계약(Contract)의 원본. 모델을 여기에 작성 |
| `prisma/contract.json`, `prisma/contract.d.ts` | 계약에서 만들어지는 파일. 직접 수정하지 않음 |
| `prisma/db.ts` | Prisma 8 클라이언트. `import { db } from '@/prisma/db'` |
| `scripts/check.ts` | `npm run check` 점검 스크립트 |
| `.env.example` | 필요한 환경 변수 목록 |

## Prisma 작업 흐름

Prisma 8은 스키마 파일에서 클라이언트를 생성하던 방식 대신 데이터 계약(Contract)을 원본으로 사용합니다.
`prisma/contract.prisma`에서 `contract.json`과 `contract.d.ts`를 만들어 내면 런타임은 그 두 파일만 읽습니다.

```bash
npm run db:infer   # Supabase에 만들어 둔 테이블을 읽어 contract.prisma 를 작성합니다
npm run db:emit    # contract.prisma 에서 contract.json 과 contract.d.ts 를 만듭니다
```

1. Supabase 대시보드(Table Editor 또는 SQL Editor)에서 테이블을 만듭니다.
1. `npm run db:infer`로 계약 파일을 작성합니다.
1. 계약 파일을 정리하고 `npm run db:emit`을 실행합니다.
1. 서버 코드에서 질의합니다.

```ts
import { db } from '@/prisma/db'

const profiles = await db.orm.public.Profile.select('id', 'username').all()
```

계약 파일을 수정할 때마다 `npm run db:emit`을 다시 실행합니다.
`npm run build`는 이 명령을 자동으로 먼저 실행합니다.
