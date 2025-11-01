"use client";

import { useEffect, useState } from "react";
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

export default function ResultClient() {
  // 🔍 useSearchParams 훅을 사용해서 URL의 쿼리 파라미터를 가져옴
  // keyword 파라미터를 추출하고, decodeURIComponent로 인코딩된 문자열을 디코딩함
  const searchParams = useSearchParams();
  const keyword = decodeURIComponent(searchParams?.get("keyword") || "");

  // 🧩 상태 선언: 상품 목록, 로딩 상태, 에러 메시지, 진행률 관련 상태들
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [diag, setDiag] = useState("");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  // 🧩 useEffect 훅: keyword가 바뀔 때마다 검색 요청을 실행
  useEffect(() => {
    // keyword가 없으면 아무 작업도 하지 않음
    if (!keyword) return;

    // 비동기 함수로 검색 요청 및 상태 업데이트 처리
    const fetchResults = async () => {
      setLoading(true); // 로딩 상태 시작
      try {
        console.log("🔍 검색 실행 keyword:", keyword);
        // POST 요청으로 /api/search에 keyword 전달
        const res = await axios.post("/api/search", { keyword: keyword.trim() });
        const results = res.data.results || [];
        setItems(results); // 받은 결과를 상태에 저장
        setTotal(results.length); // 전체 결과 개수 저장

        // ✅ 진행률 계산: pros 또는 cons 배열이 하나라도 있으면 요약 완료로 간주
        const completed = results.filter(
          (r: any) =>
            (Array.isArray(r.pros) && r.pros.length > 0) ||
            (Array.isArray(r.cons) && r.cons.length > 0)
        ).length;
        setProgress(completed); // 완료된 개수 상태 업데이트
      } catch (err) {
        console.error("❌ 검색 에러:", err);
        setDiag("검색 중 오류가 발생했습니다."); // 에러 메시지 상태 업데이트
      } finally {
        setLoading(false); // 로딩 상태 종료
      }
    };
    fetchResults();
  }, [keyword]); // keyword가 바뀔 때마다 실행

  // 🔢 진행률을 %로 계산 (전체 결과가 0 이상일 때만 계산)
  const progressPercent = total > 0 ? Math.round((progress / total) * 100) : 0;

  // 🎨 UI 렌더링
  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      {/* 검색 키워드와 결과 안내 */}
      <h1 className="text-md font-semibold mb-4">
        <span className="text-blue-700">{keyword}</span> 의 검색결과입니다
      </h1>

      {/* ✅ 로딩 상태 표시: loading이 true일 때 보여줌 */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-600">
          {/* 로딩 스피너 */}
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm mb-2">Refilter가 상품 리뷰를 분석 중이에요...</p>
          {/* 진행률이 있으면 진행 상황 표시 */}
          {total > 0 && (
            <>
              <p className="text-xs text-gray-500">
                {progress} / {total} 요약 완료 ({progressPercent}%)
              </p>
              <div className="w-48 h-1 mt-2 bg-gray-200 rounded">
                <div
                  className="h-1 bg-blue-500 rounded transition-all"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ✅ 전체 완료 메시지: 로딩이 끝났고, 진행률이 총 개수와 같을 때 표시 */}
      {!loading && progress === total && total > 0 && (
        <div className="text-center text-green-600 text-sm mb-4">
          모든 상품의 요약이 완료되었습니다 🎉
        </div>
      )}

      {/* ✅ 에러 메시지 표시: 로딩 끝났고 diag에 메시지가 있을 때 */}
      {!loading && diag && <div className="text-red-500 text-xs mb-3">{diag}</div>}

      {/* ✅ 검색 결과가 없을 때 메시지 표시: 로딩 끝났고, items가 비었고, 에러도 없을 때 */}
      {!loading && items.length === 0 && !diag && (
        <p className="text-gray-600">검색 결과가 없습니다.</p>
      )}

      {/* ✅ 검색 결과 리스트 렌더링: 로딩 끝났고, items가 하나 이상 있을 때 */}
      {!loading && items.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item, idx) => {
            // 이미지 URL 우선순위로 선택
            const img = item.productImage ?? item.imageUrl ?? item.image ?? "";
            // 링크 URL 우선순위로 선택
            const href = item.productUrl ?? item.landingUrl ?? item.url ?? "#";
            // 가격을 숫자로 변환 (없으면 0)
            const price = Number(item.productPrice ?? 0);
            // hasSummary는 pros나 cons 배열이 하나라도 존재하는지 확인
            // 요약이 완료된 상품인지 판단하는 데 필요함
            const hasSummary =
              (Array.isArray(item.pros) && item.pros.length > 0) ||
              (Array.isArray(item.cons) && item.cons.length > 0);

            return (
              <li
                key={`${item.productId ?? "noid"}-${idx}`}
                className="relative shadow-lg border border-gray-200 bg-white rounded-lg p-3 hover:shadow-md transition"
              >
                {/* 순위 표시: 1~3위는 색상 다르게 표시, 그 외는 회색 */}
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

                {/* ✅ 요약 상태 표시: hasSummary가 true면 요약 완료, 아니면 대기 중 */}
                <span
                  className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-1 rounded-full ${
                    hasSummary
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {hasSummary ? "Refilter 요약 완료 ✅" : "요약 대기 중..."}
                </span>

                {/* 상품 링크 */}
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {/* 이미지가 있으면 보여주고, 없으면 빈 박스 표시 */}
                  {img ? (
                    <img
                      src={img}
                      alt={item.productName ?? ""}
                      className="w-full h-48 object-cover mb-2 rounded-md"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 mb-2 rounded-md" />
                  )}
                  {/* 상품명 */}
                  <h2 className="text-xs font-medium line-clamp-2 break-keep">
                    {item.productName ?? "(이름 없음)"}
                  </h2>
                  {/* 가격: 0이면 빈 문자열 */}
                  <p className="text-blue-500 text-sm font-medium">
                    {price ? `${price.toLocaleString()}원` : ""}
                  </p>
                </a>

                {/* ✅ 요약이 있으면 장점/단점 리스트 표시 */}
                {hasSummary && (
                  <div className="mt-3 border-t border-gray-100 pt-2 text-sm">
                    {/* 장점 리스트 */}
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
                    {/* 단점 리스트 */}
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
      )}
    </main>
  );
}