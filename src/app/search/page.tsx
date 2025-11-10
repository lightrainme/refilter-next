'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, FormEvent, useEffect } from 'react';

/**
 * 🧭 [파일 역할 요약]
 * - 이 컴포넌트는 Refilter의 "검색 메인 페이지"입니다.
 * - 사용자는 여기서 검색어를 입력하고 `/result` 페이지로 이동합니다.
 * - 동시에 하단에는 "카테고리별 베스트 1위 상품"을 불러와 미리 보여줍니다.
 */

export default function SearchPage() {
  // ✅ 검색어 상태
  const [keyword, setKeyword] = useState('');

  // ✅ 베스트 상품 목록 상태
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // 로딩 상태 추가

  const router = useRouter();

  // ✅ 검색 실행 함수
  const onSubmit = (e: FormEvent) => {
    e.preventDefault(); // 기본 폼 제출(페이지 새로고침) 방지
    if (!keyword.trim()) return; // 공백만 있을 경우 무시
    router.push(`/result?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  // ✅ 페이지 마운트 시 베스트상품 불러오기
  useEffect(() => {
    const fetchBestProducts = async () => {
      try {
        const res = await fetch('/api/categories/best-products');
        const data = await res.json();
        setCards(data.cards || []);
      } catch (err) {
        console.error('🔥 Failed to fetch best products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBestProducts();
  }, []);

  // ✅ JSX 렌더링
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto pt-28 px-6">
        {/* ==========================================================
            🟣 [상단 로고 + 안내문구 섹션]
           ========================================================== */}
        <div className="relative flex-column justify-center items-center text-center mb-8">
          {/* 캐릭터 이미지 */}
          <div className="relative w-full h-32">
            <Image
              src="/human-ai-shadow.png"
              alt="Refilter 캐릭터"
              fill
              style={{ objectFit: 'contain', objectPosition: 'center' }}
            />
          </div>

          {/* 로고 이미지 */}
          <div className="relative w-full h-16 mt-2 mb-2">
            <Image
              src="/logo.svg"
              alt="Refilter 로고"
              fill
              style={{ objectFit: 'contain', objectPosition: 'center' }}
              priority
            />
          </div>

          <p className="text-gray-800 mb-5">신뢰성 있는 리뷰를 필터링 해드립니다</p>
        </div>

        {/* ==========================================================
            🟢 [검색창 섹션]
           ========================================================== */}
        <form onSubmit={onSubmit} className="flex gap-2 mb-12 justify-center">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="검색할 상품명을 입력하세요 (예: 아이폰, 커피머신)"
            className="flex-1 max-w-md border border-gray-200 px-4 py-3 rounded-md bg-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <button
            type="submit"
            className="px-6 py-2 rounded-md bg-purple-900 shadow hover:bg-indigo-900 text-white border border-purple-950"
          >
            검색
          </button>
        </form>

        {/* ==========================================================
            🟡 [카테고리 베스트 상품 섹션]
           ========================================================== */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
            카테고리별 베스트 1위 상품
          </h2>

          {/* 로딩 상태일 때 스피너 표시 */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm">베스트 상품을 불러오는 중입니다...</p>
            </div>
          ) : cards.length === 0 ? (
            <p className="text-gray-500 text-center animate-pulse">
              베스트 상품 데이터를 찾을 수 없습니다.
            </p>
          ) : (
            // ✅ 카드가 있을 때 렌더링
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {cards.map((item, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg shadow-md p-4 flex flex-col items-center bg-white transition-transform hover:scale-105 hover:shadow-lg"
                >
                  {/* 카테고리명 표시 (optional) */}
                  {item.categoryName && (
                    <p className="text-xs text-gray-500 mb-1">{item.categoryName}</p>
                  )}

                  {/* 상품 이미지 */}
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-48 h-48 object-contain mb-4"
                  />

                  <div className="text-center">
                    {/* 상품명 */}
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                      {item.productName}
                    </h3>

                    {/* 가격 정보 */}
                    <p className="text-gray-700 font-bold mb-1">
                      {item.productPrice.toLocaleString()}원
                    </p>

                    {/* ✅ 요약 정보 표시 */}
                    {item.summary ? (
                      <div className="text-left text-sm text-gray-700 mt-3">
                        <p className="font-semibold text-green-700">긍정리뷰</p>
                        <ul className="list-disc list-inside mb-2">
                          {item.summary.pros.map((p: string, i: number) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                        <p className="font-semibold text-red-700">부정리뷰</p>
                        <ul className="list-disc list-inside">
                          {item.summary.cons.map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      // 요약이 아직 생성되지 않은 경우
                      <div className="animate-pulse text-gray-400 text-sm mt-3">
                        AI가 리뷰를 분석 중입니다...
                      </div>
                    )}

                    {/* 쿠팡 링크 */}
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