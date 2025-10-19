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
        <div className="relative flex-column justify-center justify-items-center w-full">
          <div className="relative block w-full h-30">
              <Image src="/human-ai-shadow.png" alt="캐릭터" fill style={{ objectFit:'contain', objectPosition:'center', }}className="realtive" />
          </div>
          <div className="relative w-full h-15 mt-1 mb-1">
              <Image src="/logo.svg" alt="로고" fill
              style={{ objectFit:'contain', objectPosition:'center', }} 
              className="object-fit object-center" priority />
          </div>
          <p className="text-center text-gray-800 mb-5">신뢰성 있는 리뷰를 필터링 해드립니다</p>
        </div>

        {/* 중앙 검색창 (결과는 없음) */}
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="검색어를 입력해주세요 ex.아이폰"
            className="flex-1 border box-border border-gray-200 px-4 py-3 rounded-md bg-white placeholder-gray-400"
          />
          <button
            type="submit"
            className="cursor-pointer box-border px-6 py-2 rounded-md bg-purple-900 shadow hover:bg-indigo-900 text-white border-purple-950"
          >
            검색
          </button>
        </form>
      </div>
    </div>
  );
}