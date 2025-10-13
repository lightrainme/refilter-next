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
        setDiag(`rCode=${String(rCode ?? "n/a")} · candidates=${productList.length}`);
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
      <h1 className="text-xl font-semibold mb-4">
        검색 결과: <span className="text-blue-700">{keyword}</span>
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
            <li key={`${item.productId ?? "noid"}-${idx}`} className="border rounded-lg p-3 hover:shadow-md">
              <a href={href} target="_blank" rel="noopener noreferrer">
                {img ? (
                  <img src={img} alt={item.productName ?? ""} className="w-full h-48 object-cover mb-2" />
                ) : (
                  <div className="w-full h-48 bg-gray-100 mb-2" />
                )}
                <h2 className="text-sm font-medium line-clamp-2">
                  {item.productName ?? "(이름 없음)"}
                </h2>
                <p className="text-gray-600 mt-1">
                  {price ? `${price.toLocaleString()}원` : ""}
                </p>
              </a>
            </li>
          );
        })}
      </ul>
      <p className="block col-span-full text-gray-500 text-sm mt-6">
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </main>
  );
}

/** Payload에서 productData를 추출하는 함수 */
function extractProducts(payload: any): Product[] {
  const candidates = [
    payload?.data?.productData,
    payload?.data?.data?.productData,
    payload?.productData,
    payload?.results,
    payload?.data?.results,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}
