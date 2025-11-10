// ✅ /api/categories/best-products/route.ts
// 쿠팡 Open API에서 대표 6개 카테고리의 베스트 상품(1위)을 가져오고
// 각 상품명 기반으로 GPT를 이용해 장점/단점 3줄씩 요약 생성 + 캐시 적용 (재발 방지 JSON 처리)

import { NextResponse } from "next/server";
import { generateHmac } from "@/lib/hmacGenerator";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ 간단 캐시 (서버 메모리 내 저장)
const summaryCache = new Map<string, { pros: string[]; cons: string[] }>();

// ✅ 대표 카테고리 6개 (프론트 카드 노출용)
const categories: Record<number, string> = {
  1016: "가전디지털",
  1010: "뷰티",
  1013: "주방용품",
  1014: "생활용품",
  1001: "패션",
  1029: "반려동물용품",
};

const DOMAIN = "https://api-gateway.coupang.com";
const LIMIT = "1";
const SUB_ID = "";

export async function GET() {
  try {
    const method = "GET";

    // 카테고리별 요청 병렬 처리
    const categoryPromises = Object.entries(categories).map(async ([categoryId, categoryName]) => {
      const path = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/bestcategories/${categoryId}`;
      const query = `limit=${LIMIT}&subId=${SUB_ID}`;
      const fullPath = `${path}?${query}`;
      const fullUrl = `${DOMAIN}${fullPath}`;
      const { authorization } = generateHmac(method, fullPath);

      const response = await fetch(fullUrl, {
        method,
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      const item = data?.data?.[0];
      if (!item) return null;

      let summary = summaryCache.get(item.productName);
      if (summary) {
        console.log(`⚡ 캐시 HIT: ${item.productName}`);
      } else {
        console.log(`🧠 GPT 요약 생성: ${item.productName}`);

        const prompt = `
        "${item.productName}" 제품에 대한 일반적인 소비자 리뷰를 바탕으로,
        장점(pros) 3가지와 단점(cons) 3가지를 JSON 형식으로 작성해줘.
        형식 예시:
        {
          "pros": ["장점1", "장점2", "장점3"],
          "cons": ["단점1", "단점2", "단점3"]
        }
        간결하게 써줘. 광고문체는 제외.
        `;

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          });

          const rawContent = completion.choices[0].message?.content ?? "";

          // ✅ GPT 응답에서 코드블록(````json```) 제거
          const cleaned = rawContent
            .replace(/```json/i, "")
            .replace(/```/g, "")
            .trim();

          let parsed: any;
          try {
            parsed = JSON.parse(cleaned);
          } catch (parseErr) {
            console.warn("⚠️ JSON.parse 실패. GPT 응답 원문:", cleaned);
            parsed = { pros: ["요약 생성 실패"], cons: ["요약 생성 실패"] };
          }

          summary = {
            pros: parsed.pros?.slice(0, 3) || [],
            cons: parsed.cons?.slice(0, 3) || [],
          };
          summaryCache.set(item.productName, summary);
        } catch (error) {
          console.error("❌ GPT 요약 실패:", error);
          summary = {
            pros: ["요약 생성 실패"],
            cons: ["요약 생성 실패"],
          };
        }
      }

      return {
        categoryName,
        productName: item.productName,
        productImage: item.productImage,
        productPrice: item.productPrice,
        ratingAverage: item.ratingAverage,
        reviewCount: item.reviewCount,
        productUrl: item.productUrl,
        summary,
      };
    });

    const cards = (await Promise.all(categoryPromises)).filter(Boolean);
    console.log(`✅ 총 ${cards.length}개 베스트 상품 반환`);

    return NextResponse.json({ cards });
  } catch (err: any) {
    console.error("❌ Error fetching best products:", err);
    return NextResponse.json(
      { error: "카테고리 베스트 상품 조회 실패", detail: err.message },
      { status: 500 }
    );
  }
}