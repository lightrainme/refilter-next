'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type HeaderProps = {
  initialKeyword?: string;
};

export default function Header({ initialKeyword = '' }: HeaderProps) {
  const [kw, setKw] = useState(initialKeyword);
  const router = useRouter();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!kw.trim()) return;
    router.push(`/result?keyword=${encodeURIComponent(kw.trim())}`);
  };

  return (
    <header className="w-full bg-gray-100 backdrop-blur">
      <div className="max-w-5xl mx-auto flex items-center gap-4 p-4">
        {/* 로고 */}
        <div 
          className="relative w-32 h-10 cursor-pointer"
          onClick={() => router.push('/search')}
        >
          <Image src="/logo.svg" alt="로고" fill className="object-contain" priority />
        </div>

        {/* 검색창 */}
        <form onSubmit={onSubmit} className="flex-1 flex gap-2">
          <input
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="flex-1 border px-4 py-2 rounded-md bg-white placeholder-gray-400flex-1 border border-gray-200 px-4 py-3 rounded-md bg-white placeholder-gray-400"
          />
          <button
            type="submit"
            className="cursor-pointer px-6 py-2 rounded-md bg-purple-900 shadow hover:bg-indigo-900 text-white border-purple-950"
          >
            검색
          </button>
        </form>
      </div>
    </header>
  );
}