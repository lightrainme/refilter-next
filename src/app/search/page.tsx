'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, FormEvent, useEffect } from 'react';

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [cards, setCards] = useState<any[]>([]);
  const router = useRouter();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    router.push(`/result?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  // ✅ 베스트상품 데이터 로드
  useEffect(() => {
    const fetchBestProducts = async () => {
      try {
        const res = await fetch('/api/categories/best-products');
        const data = await res.json();
        setCards(data.cards || []);
      } catch (err) {
        console.error('🔥 Failed to fetch best products:', err);
      }
    };
    fetchBestProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto pt-28 px-6">
        {/* 로고 섹션 */}
        <div className="relative flex-column justify-center items-center text-center mb-8">
          <div className="relative w-full h-32">
            <Image
              src="/human-ai-shadow.png"
              alt="캐릭터"
              fill
              style={{ objectFit: 'contain', objectPosition: 'center' }}
            />
          </div>
          <div className="relative w-full h-16 mt-2 mb-2">
            <Image
              src="/logo.svg"
              alt="로고"
              fill
              style={{ objectFit: 'contain', objectPosition: 'center' }}
              priority
            />
          </div>
          <p className="text-gray-800 mb-5">신뢰성 있는 리뷰를 필터링 해드립니다</p>
        </div>

        {/* 중앙 검색창 */}
        <form onSubmit={onSubmit} className="flex gap-2 mb-12 justify-center">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="검색어를 입력해주세요 ex.아이폰"
            className="flex-1 max-w-md border border-gray-200 px-4 py-3 rounded-md bg-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <button
            type="submit"
            className="px-6 py-2 rounded-md bg-purple-900 shadow hover:bg-indigo-900 text-white border border-purple-950"
          >
            검색
          </button>
        </form>

        {/* 🏆 카테고리 베스트 상품 섹션 */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
            카테고리별 베스트 1위 상품
          </h2>

          {cards.length === 0 ? (
            <p className="text-gray-500 text-center animate-pulse">상품을 불러오는 중...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {cards.map((item, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg shadow-md p-4 flex flex-col items-center bg-white transition-transform hover:scale-105 hover:shadow-lg"
                >
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-48 h-48 object-contain mb-4"
                  />
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                      {item.productName}
                    </h3>
                    <p className="text-gray-700 font-bold mb-1">
                      {item.productPrice.toLocaleString()}원
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      ⭐ {item.ratingAverage ?? '0'} ({item.reviewCount ?? 0})
                    </p>

                    {/* ✅ 요약 표시 or 스켈레톤 */}
                    {item.summary ? (
                      <div className="text-left text-sm text-gray-700 mt-3">
                        <p className="font-semibold text-green-700">👍 장점</p>
                        <ul className="list-disc list-inside mb-2">
                          {item.summary.pros.map((p: string, i: number) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                        <p className="font-semibold text-red-700">👎 단점</p>
                        <ul className="list-disc list-inside">
                          {item.summary.cons.map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="animate-pulse text-gray-400 text-sm mt-3">
                        AI가 리뷰를 분석 중입니다...
                      </div>
                    )}

                    <a
                      href={item.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      쿠팡에서 보기
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}