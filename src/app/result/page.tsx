'use client';

import { Suspense } from 'react';
import ResultClient from './ResultClient';

/**
 * 🧭 [파일 역할 요약]
 * 
 * 이 파일은 Next.js App Router 기준에서
 * `/result` 경로로 접근했을 때 최초로 실행되는 **페이지 진입점 (page.tsx)** 이다.
 *
 * - 서버에서 처음 렌더링되지만, 실제 데이터 로직은 전부 클라이언트 컴포넌트(`ResultClient`)가 담당.
 * - Suspense를 이용해 클라이언트 로드 전 로딩 상태를 표시.
 * - 여기서는 props 전달 없이 `<ResultClient />`를 감싸기만 하면 된다.
 */

export default function ResultPage() {
  return (
    <Suspense fallback={<div>로딩중...</div>}>
      {/* 🔹 클라이언트 측에서 검색 → /api/search 호출 → 결과 표시 */}
      <ResultClient />
    </Suspense>
  );
}

/**
 * 📘 [정리 요약]
 * - `page.tsx`는 Next.js의 **페이지 라우트 기준 파일**이다.
 * - 클라이언트 컴포넌트는 직접 서버 데이터를 가져올 수 없기 때문에,
 *   실제 로직은 `ResultClient.tsx` 안에서 수행한다.
 * - Suspense는 클라이언트가 준비될 때까지 fallback UI(로딩중...)을 보여주는 역할이다.
 *
 * ✅ 간단히 말하면:
 *   "page.tsx는 문을 열고, ResultClient가 안에서 모든 걸 처리한다."
 */