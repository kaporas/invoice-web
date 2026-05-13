# 프로젝트 개발 규칙

## 프로젝트 개요

**노션 기반 견적서 관리 시스템** - 노션을 데이터베이스로 활용하여 견적서를 관리하고, 클라이언트가 웹에서 조회 및 PDF 다운로드. 관리자 대시보드를 통해 목록 조회, 필터링, 링크 공유 기능 제공.

### 핵심 기술 스택

- **프레임워크**: Next.js 15 (App Router + Turbopack)
- **런타임**: React 19 + TypeScript 5
- **스타일링**: TailwindCSS v4 + shadcn/ui (new-york)
- **폼**: React Hook Form + Zod + Server Actions
- **외부 API**: @notionhq/client v5 (Notion API SDK)
- **인증**: jose (JWT) + httpOnly 쿠키
- **PDF**: @react-pdf/renderer

---

## 프로젝트 구조 규칙

### 필수 디렉토리 구조

```
src/
├── app/
│   ├── (auth)/admin-login/   # 관리자 로그인 (URL: /admin-login)
│   ├── admin/                # 관리자 대시보드 (/admin, /admin/invoices)
│   ├── api/generate-pdf/     # PDF 생성 API Route
│   ├── invoice/[id]/         # 공개 견적서 조회
│   └── invoice/guide/        # 견적서 안내 페이지
├── components/
│   ├── admin/               # 관리자 전용 컴포넌트
│   ├── invoice/             # 견적서 조회 컴포넌트
│   ├── layout/              # 레이아웃 컴포넌트
│   ├── pdf/                 # PDF 템플릿 컴포넌트
│   ├── providers/           # Context 프로바이더
│   └── ui/                  # shadcn/ui 기본 컴포넌트
├── hooks/                   # 커스텀 훅 (use-clipboard.ts 등)
├── lib/
│   ├── auth/                # 인증 (session.ts, password.ts)
│   ├── services/            # 비즈니스 로직 (invoice.service.ts)
│   ├── utils/               # 유틸리티 (notion-parser.ts, link-generator.ts)
│   ├── cache.ts             # 캐싱 레이어
│   ├── constants.ts         # 에러 상수 등
│   ├── env.ts               # 환경변수 Zod 검증
│   ├── logger.ts            # 로거
│   ├── notion.ts            # Notion 클라이언트 싱글턴
│   ├── rate-limit.ts        # Rate Limiting
│   └── utils.ts             # cn() 헬퍼
├── middleware.ts             # 인증 + Rate Limiting
└── types/                   # 도메인 타입
    ├── auth.ts
    ├── invoice.ts
    ├── notion.ts
    └── pdf.ts
```

### 경로 별칭 사용 필수

```typescript
// ✅ 필수
import { Button } from '@/components/ui/button'
import { env } from '@/lib/env'
import type { Invoice } from '@/types/invoice'

// ❌ 금지
import { Button } from '../../../components/ui/button'
```

### 파일 네이밍

- **컴포넌트 파일**: kebab-case (`user-profile.tsx`)
- **컴포넌트명**: PascalCase (`UserProfile`)
- **폴더명**: kebab-case
- **금지**: snake_case, PascalCase 폴더명

---

## Next.js 15 필수 규칙

### async request APIs 필수

```typescript
// ✅ 필수: params, searchParams, cookies, headers는 await
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const query = await searchParams
}

// ❌ 금지: 동기식 접근
export default function Page({ params }: { params: { id: string } }) {
  const data = getData(params.id) // 에러 발생
}
```

### Server Components 우선

```typescript
// ✅ 기본: Server Component
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getOptimizedInvoice(id)
  return <InvoiceView invoice={invoice} />
}

// ✅ 상호작용 필요 시에만 'use client'
'use client'
export function PDFDownloadButton({ invoice }: { invoice: Invoice }) {
  const [loading, setLoading] = useState(false)
  return <button onClick={() => handleDownload()}>PDF 다운로드</button>
}
```

### 금지 사항

- Pages Router 사용 금지
- `getServerSideProps`, `getStaticProps` 사용 금지
- params/searchParams 동기 접근 금지
- `'use client'` 없이 useState, useEffect 사용 금지

---

## 데이터 레이어 아키텍처

### 데이터 흐름 (엄수)

```
페이지 컴포넌트
    ↓
getOptimizedInvoice()         ← 외부 진입점 (항상 이것만 사용)
    ↓
getInvoiceWithDedup()         ← Request Deduplication (cache.ts)
    ↓
getCachedInvoiceFromNotion()  ← unstable_cache 60초 TTL (cache.ts)
    ↓
getInvoiceFromNotion()        ← Notion API 호출 + 재시도 (invoice.service.ts)
```

### 견적서 단건 조회

```typescript
// ✅ 필수: getOptimizedInvoice만 사용
import { getOptimizedInvoice } from '@/lib/services/invoice.service'

const invoice = await getOptimizedInvoice(pageId)

// ❌ 금지: 직접 Notion 호출
import { notion } from '@/lib/notion'
const page = await notion.pages.retrieve({ page_id: id }) // 캐싱 우회
```

### 견적서 목록/검색 조회

```typescript
// 목록 조회 (v5 API - dataSources.query 사용)
import {
  getInvoicesFromNotion,
  searchInvoices,
} from '@/lib/services/invoice.service'

const result = await getInvoicesFromNotion(10, cursor, 'issue_date')
const result = await searchInvoices({ query: '홍길동', status: 'pending' }, 10)
```

### Notion API v5 중요 규칙

- **목록 조회**: `notion.dataSources.query()` 사용 (`data_source_id` 필요)
- **data_source_id 획득**: `getDataSourceId()` 호출 (notion.ts, 자동 캐싱)
- **단건 조회**: `notion.pages.retrieve()` 사용 (그대로)
- `databases.query`는 v5에서 사용 불가 → `dataSources.query` 사용

```typescript
// ✅ v5 목록 조회
const dataSourceId = await getDataSourceId()
const response = await notion.dataSources.query({
  data_source_id: dataSourceId,
  page_size: 10,
  sorts: [{ property: '발행일', direction: 'descending' }],
})

// ❌ v5에서 동작 안 함
await notion.databases.query({ database_id: env.NOTION_DATABASE_ID })
```

### Notion DB 속성명 (한국어 그대로 사용)

| DB       | 속성명         | 타입                          |
| -------- | -------------- | ----------------------------- |
| Invoices | `견적서 번호`  | Title                         |
| Invoices | `클라이언트명` | Text                          |
| Invoices | `발행일`       | Date                          |
| Invoices | `유효기간`     | Date                          |
| Invoices | `상태`         | Select (`대기`/`승인`/`거절`) |
| Invoices | `총 금액`      | Number                        |
| Invoices | `항목`         | Relation → Items              |
| Items    | `항목명`       | Title                         |
| Items    | `수량`         | Number                        |
| Items    | `단가`         | Number                        |
| Items    | `금액`         | Formula                       |

### 타입 가드 사용

```typescript
// ✅ 필수: Notion 응답 검증 시 타입 가드 사용
import { isInvoicePage, isItemPage } from '@/types/notion'

const page = response as NotionPage
if (!isInvoicePage(page)) throw new Error(ERROR_MESSAGES.INVALID_INVOICE_DATA)

// ❌ 금지: 타입 단언만으로 검증 없이 사용
const page = response as InvoicePageProperties
```

---

## 환경 변수 관리

### env.ts Zod 검증 필수

```typescript
// 새 환경변수 추가 시 반드시 env.ts의 envSchema와 env 객체 모두 수정
const envSchema = z.object({
  NOTION_API_KEY: z
    .string()
    .refine(k => k.startsWith('secret_') || k.startsWith('ntn_')),
  NOTION_DATABASE_ID: z.string().length(32),
  ADMIN_PASSWORD: z.string().min(8),
  SESSION_SECRET: z.string().length(32), // 정확히 32자 필수
  NEXT_PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
})
```

### 환경변수 접근 규칙

```typescript
// ✅ 필수: env 객체 사용
import { env } from '@/lib/env'
const key = env.NOTION_API_KEY

// ❌ 금지: 컴포넌트/서비스에서 process.env 직접 접근
const key = process.env.NOTION_API_KEY // middleware.ts만 예외 (Edge Runtime)
```

---

## 인증 시스템

### 흐름

```
/admin-login → actions.ts → password.ts 비교 → session.ts JWT 생성 → admin_session 쿠키
middleware.ts → /admin/* 경로에서 JWT 검증 → 실패 시 /admin-login redirect
```

### 세션 관리

```typescript
// ✅ 세션 생성 (로그인 성공 시)
import { createSession, getSession, deleteSession } from '@/lib/auth/session'
await createSession() // JWT 생성 + admin_session 쿠키 설정
const session = await getSession() // 세션 검증 및 조회
await deleteSession() // 로그아웃

// ✅ 비밀번호 검증
import { verifyPassword } from '@/lib/auth/password'
const isValid = verifyPassword(inputPassword) // ADMIN_PASSWORD와 비교
```

### middleware.ts 규칙

- `/admin/*`: JWT 검증 → 실패 시 `/admin-login` redirect
- `/api/*`: Rate Limiting (분당 10회, in-memory)
- Edge Runtime 제약으로 `env.ts` 대신 `process.env.SESSION_SECRET` 직접 사용 (유일한 예외)
- Vercel 서버리스: 인스턴스 재시작 시 Rate Limit 카운터 초기화됨

---

## 로깅 규칙

```typescript
// ✅ 필수: logger 사용
import { logger } from '@/lib/logger'

logger.info('견적서 조회 성공', { pageId, invoiceNumber })
logger.warn('API 재시도', { attempt: 1, delayMs: 1000 })
logger.error('Notion API 오류', { pageId, errorCode }, error)

// ❌ 금지: console.log 사용
console.log('견적서 조회')
```

- 민감 키워드(`apiKey`, `password`, `token`, `secret`)는 자동으로 `[REDACTED]`로 마스킹됨
- 개발: 가독성 포맷, 프로덕션: JSON 포맷

---

## 에러 처리 규칙

### ERROR_MESSAGES 상수 사용

```typescript
// ✅ 필수: constants.ts의 ERROR_MESSAGES 사용
import { ERROR_MESSAGES } from '@/lib/constants'
throw new Error(ERROR_MESSAGES.INVOICE_NOT_FOUND)
throw new Error(ERROR_MESSAGES.INVALID_INVOICE_DATA)

// ❌ 금지: 하드코딩된 에러 메시지
throw new Error('견적서를 찾을 수 없습니다')
```

### Notion API 에러 처리

```typescript
try {
  const page = await notion.pages.retrieve({ page_id: pageId })
} catch (error) {
  const errorObj = error as { code?: string }
  if (errorObj.code === 'object_not_found') {
    throw new Error(ERROR_MESSAGES.INVOICE_NOT_FOUND) // → notFound() 트리거
  }
  throw new Error(ERROR_MESSAGES.NOTION_API_ERROR)
}
```

- 404 에러 → `notFound()` 호출 (not-found.tsx 렌더링)
- 500 에러 → `error.tsx`로 처리
- 재시도 가능 에러: `withRetry()` (invoice.service.ts 내부 사용, 3회, 지수 백오프)

---

## 스타일링 규칙

### Tailwind + shadcn/ui

```typescript
// ✅ 필수: 시맨틱 색상 변수
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">설명</p>
</div>

// ❌ 금지: 하드코딩 색상
<div className="bg-white text-black">

// ✅ 조건부 클래스: cn() 사용
import { cn } from '@/lib/utils'
<div className={cn('base', isActive && 'active', className)}>

// ❌ 금지: 인라인 스타일, 문자열 직접 조합
<div style={{ display: 'flex' }}>
```

### shadcn/ui 컴포넌트 추가

```bash
npx shadcn@latest add [component]  # 새 컴포넌트 추가
```

---

## 폼 처리 규칙

### React Hook Form + Zod + Server Actions

```typescript
// Server Action
'use server'
export async function loginAction(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const validated = loginSchema.safeParse({
    password: formData.get('password'),
  })
  if (!validated.success) return { success: false, message: '입력 오류' }
  // 비즈니스 로직
}

// Client 폼 컴포넌트
;('use client')
const [state, formAction, isPending] = useActionState(loginAction, {
  success: false,
  message: '',
})
```

- Zod 스키마로 타입 정의
- 서버-클라이언트 이중 검증 필수
- `useActionState`로 서버 상태 관리

---

## 다중 파일 조정 규칙

### 새 환경변수 추가

1. `.env.local` 변수 추가
2. `.env.local.example` 변수 추가
3. `src/lib/env.ts`의 `envSchema`와 `env` 파싱 객체 수정

### 새 에러 메시지 추가

1. `src/lib/constants.ts`의 `ERROR_MESSAGES`에 추가
2. 서비스/컴포넌트에서 상수 import하여 사용

### 새 페이지 추가

1. `src/app/[route]/page.tsx` 생성 (Server Component 우선)
2. 필요 시 `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` 추가
3. 관리자 페이지: `src/app/admin/` 하위, 인증은 middleware가 자동 처리

### 새 Notion API 기능 추가

1. `src/types/notion.ts`: 필요 시 타입 추가
2. `src/lib/services/invoice.service.ts`: 서비스 함수 추가
3. `src/lib/cache.ts`: 캐싱 필요 시 래퍼 함수 추가
4. 페이지 컴포넌트: 서비스 함수만 호출

### 새 관리자 컴포넌트 추가

1. `src/components/admin/[component-name].tsx` 생성
2. 서버 컴포넌트 우선, 상호작용 필요 시 Client Component 분리

---

## 금지사항

### 절대 금지

- **Pages Router 사용** - App Router만 사용
- **getServerSideProps/getStaticProps** - Server Component 사용
- **params/searchParams 동기 접근** - 반드시 await
- **인라인 스타일** - Tailwind 클래스만 사용
- **하드코딩된 색상** - 시맨틱 색상 변수 사용
- **process.env 직접 접근** - `env` 객체 사용 (middleware.ts 제외)
- **상대 경로 import** - `@/` 별칭 사용
- **notion.ts 직접 호출로 단건 조회** - `getOptimizedInvoice()` 사용
- **databases.query 사용** - Notion API v5에서 `dataSources.query` 사용
- **console.log** - `logger` 사용
- **하드코딩된 에러 메시지** - `ERROR_MESSAGES` 상수 사용

### 지양 사항

- 'use client' 남용 - Server Component 우선
- 커스텀 CSS 클래스 - Tailwind 우선
- 깊은 props drilling - Context 사용
- 단일 파일 300줄 초과 - 분할 권장

---

## AI Agent 결정 트리

### 새 기능 구현 시

1. **인증 필요?**
   - YES → `/admin/` 하위 배치 (middleware 자동 보호)
   - NO → `/invoice/` 또는 공개 라우트

2. **Notion 데이터 필요?**
   - 단건 → `getOptimizedInvoice(pageId)`
   - 목록/검색 → `getInvoicesFromNotion()` / `searchInvoices()`

3. **Server Component로 가능?**
   - YES → Server Component 사용
   - NO (onClick, useState 등) → `'use client'` + 최소 범위

4. **에러 처리?**
   - 404 → `notFound()` 호출
   - 기타 → `error.tsx`가 자동 처리, `logger.error()` 로깅

### 파일 수정 시

1. 수정 전 반드시 파일 읽기
2. 기존 코드 스타일 유지
3. 환경변수 추가 시 env.ts도 반드시 수정
4. Notion 속성명은 한국어 그대로 사용

---

## 코드 품질 체크리스트

```bash
npm run check-all   # 타입 체크 + 린트 + 포맷 검사 (커밋 전 필수)
npm run build       # 빌드 테스트
```

### 컴포넌트 작성 후 확인

- [ ] Server/Client Component 적절히 분리
- [ ] Props 인터페이스 정의
- [ ] Tailwind 클래스 + 시맨틱 색상 사용
- [ ] `@/` 경로 별칭 사용
- [ ] 파일 300줄 이하

### Notion 서비스 작성 후 확인

- [ ] `getOptimizedInvoice()` 경유 (단건 조회)
- [ ] `dataSources.query` 사용 (목록 조회)
- [ ] `logger` 로깅
- [ ] `ERROR_MESSAGES` 상수 사용
- [ ] 타입 가드 (`isInvoicePage`, `isItemPage`) 적용
