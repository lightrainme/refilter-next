"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

// Product 타입 정의 그대로 옮기기
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
};

export default function ResultClient() {
  const searchParams = useSearchParams()!;
  const keyword = searchParams.get("keyword") ?? "";
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [diag, setDiag] = useState("");

  useEffect(() => {
    async function run() {
      if (!keyword) return;
      setLoading(true);
      try {
        const url = `/api/search?keyword=${encodeURIComponent(keyword)}`;
        const res = await axios.get(url);
        console.log("[ResultPage] GET", url);
        console.log("[ResultPage] raw payload:", res.data);

        const rCode = res.data?.rCode ?? res.data?.code ?? res.data?.status;
        const productList = extractProducts(res.data);
        setItems(productList);
        //setDiag(`rCode=${String(rCode ?? "n/a")} · candidates=${productList.length}`);
      } catch (e: any) {
        console.error("[ResultPage] fetch failed:", e);
        setItems([]);
        setDiag(e?.message ?? "요청 실패");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [keyword]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-md font-semibold mb-4">
        <span className="text-blue-700">{keyword}</span> 의 검색결과입니다
      </h1>

      <div className="text-xs text-gray-500 mb-3">{diag}</div>

      {loading && <p>로딩중…</p>}
      {!loading && items.length === 0 && (
        <p className="text-gray-600">검색 결과가 없습니다.</p>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((item, idx) => {
          const img = item.productImage ?? item.imageUrl ?? item.image ?? "";
          const href = item.productUrl ?? item.landingUrl ?? item.url ?? "#";
          const price = Number(item.productPrice ?? 0);

          return (
            <li
              key={`${item.productId ?? "noid"}-${idx}`}
              className="relative shadow-lg border border-gray-200 bg-white rounded-lg p-3 hover:shadow-md"
            >
              {/* ✅ 순위 뱃지 (1~3위 색상 강조) */}
              <span
                className={`absolute -top-2 left-2 text-white text-xs font-semibold rounded-full px-2 py-2 shadow ${
                  idx === 0
                    ? "bg-purple-800" // 🥇 1위 - 금색
                    : idx === 1
                    ? "bg-indigo-700"   // 🥈 2위 - 은색
                    : idx === 2
                    ? "bg-green-700" // 🥉 3위 - 동색
                    : "bg-gray-400"  // 일반 순위 - 기본 노란색
                }`}
              >
                {idx + 1}위
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
            </li>
          );
        })}
      </ul>
    </main>
  );
}

/** Payload 안에서 첫 번째 배열 형태의 product 리스트를 자동 탐색하는 함수 */
function extractProducts(payload: any): Product[] {
  // 재귀적으로 탐색하면서 배열을 찾는 내부 함수
  function findArray(obj: any): any[] | null {
    if (!obj || typeof obj !== "object") return null;
    // 배열이면 바로 반환
    if (Array.isArray(obj)) return obj;

    // 객체의 모든 키 순회하며 탐색
    for (const key of Object.keys(obj)) {
      const found = findArray(obj[key]);
      if (found) return found;
    }
    return null;
  }

  // 탐색 시작
  const result = findArray(payload);

  if (Array.isArray(result)) return result;
  console.warn("[extractProducts] 배열 형태를 찾지 못했습니다:", payload);
  return [];
}
