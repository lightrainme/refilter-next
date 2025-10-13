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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-xl mx-auto pt-28 px-6">
        {/* 로고: 비율 유지 + 반응형 */}
        <div className="flex-column justify-items-center">
          <div className="relative w-30 h-30 rounded-full aspect-[1/1]">
            <Image src="/human-ai-shadow.png" alt="캐릭터" fill className="absolute bottom-0 left-1/2 -translate-x-1  object-cover scale-100" />
          </div>
          <div className="relative w-50 md:w-60 lg:w-70 h-20 mx-auto">
            <Image src="/logo.svg" alt="로고" fill className="object-fit" priority />
          </div>
          <p className="text-center text-gray-800 mb-5">신뢰성 있는 리뷰를 필터링 해드립니다</p>
        </div>

        {/* 중앙 검색창 (결과는 없음) */}
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="검색어를 입력해주세요 ex.아이폰"
            className="flex-1 border border-gray-200 px-4 py-3 rounded-md bg-white placeholder-gray-400"
          />
          <button
            type="submit"
            className="cursor-pointer px-6 py-2 rounded-md bg-purple-900 shadow hover:bg-indigo-900 text-white border-purple-950"
          >
            검색
          </button>
        </form>
      </div>
    </div>
  );
}