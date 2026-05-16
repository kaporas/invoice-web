---
name: Phase 6 링크 공유 시스템 완료 상태
description: Task 016 고유 링크 생성 및 표시 시스템 구현 완료 — 관련 파일 위치 및 아키텍처 결정 사항
type: project
---

Task 016 (고유 링크 생성 및 표시 시스템)은 이미 코드베이스에 구현 완료된 상태였음.

**Phase 5까지 완료 (Tasks 001-015)**

**Task 016 구현 파일 목록:**

- `src/lib/utils/link-generator.ts` — `generateInvoiceUrl(invoiceId)`: `env.NEXT_PUBLIC_BASE_URL/invoice/${id}` URL 생성
- `src/hooks/use-clipboard.ts` — `useClipboard()` 커스텀 훅: Clipboard API + execCommand 폴백, sonner toast 연동, 2초 후 상태 리셋
- `src/components/admin/copy-button.tsx` — Client Component: Copy/Check 아이콘 전환, Tooltip 포함
- `src/components/admin/link-display.tsx` — Server Component: URL 40자 초과 시 truncate, 새 탭 링크
- `src/components/admin/share-button.tsx` — Client Component: 이메일/텔레그램 공유 드롭다운, sonner toast

**아키텍처 결정:**

- `invoice-table.tsx`에서 세 컴포넌트를 조합하여 링크 셀 구성
- `link-display`는 Server Component (상호작용 없음), copy/share는 Client Component (클립보드 API 필요)
- `useClipboard` 훅에서 toast 호출 → copy-button이 직접 toast를 import하지 않음

**Why:** 클립보드 API는 클라이언트 전용이므로 Client Component 분리 필수. Server Component 우선 원칙에 따라 link-display는 'use client' 없이 구현.

**How to apply:** Phase 6 Tasks 017-018이 남아있음 (견적서 상태 관리, 알림 시스템).
