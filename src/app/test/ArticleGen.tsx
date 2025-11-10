"use client";

import { useState } from "react";
import axios from "axios";

export default function ArticleGen() {
  const [productName, setProductName] = useState("");
  const [reviews, setReviews] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ✅ AI 아티클 생성 함수
  const handleGenerate = async () => {
    if (!productName) {
      alert("제품명을 입력해주세요!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const reviewArray = reviews
        .split("\n")
        .filter((r) => r.trim().length > 0)
        .slice(0, 10); // 최대 10개까지만 전달

      const res = await axios.post("/api/article", {
        productName,
        reviews: reviewArray,
      });

      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("아티클 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">🧠 Refilter AI 아티클 생성 테스트</h1>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block font-semibold mb-1">제품명</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="예: 아이폰 16 프로"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">리뷰 내용 (줄바꿈으로 구분)</label>
          <textarea
            value={reviews}
            onChange={(e) => setReviews(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 h-40"
            placeholder={`좋아요!\n배터리가 오래가요\n발열이 좀 있어요`}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? "생성 중..." : "AI 아티클 생성"}
        </button>
      </div>

      {result && (
        <div className="border-t pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-3">✅ 생성 결과</h2>
          <p className="text-sm text-gray-500 mb-4">slug: {result.slug}</p>

          <pre className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-[15px] leading-relaxed">
            {result.content}
          </pre>

          <a
            href={`/articles/${result.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-blue-600 font-semibold hover:underline"
          >
            → 생성된 아티클 페이지 열기
          </a>
        </div>
      )}
    </main>
  );
}