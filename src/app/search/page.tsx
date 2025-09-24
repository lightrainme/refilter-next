'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const router = useRouter();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    router.push(`/result?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-500 to-indigo-600">
      <div className="max-w-xl mx-auto pt-28 px-6">
        {/* 로고: 비율 유지 + 반응형 */}
        <div className="relative w-48 sm:w-56 md:w-64 aspect-[3/1] mx-auto mb-8">
          <Image src="/logo.svg" alt="로고" fill className="object-contain" priority />
        </div>

        {/* 중앙 검색창 (결과는 없음) */}
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="flex-1 border px-4 py-3 rounded-md bg-white"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
          >
            검색
          </button>
        </form>
      </div>
    </div>
  );
}