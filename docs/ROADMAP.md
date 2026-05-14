# 견적서 관리 시스템 고도화 로드맵

MVP(Notion 기반 견적서 조회, PDF 다운로드) 완성 후 관리자 편의 기능과 사용자 경험을 개선하는 고도화 작업 계획서.

## 개요

노션 기반 견적서 관리 시스템의 MVP 완성 이후, 관리자가 직접 시스템을 운영할 수 있는 고도화 기능을 구현하고 프로덕션 환경에 배포하는 것을 목표로 합니다.

- **Phase 1** (완료): 관리자 기능 고도화 — 견적서 목록 조회, 링크 복사, 다크모드
- **Phase 2** (완료): 프로덕션 배포 및 운영 안정화 — 코드 완료, Vercel 배포 수동 작업 필요
- **Phase 3** (완료): 이메일 자동화 및 알림 시스템
- **Phase 4** (진행 중): 고급 관리 기능 — Task 010, 011 완료 / Task 012 범위 외

## 개발 워크플로우

1. **작업 계획**
   - 기존 코드베이스를 파악하고 현재 상태 확인
   - 이 ROADMAP.md에서 다음 작업을 선택
   - 새로운 작업을 추가할 경우 ROADMAP.md 먼저 업데이트

2. **태스크 생성**
   - `/tasks` 디렉토리에 새 태스크 파일 생성
   - 명명 형식: `XXX-description.md` (예: `005-email-notification.md`)
   - 관련 파일, 완료 기준, 구현 단계 포함

3. **태스크 구현**
   - 태스크 파일의 명세서를 따름
   - API/비즈니스 로직 작업 시 Playwright MCP E2E 테스트 필수
   - 각 단계 완료 후 태스크 파일 내 진행 상황 업데이트

4. **로드맵 업데이트**
   - 완료된 태스크는 ✅로 표시

---

## 개발 단계

### Phase 1: 관리자 기능 고도화 ✅

> **완료 기준**: 관리자가 인증 후 견적서 목록을 조회하고, 클라이언트에게 보낼 링크를 복사하며, 다크/라이트 모드를 전환할 수 있다.

#### Task 001: 관리자 인증 시스템 ✅ — 완료

- **예상 소요**: 4–6시간
- **관련 파일**:
  - `src/lib/auth/session.ts` — jose 기반 JWT 생성/검증
  - `src/lib/auth/password.ts` — ADMIN_PASSWORD 환경 변수 비교
  - `src/app/(auth)/admin-login/page.tsx` — 로그인 페이지
  - `src/middleware.ts` — `/admin/*` 라우트 보호, Rate Limiting
- **완료 기준**:
  - [x] `/admin-login` 페이지에서 비밀번호 로그인 가능
  - [x] 인증 성공 시 `admin_session` httpOnly 쿠키 발급 (7일 만료)
  - [x] 미인증 상태로 `/admin/*` 접근 시 `/admin-login`으로 리다이렉트
  - [x] `/api/*` 경로에 Rate Limiting 적용 (분당 10회)
  - [x] 로그아웃 기능 작동

#### Task 002: 관리자 레이아웃 및 대시보드 ✅ — 완료

- **예상 소요**: 3–5시간
- **관련 파일**:
  - `src/app/admin/layout.tsx` — 인증 검증 포함 레이아웃
  - `src/app/admin/page.tsx` — 관리자 대시보드
  - `src/components/admin/admin-header.tsx` — 상단 헤더
  - `src/components/admin/admin-nav.tsx` — 좌측 네비게이션
- **완료 기준**:
  - [x] 관리자 전용 레이아웃 (헤더 + 사이드바 + 메인)
  - [x] 인증된 사용자만 `/admin` 접근 가능
  - [x] 반응형 레이아웃 (모바일에서 사이드바 숨김)

#### Task 003: 견적서 목록 조회 및 관리 ✅ — 완료

- **예상 소요**: 6–8시간
- **관련 파일**:
  - `src/app/admin/invoices/page.tsx` — 견적서 목록 페이지
  - `src/components/admin/invoice-table.tsx` — 테이블 컴포넌트
  - `src/components/admin/search-bar.tsx` — 검색 입력
  - `src/components/admin/filter-panel.tsx` — 상태/날짜 필터
  - `src/components/admin/pagination.tsx` — 커서 기반 페이지네이션
- **완료 기준**:
  - [x] `/admin/invoices`에서 전체 견적서 목록 표시
  - [x] 견적서 번호, 클라이언트명 키워드 검색
  - [x] 상태(대기/승인/거절) 및 날짜 범위 필터링
  - [x] 발행일, 총액 기준 정렬
  - [x] 커서 기반 페이지네이션
  - [x] 로딩 스켈레톤 UI

#### Task 004: 클라이언트 링크 복사 기능 ✅ — 완료

- **예상 소요**: 2–4시간
- **관련 파일**:
  - `src/lib/utils/link-generator.ts` — `generateInvoiceUrl()` 유틸리티
  - `src/components/admin/copy-button.tsx` — 원클릭 복사 버튼
  - `src/components/admin/link-display.tsx` — 링크 표시 컴포넌트
  - `src/components/admin/share-button.tsx` — 이메일/텔레그램 공유 드롭다운
  - `src/hooks/use-clipboard.ts` — 복사 로직 + toast 알림
- **완료 기준**:
  - [x] 견적서 목록 테이블에 링크 컬럼 표시
  - [x] 복사 버튼 클릭 시 클립보드에 URL 복사
  - [x] 복사 성공 시 Check 아이콘으로 2초 변경 후 원복
  - [x] Sonner toast 알림 (성공/실패)
  - [x] 링크 클릭 시 새 탭에서 견적서 열기
  - [x] 이메일, 텔레그램 공유 기능

#### Task 005: 다크모드 구현 ✅ — 완료

- **예상 소요**: 2–4시간
- **관련 파일**:
  - `src/components/providers/theme-provider.tsx` — next-themes ThemeProvider
  - `src/components/theme-toggle.tsx` — 라이트/다크/시스템 전환 버튼
  - `src/app/layout.tsx` — ThemeProvider로 전체 앱 래핑
  - `src/app/globals.css` — `:root`, `.dark` CSS 변수 정의
- **완료 기준**:
  - [x] 관리자 헤더에 테마 토글 버튼 표시
  - [x] 라이트 / 다크 / 시스템 3가지 모드 전환 가능
  - [x] 선택한 테마가 localStorage에 저장되어 새로고침 후 유지
  - [x] 모든 컴포넌트가 시맨틱 색상 변수 사용 (`bg-background`, `text-foreground` 등)
  - [x] `suppressHydrationWarning` 설정으로 Hydration 에러 없음

---

### Phase 2: 프로덕션 배포 및 운영 안정화 ✅

> **완료 기준**: 프로덕션 URL에서 서비스가 정상 작동하고, 에러 모니터링이 구축되어 있다.

#### Task 006: Vercel 프로덕션 배포

- **예상 소요**: 4–8시간
- **작업 내용**:
  - Vercel 프로젝트 연결 및 환경 변수 설정
  - `NOTION_API_KEY`, `NOTION_DATABASE_ID`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `NEXT_PUBLIC_BASE_URL` 설정
  - 커스텀 도메인 연결 (선택)
  - `GET /api/health` 헬스체크 엔드포인트 구현 ✅
  - `docs/deployment-checklist.md` 업데이트 ✅
- **완료 기준** (Vercel 수동 설정 필요):
  - [ ] 프로덕션 URL에서 `/invoice/[id]` 정상 접근
  - [ ] `/admin` 관리자 기능 정상 작동
  - [ ] 환경 변수 모두 설정됨 (서버 시작 시 Zod 검증 통과)
  - [ ] `NEXT_PUBLIC_BASE_URL` 프로덕션 도메인으로 설정 (링크 복사 URL 정확성)

#### Task 007: 에러 모니터링 및 성능 분석 ✅ — 완료

- **예상 소요**: 2–4시간
- **작업 내용**:
  - `@sentry/nextjs` + `instrumentation.ts` 설정 ✅
  - Vercel Analytics (`@vercel/analytics`) 연동 ✅
  - `logger.ts` Sentry captureException 연동 ✅
  - `docs/deployment-checklist.md` 업데이트 ✅
- **완료 기준**:
  - [x] Sentry 설정 완료 (DSN 환경 변수 `NEXT_PUBLIC_SENTRY_DSN` 설정 시 활성화)
  - [x] Vercel Analytics 연동 완료
  - [x] 운영 환경 체크리스트 문서화

---

### Phase 3: 이메일 자동화 및 알림 시스템 ✅

> **완료 기준**: 관리자가 견적서 링크를 이메일로 직접 발송할 수 있고, 만료 임박 견적서를 파악할 수 있다.

#### Task 008: 이메일 발송 연동 ✅ — 완료

- **예상 소요**: 6–10시간
- **관련 파일**:
  - `src/lib/services/email.service.ts` — Resend 이메일 발송 서비스
  - `src/app/api/send-invoice-email/route.ts` — POST API Route
  - `src/components/admin/email-send-dialog.tsx` — 이메일 발송 다이얼로그
  - `src/components/admin/invoice-table.tsx` — 이메일 버튼 추가
  - `src/lib/env.ts` — RESEND_API_KEY, RESEND_FROM_EMAIL 추가
- **완료 기준**:
  - [x] 관리자가 버튼 클릭으로 견적서 링크 이메일 발송
  - [x] 이메일 본문에 견적서 링크, 금액, 만료일 포함
  - [x] 발송 성공/실패 toast 알림
  - [x] Rate Limit으로 스팸 방지 (IP 기준 분당 5회)
- **리스크**: Resend 무료 플랜 월 3,000건 제한. 발송량이 많으면 유료 플랜 필요.

#### Task 009: 견적서 만료 알림 ✅ — 완료

- **예상 소요**: 3–5시간
- **관련 파일**:
  - `src/lib/utils/invoice-helpers.ts` — isExpired, isExpiringSoon, getDaysUntilExpiry
  - `src/components/admin/expiry-badge.tsx` — 만료/D-N 배지 컴포넌트
  - `src/components/admin/invoice-table.tsx` — 유효기간 컬럼에 배지 추가
  - `src/app/admin/page.tsx` — 만료 임박 견적서 섹션 추가
- **완료 기준**:
  - [x] 만료 7일 이내 견적서에 경고 배지 표시 (D-N)
  - [x] 대시보드에 만료 임박 견적서 목록 섹션 표시
  - [x] 만료된 견적서는 빨간 "만료" 배지로 구분

---

### Phase 4: 고급 관리 기능

> **완료 기준**: 통계 대시보드로 비즈니스 현황을 파악할 수 있고, 클라이언트가 견적서를 온라인으로 수락/거절할 수 있다.

#### Task 010: 견적서 통계 대시보드 개선 ✅ — 완료

- **예상 소요**: 6–10시간
- **관련 파일**:
  - `src/lib/services/stats.service.ts` — getInvoiceStats, getMonthlyStats
  - `src/components/admin/stats-cards.tsx` — 4개 통계 카드 + Skeleton
  - `src/components/admin/monthly-chart.tsx` — Recharts BarChart (다크모드 지원)
  - `src/app/admin/page.tsx` — Suspense로 통계 섹션 추가
- **완료 기준**:
  - [x] 전체/대기/승인/거절 건수 카드 표시 (승인율 포함)
  - [x] 최근 3개월 월별 매출 차트 렌더링
  - [x] 다크모드에서 차트 정상 표시 (CSS 변수 사용)

#### Task 011: 클라이언트 온라인 견적 수락/거절 ✅ — 완료

- **예상 소요**: 1–2일
- **관련 파일**:
  - `src/lib/services/invoice.service.ts` — updateInvoiceStatus 추가
  - `src/app/api/invoice/[id]/respond/route.ts` — POST API Route
  - `src/components/invoice/invoice-respond-button.tsx` — 수락/거절 버튼 + 확인 다이얼로그
  - `src/app/invoice/[id]/page.tsx` — pending 상태일 때만 버튼 표시
- **완료 기준**:
  - [x] 클라이언트가 견적서 페이지에서 수락/거절 가능 (pending 상태만)
  - [x] 응답 결과가 Notion DB에 즉시 반영 + 캐시 무효화
  - [x] 중복 응답 방지 (이미 처리된 경우 409 반환)
- **리스크**: 인증 없이 상태를 변경하므로, Rate Limiting으로 24시간 3회 제한 적용.

#### Task 012: 다국어 지원 [불확실]

- **예상 소요**: 1–2일
- **작업 내용**:
  - `next-intl` 설치 및 설정
  - 한국어/영어 메시지 파일 (`messages/ko.json`, `messages/en.json`)
  - 견적서 조회 페이지 다국어 적용 (클라이언트 대상)
- **완료 기준**:
  - [ ] 견적서 URL 파라미터로 언어 선택 가능 (`?lang=en`)
  - [ ] 영어/한국어 레이아웃 정상 렌더링
  - [ ] PDF 생성 시 언어 반영

---

## 기술적 의존성 관계

```
Task 001 (인증)
  └── Task 002 (레이아웃)
        ├── Task 003 (견적서 목록)
        │     └── Task 004 (링크 복사)
        └── Task 005 (다크모드)

Task 006 (배포)
  └── Task 007 (모니터링)

Task 008 (이메일)
  └── Task 009 (만료 알림)

Task 010 (통계)
Task 011 (수락/거절) — Task 001 인증 패턴 참고
Task 012 (다국어) — 독립
```

---

## 전체 체크리스트

### Phase 1 — 관리자 기능 고도화

- [x] 관리자 JWT 인증 및 세션 관리
- [x] 관리자 레이아웃 (헤더, 사이드바)
- [x] 견적서 목록 조회 (`/admin/invoices`)
- [x] 검색/필터/정렬/페이지네이션
- [x] 클라이언트 링크 복사 (CopyButton + Toast)
- [x] 링크 공유 (이메일, 텔레그램)
- [x] 다크모드 (next-themes + CSS 변수)

### Phase 2 — 프로덕션 배포

- [ ] Vercel 프로덕션 배포 (수동 작업)
- [ ] 환경 변수 전체 설정 (수동 작업)
- [x] Sentry 에러 모니터링 코드 연동
- [x] Vercel Analytics 연동
- [x] 헬스체크 API (`GET /api/health`) 구현
- [x] 운영 환경 체크리스트 문서화

### Phase 3 — 이메일 자동화

- [x] Resend 이메일 발송 연동
- [x] 견적서 만료 임박 알림 UI (D-N 배지 + 대시보드 섹션)

### Phase 4 — 고급 기능

- [x] 월별 매출 통계 차트 (Recharts)
- [x] 상태별 통계 카드 (전체/대기/승인/거절)
- [x] 클라이언트 온라인 수락/거절
- [ ] 다국어 지원 (범위 외)

---

## 위험 요소 및 대응 방안

| 위험 요소                                            | 영향도 | 대응 방안                                         |
| ---------------------------------------------------- | ------ | ------------------------------------------------- |
| Notion API Rate Limit (초당 3회)                     | 높음   | `unstable_cache` 60초 TTL + Request Deduplication |
| Vercel 서버리스 인스턴스 재시작 시 Rate Limit 초기화 | 중간   | 문서화 완료. 운영 확장 시 Redis 기반 교체 고려    |
| `NEXT_PUBLIC_BASE_URL` 미설정 시 링크 복사 오작동    | 높음   | 배포 시 환경 변수 체크리스트 필수 확인            |
| Resend 무료 플랜 월 3,000건 제한                     | 중간   | 발송량 모니터링 후 유료 플랜 전환                 |
| 클라이언트 견적 수락/거절 시 중복 응답               | 중간   | 상태 잠금 로직 또는 일회성 토큰 구현              |

---

**문서 버전**: v2.1
**작성일**: 2026-05-14
**최종 업데이트**: 2026-05-15
**현재 진행 상황**: Phase 1~3 완료, Phase 4 진행 중 (11/11 Tasks 완료, Task 012 범위 외)
