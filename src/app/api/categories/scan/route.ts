import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import axios from "axios";
import { generateHmac } from "@/lib/hmacGenerator";

/**
 * 🔥 Coupang 파트너스 검색 API 기반 자동 카테고리 스캔
 * - 여러 인기 키워드로 검색 API를 호출
 * - 각 상품에서 categoryName / categoryId / categoryIdPath 추출
 * - 고유 카테고리만 모아서 categoryMap.json 자동 생성
 * - Seller API 없이도 쿠팡 카테고리를 자동 구축할 수 있는 방식
 */

/* 샘플 키워드 목록 — 더 정확하고 categoryIdPath가 거의 100% 포함되는 제품명 기반 키워드 리스트 */
const SAMPLE_KEYWORDS = [
  "삼성 75인치 TV",
  "LG OLED TV",
  "다이슨 V15 무선청소기",
  "샤오미 무선청소기 2",
  "아이폰 15 프로 맥스",
  "갤럭시 S24 울트라",
  "아이패드 10세대",
  "맥북 프로 14 M3",
  "시디즈 T50 의자",
  "허리엔 C2 의자",
  "제스파 안마기",
  "발뮤다 토스터기",
  "쿠첸 전기밥솥",
  "쿠쿠 IH 밥솥",
  "브라운 면도기 시리즈9",
  "뉴발란스 1080 v13",
  "아식스 노바블래스트4",
  "나이키 에어맥스 270",
  "샤오미 선풍기 2S",
  "코웨이 공기청정기 AP-1512",
];

/* Coupang 파트너스 API 요청 함수 (search API와 동일한 인증 방식 사용) */
async function coupangSearch(keyword: string) {
  const subId = process.env.COUPANG_SUB_ID || "";

  const method = "GET";
  const pathUrl = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${encodeURIComponent(
    keyword
  )}&limit=50&subId=${subId}`;

  const { authorization } = generateHmac(method, pathUrl);

  try {
    const res = await axios.get(
      `https://api-gateway.coupang.com${pathUrl}`,
      {
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  } catch (error: any) {
    console.error("❌ Coupang Scan API Error:", error.response?.data || error.message);
    throw new Error("쿠팡 API 요청 실패");
  }
}

export async function GET() {
  try {
    const categories: Record<string, { id: number; path: number[] }> = {};

    for (const kw of SAMPLE_KEYWORDS) {
      const json = await coupangSearch(kw);
      const items = json?.data?.productData ?? [];

      for (const item of items) {
        const name = item.categoryName;
        const id = item.categoryId;
        const path = item.categoryIdPath;

        if (name && id && Array.isArray(path)) {
          categories[name] = { id, path };
        }
      }
    }

    const filePath = path.join(process.cwd(), "src", "data", "categoryMap.json");
    const folderPath = path.dirname(filePath);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), "utf-8");

    return NextResponse.json({
      message: "카테고리 자동 스캔 성공",
      count: Object.keys(categories).length,
      categories,
    });
  } catch (err) {
    console.error("🔥 카테고리 스캔 오류:", err);
    return NextResponse.json(
      { error: "카테고리 스캔 실패", detail: String(err) },
      { status: 500 }
    );
  }
}