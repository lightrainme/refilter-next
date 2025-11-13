"use client";

// NOTE: 아래 shimmer 애니메이션을 쓰려면 globals.css 등에 다음을 추가해줘야 함:
// @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

type Product = {
  productId?: string;
  productName?: string;
  productPrice?: number | string;
  productImage?: string;
  productUrl?: string;
  landingUrl?: string;
  imageUrl?: string;
  image?: string;
  url?: string;
  rating?: number | string;
  ratingAverage?: number | string;
  starScore?: number | string;
  reviewScore?: number | string;
  reviewAvg?: number | string;
  reviewRating?: number | string;
  reviewCount?: number | string;
  pros?: string[];
  cons?: string[];
};

// ✅ Summary API 응답 구조 정의
type SummaryResponse = {
  name: string;
  pros: string[];
  cons: string[];
};

export default function ResultClient() {
  // ✅ URL에서 검색어 추출
  const searchParams = useSearchParams();
  const keyword = decodeURIComponent(searchParams?.get("keyword") || "");

  // ✅ 상태 정의
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [diag, setDiag] = useState("");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const hasFetchedSummary = useRef(false);
  const [currentSummarizing, setCurrentSummarizing] = useState<string>("");

  // ✅ 1단계: 검색어 변경 시 상품 검색 (스트리밍 수신)
  useEffect(() => {
    if (!keyword) return;

    hasFetchedSummary.current = false;
    setLoading(true);
    setItems([]); // 초기화

    (async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: keyword.trim() }),
        });

        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const data = JSON.parse(line);

            if (data.partial) {
              setItems((prev) => {
                const updated = [...prev, data.partial];
                // ✅ 상품 수신 시마다 진행률 업데이트
                setProgress(updated.length);
                return updated;
              });
            } else if (data.total) {
              // ✅ 서버에서 총 개수 전달받으면 total 설정
              setTotal(data.total);
            } else if (data.done) {
              setLoading(false);
            } else if (data.error) {
              console.error("❌ 검색 오류:", data.error);
              setDiag("검색 중 오류가 발생했습니다.");
              setLoading(false);
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("❌ 스트리밍 수신 오류:", err);
        setDiag("검색 데이터를 불러오는 중 문제가 발생했습니다.");
        setLoading(false);
      }
    })();
  }, [keyword]);

  // ---------------------------------------------------------------------------
  // [요약 단계 useEffect]
  // - 검색 결과(items)가 로드된 뒤, 각 상품의 리뷰 요약을 비동기로 요청한다.
  // - 동시에 최대 3개의 요청만 실행(limit = 3)
  // - 각 요청이 완료될 때마다 상태를 즉시 업데이트(setItems)
  // - 진행률(progress)과 현재 요약 중인 상품(currentSummarizing)을 실시간 반영
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (items.length === 0 || hasFetchedSummary.current) return;
    hasFetchedSummary.current = true;

    const startSummaries = () => {
      const limit = 3;
      let active = 0;
      let index = 0;

      const runNext = async () => {
        if (index >= items.length) return;
        const product = items[index++];
        if (!product.productName) return runNext();

        active++;
        setCurrentSummarizing(product.productName);

        try {
          const res = await axios.post<SummaryResponse[]>("/api/summary", {
            productName: product.productName,
          });
          const summaryData = Array.isArray(res.data) ? res.data[0] : res.data;

          setItems((prev) => {
            const updated = prev.map((p) =>
              p.productName === product.productName
                ? { ...p, pros: summaryData?.pros || [], cons: summaryData?.cons || [] }
                : p
            );

            return updated.sort((a, b) => {
              const aDone = a.pros?.length ? 1 : 0;
              const bDone = b.pros?.length ? 1 : 0;
              return bDone - aDone;
            });
          });
        } catch (err) {
          console.error("❌ 요약 실패:", err);
        } finally {
          active--;
          runNext();

          if (index >= items.length && active === 0) {
            setCurrentSummarizing("");
          }
        }
      };

      for (let i = 0; i < limit; i++) {
        runNext();
      }
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(startSummaries);
    } else {
      setTimeout(startSummaries, 50); // fallback for browsers without requestIdleCallback
    }
  }, [items]);

  // ✅ 진행률 계산
  const progressPercent = total > 0 ? Math.round((progress / total) * 100) : 0;

  // ✅ 렌더링
  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-md font-semibold mb-4">
        <span className="text-blue-700">{keyword}</span> 의 검색결과입니다
      </h1>

      {/* 🔹 로딩 상태 */}
      {loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-600">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm mb-2">Refilter가 상품을 불러오고 있어요...</p>
        </div>
      )}

      {/* 🔹 에러 */}
      {!loading && diag && (
        <div className="text-red-500 text-xs mb-3">{diag}</div>
      )}

      {/* 🔹 검색 결과 없음 */}
      {!loading && items.length === 0 && !diag && (
        <p className="text-gray-600">검색 결과가 없습니다.</p>
      )}

      {/* 상단 진행 상태 영역 */}
      {!loading && items.length > 0 && (
        <div className="mb-4">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            ⚡ Refilter가 리뷰 에너지를 모으는 중... {progress}/{total} ({progressPercent}%)
          </p>
          {currentSummarizing && (
            <p className="text-[11px] text-blue-500 italic mt-1">
              지금 <span className="font-semibold">{currentSummarizing}</span> 요약 중...
            </p>
          )}
        </div>
      )}

      {/* 🔹 결과 리스트 */}
      {!loading && items.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-3 text-sm text-gray-600">
            <p>총 {total}개의 상품</p>
            {progress < total && (
              <p>
                {progress}/{total} 요약 중 ({progressPercent}%)
              </p>
            )}
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((item, idx) => {
              const img = item.productImage ?? item.imageUrl ?? item.image ?? "";
              const href = item.productUrl ?? item.landingUrl ?? item.url ?? "#";
              const price = Number(item.productPrice ?? 0);
              const hasSummary =
                (Array.isArray(item.pros) && item.pros.length > 0) ||
                (Array.isArray(item.cons) && item.cons.length > 0);

              return (
                <li
                  key={`${item.productId ?? "noid"}-${idx}`}
                  className={`relative shadow-lg border bg-white rounded-lg p-3 hover:shadow-md transition duration-300 ${
                    hasSummary
                      ? "border-blue-200"
                      : "border-gray-200 bg-[linear-gradient(110deg,#f5f5f5,45%,#ffffff,55%,#f5f5f5)] bg-[length:200%_100%] animate-[shimmer_1.2s_linear_infinite]"
                  }`}
                >
                  <span
                    className={`absolute -top-2 left-2 text-white text-xs font-semibold rounded-full px-2 py-2 shadow ${
                      idx === 0
                        ? "bg-purple-800"
                        : idx === 1
                        ? "bg-indigo-700"
                        : idx === 2
                        ? "bg-green-700"
                        : "bg-gray-400"
                    }`}
                  >
                    {idx + 1}위
                  </span>

                  <span
                    className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-1 rounded-full ${
                      hasSummary
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {hasSummary ? "Refilter 요약 완료 ✅" : "요약 대기 중..."}
                  </span>

                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {img ? (
                      <img
                        src={img}
                        alt={item.productName ?? ""}
                        className="w-full h-48 object-cover mb-2 rounded-md"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 mb-2 rounded-md" />
                    )}
                    <h2 className="text-xs font-medium line-clamp-2 break-keep">
                      {item.productName ?? "(이름 없음)"}
                    </h2>
                    <p className="text-blue-500 text-sm font-medium">
                      {price ? `${price.toLocaleString()}원` : ""}
                    </p>
                  </a>

                  {/* 요약 리스트 */}
                  {hasSummary && (
                    <div className="mt-3 border-t border-gray-100 pt-2 text-sm">
                      {Array.isArray(item.pros) && item.pros.length > 0 && (
                        <div className="mb-1">
                          <h3 className="font-medium text-green-600 mb-1 text-xs">
                            👍 장점
                          </h3>
                          <ul className="list-disc list-inside text-gray-800 text-xs space-y-0.5">
                            {item.pros.map((pro, i) => (
                              <li key={i}>{pro}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(item.cons) && item.cons.length > 0 && (
                        <div>
                          <h3 className="font-medium text-red-500 mb-1 text-xs">
                            👎 단점
                          </h3>
                          <ul className="list-disc list-inside text-gray-800 text-xs space-y-0.5">
                            {item.cons.map((con, i) => (
                              <li key={i}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {progress === total && total > 0 && (
            <p className="text-center text-green-600 mt-4 text-sm">
              모든 상품의 요약이 완료되었습니다 🎉
            </p>
          )}
        </>
      )}
    </main>
  );
}