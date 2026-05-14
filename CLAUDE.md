# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

노션을 데이터베이스로 활용하는 견적서 관리 시스템. 관리자는 Notion에서 데이터를 입력하고, 클라이언트는 고유 URL(`/invoice/[notionPageId]`)로 견적서를 조회하고 PDF로 다운로드한다.

## 명령어

```bash
npm run dev          # 개발 서버 (Turbopack)
npm run build        # 프로덕션 빌드
npm run check-all    # typecheck + lint + format 검사 (커밋 전 필수)
npm run lint:fix     # ESLint 자동 수정
npm run format       # Prettier 포맷팅
npx shadcn@latest add [component]  # shadcn/ui 컴포넌트 추가
```

## 환경 변수

`.env.local`에 아래 변수가 모두 필요하며, `src/lib/env.ts`의 Zod 스키마로 검증된다. 없으면 서버 시작 자체가 실패한다. 새 환경 변수 추가 시 반드시 `env.ts`의 `envSchema`와 `env` 파싱 객체도 함께 수정한다.

```
NOTION_API_KEY=secret_xxx 또는 ntn_xxx  (Notion Integration 토큰)
NOTION_DATABASE_ID=32자 ID              (견적서 데이터베이스 ID)
ADMIN_PASSWORD=                         (8자 이상, 관리자 로그인)
SESSION_SECRET=                         (정확히 32자, JWT 서명 — .length(32) 검증)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 아키텍처

### 데이터 흐름

```
Notion DB → notion.ts → invoice.service.ts → cache.ts → invoice/[id]/page.tsx
```

1. **`src/lib/notion.ts`** — Notion 클라이언트 싱글턴. `@notionhq/client v5`에서는 목록 조회 시 `databases.query` 대신 `dataSources.query`를 사용하므로 `getDataSourceId()`로 `data_source_id`를 먼저 획득한다. `databases.retrieve` 응답의 `data_sources` 배열은 SDK 타입에 없어 `as any` 캐스팅으로 접근한다.
2. **`src/lib/services/invoice.service.ts`** — 데이터 계층. `getInvoiceFromNotion`(단건, `pages.retrieve`), `getInvoicesFromNotion`(목록), `searchInvoices`(필터 검색). 항목(Items) 병렬 조회(`Promise.allSettled`), 지수 백오프 재시도(3회) 내장.
3. **`src/lib/cache.ts`** — `unstable_cache`(60초 TTL)와 Request Deduplication(`Map<pageId, Promise>`)을 조합. 외부에서는 항상 `getOptimizedInvoice()`를 사용한다. `getInvoiceFromNotion`을 직접 호출하지 않는다.
4. **`src/lib/utils/notion-parser.ts`** — Notion 응답 → `Invoice` 타입 변환.
5. **`src/types/`** — 도메인 타입(`invoice.ts`), Notion 응답 타입(`notion.ts`), Auth(`auth.ts`), PDF(`pdf.ts`).

### Notion 데이터베이스 속성명

Notion DB 속성명은 한국어이며, 타입/필터 구성 시 그대로 사용한다.

**Invoices DB**: `견적서 번호`(Title), `클라이언트명`(Text), `발행일`(Date), `유효기간`(Date), `상태`(Status: `대기`/`승인`/`거절`), `총 금액`(Number), `항목`(Relation → Items)

**Items DB**: `항목명`(Title), `수량`(Number), `단가`(Number), `금액`(Formula), `견적서`(Relation → Invoices)

### 라우트 구조

| 경로                  | 설명                                  |
| --------------------- | ------------------------------------- |
| `/invoice/[id]`       | 공개 견적서 조회 페이지 (인증 불필요) |
| `/admin`              | 관리자 대시보드 (세션 필요)           |
| `/admin/invoices`     | 견적서 목록 및 필터                   |
| `/(auth)/admin-login` | 관리자 로그인 (URL: `/admin-login`)   |
| `/api/generate-pdf`   | PDF 생성 API Route (POST)             |
| `/invoice/guide`      | 견적서 안내 페이지                    |

### 인증 흐름

- `src/lib/auth/session.ts` — `jose` 라이브러리로 JWT 생성/검증. `admin_session` httpOnly 쿠키에 저장, 7일 만료.
- `src/lib/auth/password.ts` — `ADMIN_PASSWORD` 환경 변수와 단순 비교.
- `src/middleware.ts` — `/admin/*` 경로에서 JWT 검증 후 실패 시 `/admin-login`으로 redirect. `/api/*` 경로에 Rate Limiting(분당 10회, in-memory) 적용. Vercel 서버리스에서는 인스턴스 재시작 시 카운터 초기화됨.
- `/admin` layout에서 `getSession()` 검증 후 미인증 시 redirect.

### PDF 생성

`POST /api/generate-pdf`에 `Invoice` 객체를 전달하면 `@react-pdf/renderer`로 PDF Blob을 생성해 반환한다. 클라이언트의 `PDFDownloadButton` 컴포넌트가 이 엔드포인트를 호출한다. 한글 폰트는 `public/fonts/NotoSansKR-Regular.ttf`를 사용한다.

### 로깅

`src/lib/logger.ts`의 `logger` 객체를 사용한다. 개발 환경은 사람이 읽기 쉬운 형식, 프로덕션은 JSON으로 출력된다. `apiKey`, `password`, `token`, `secret` 등 민감 키워드가 포함된 컨텍스트 키는 자동으로 `[REDACTED]`로 마스킹된다.

```typescript
import { logger } from '@/lib/logger'
logger.info('메시지', { contextKey: value })
logger.error('에러 메시지', { pageId }, error)
```

## 핵심 규칙

### Next.js 15 필수 패턴

`params`, `searchParams`, `cookies()`, `headers()`는 반드시 `await`로 접근한다. Pages Router, `getServerSideProps`, `getStaticProps`는 사용 금지.

```typescript
// ✅
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
}
```

### Server Component 우선

상호작용(`useState`, 이벤트 핸들러)이 필요한 경우에만 `'use client'`를 추가한다.

### 스타일링

- Tailwind 유틸리티 클래스만 사용. 인라인 `style={{}}` 금지.
- 색상은 시맨틱 변수(`bg-background`, `text-foreground`, `text-muted-foreground`)만 사용. `bg-white`, `text-black` 등 하드코딩 금지.
- 조건부 클래스 조합은 `cn()` (`src/lib/utils.ts`) 사용.

### 환경 변수

컴포넌트/서비스에서 `process.env.*` 직접 접근 금지. 반드시 `import { env } from '@/lib/env'`를 통해 접근한다. (`middleware.ts`는 Edge Runtime 제약으로 예외)

### 경로 별칭

상대 경로(`../../../`) 금지. `@/components`, `@/lib`, `@/types` 등 별칭을 사용한다.

### 파일 네이밍

- 컴포넌트 파일: kebab-case (`user-profile.tsx`), 컴포넌트명: PascalCase
- 폴더명: kebab-case (`user-settings/`)

### 폼 처리

React Hook Form + Zod + Server Actions 패턴을 사용한다. 서버 상태는 `useActionState`로 관리하고, 서버-클라이언트 이중 검증을 수행한다.
