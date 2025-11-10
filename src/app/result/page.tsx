'use client';

import { Suspense } from 'react';
import ResultClient from './ResultClient';

/**
 * 🧭 [파일 역할 요약]
 *
 * 이 파일은 Next.js App Router 기준에서
 * `/result` 경로로 접근했을 때 최초로 실행되는 **페이지 진입점(page.tsx)** 입니다.
 *
 * - 클라이언트 컴포넌트(`ResultClient`)를 Suspense로 감싸
 *   로딩 중일 때 fallback UI를 먼저 보여줍니다.
 * - 실제 데이터 요청 및 화면 렌더링 로직은 전부 `ResultClient.tsx`가 담당합니다.
 */

export default function ResultPage() {
  return (
    /**
     * 🌀 Suspense
     * - React의 내장 컴포넌트로, 하위 클라이언트 컴포넌트가 로드될 때까지
     *   대기(fallback) UI를 표시합니다.
     * - 여기서는 ResultClient가 초기화되기 전, 간단한 로딩 스피너를 표시합니다.
     */
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-12 text-gray-600">
          {/* 🔹 Tailwind를 이용한 로딩 스피너 애니메이션 */}
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm">검색 결과를 불러오는 중입니다...</p>
        </div>
      }
    >
      {/* 🔹 클라이언트 컴포넌트: 실제 검색 및 요약 로직을 담당 */}
      <ResultClient />
    </Suspense>
  );
}

/**
 * 📘 [정리 요약]
 * - 이 페이지는 단순히 클라이언트 로직을 감싸는 '껍데기' 역할을 합니다.
 * - 데이터 로딩, 요약 처리, 렌더링은 전부 ResultClient 내부에서 수행됩니다.
 * - Suspense의 fallback은 사용자에게 “앱이 작동 중”임을 시각적으로 알려줍니다.
 *
 * ✅ 요약하면:
 *   "ResultPage는 문을 열고, ResultClient가 그 안에서 모든 걸 처리한다."
 */