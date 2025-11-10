import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import fs from "fs";
import path from "path";
import { generateHmac } from "@/lib/hmacGenerator";

// ✅ 캐시 파일 경로 설정 (GPT 요약 캐싱용)
// process.cwd()는 프로젝트 루트 경로를 반환합니다.
const cachePath = path.join(process.cwd(), "cache", "reviews.json");

// ✅ 캐시 TTL 설정 (단위: 일)
const CACHE_TTL_DAYS = 7;

// ✅ 캐시 로드 함수
// 캐시 파일이 존재하면 JSON으로 파싱해 반환하고, 없으면 빈 객체 반환
function loadCache() {
  if (!fs.existsSync(cachePath)) return {};
  return JSON.parse(fs.readFileSync(cachePath, "utf-8") || "{}");
}

// ✅ 캐시 만료 여부 판단 함수
function isExpired(item: any) {
  if (!item?.updatedAt) return true;
  const now = new Date();
  const updatedAt = new Date(item.updatedAt);
  const diffDays = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > CACHE_TTL_DAYS;
}

// ✅ Next.js App Router용 POST 핸들러
// 상품 검색어(keyword)를 받아 쿠팡 오픈API를 호출한 뒤 결과를 반환합니다.
export async function POST(req: NextRequest) {
  // 요청 본문에서 keyword, limit, refresh 추출
  const { keyword, limit = 10, refresh = false } = await req.json();
  const subId = process.env.COUPANG_SUB_ID || "";

  if (!keyword) {
    return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  }

  // ✅ HMAC 인증 헤더 생성
  const method = "GET";
  const pathUrl = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${encodeURIComponent(
    keyword
  )}&limit=${limit}&subId=${subId}`;
  const { authorization } = generateHmac(method, pathUrl);

  try {
    // ✅ 쿠팡 오픈 API 호출
    const coupangRes = await axios.get(`https://api-gateway.coupang.com${pathUrl}`, {
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
    });

    // ✅ 광고 상품 제거 후 상위 10개만 사용
    const allProducts = coupangRes.data?.data?.productData || [];
    const products = allProducts.filter((p: any) => !p.isAdvertisingProduct).slice(0, 10);

    // ✅ 캐시 로드
    const cache = loadCache();

    // ✅ 갱신이 필요한 상품(캐시 없음, 만료, 강제 갱신 요청)
    const uncached = products.filter(
      (p: any) => !cache[p.productName] || isExpired(cache[p.productName]) || refresh
    );
    const uncachedNames = uncached.map((p: any) => p.productName);

    // ✅ 만료 또는 신규 항목은 /api/summary에 재요청
    if (uncachedNames.length > 0) {
      try {
        const summaryRes = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/summary`, {
          productNames: uncachedNames,
          refresh, // 강제 갱신 파라미터 전달
        });
        const summaries = Array.isArray(summaryRes.data) ? summaryRes.data : [];

        // ✅ 새로 받아온 요약을 캐시에 병합
        summaries.forEach((s: any) => {
          if (!s?.name) return;
          cache[s.name] = {
            ...s,
            updatedAt: new Date().toISOString(),
          };
        });

        // ✅ 캐시 파일 업데이트
        fs.mkdirSync(path.dirname(cachePath), { recursive: true });
        fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf8");
      } catch (err) {
        console.error("❌ 요약 요청 실패:", err);
      }
    }

    // ✅ 캐시 + 새 요약 결합
    const enriched = products.map((product: any) => {
      const name = product.productName;
      // 캐시에 저장된 요약 정보를 결합
      const summary = cache[name] || { pros: [], cons: [] };
      return { ...product, summary };
    });

    // ✅ 최종 결과 반환
    return NextResponse.json({ results: enriched }, { status: 200 });
  } catch (error: any) {
    // API 요청 실패 시 오류 로그 출력
    console.error("❌ Search API Error:", error.response?.data || error.message);
    return NextResponse.json({ error: "쿠팡 검색 API 요청 실패" }, { status: 500 });
  }
}

// ✅ GET 요청도 지원하도록 별도 핸들러 추가
// 클라이언트에서 쿼리 파라미터를 직접 전달할 경우 사용됩니다.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword") || "";
  const limit = searchParams.get("limit") || "10";
  const subId = process.env.COUPANG_SUB_ID || "";

  if (!keyword) {
    return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  }

  const method = "GET";
  const pathUrl = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${encodeURIComponent(
    keyword
  )}&limit=${limit}&subId=${subId}`;
  const { authorization } = generateHmac(method, pathUrl);

  try {
    const coupangRes = await axios.get(`https://api-gateway.coupang.com${pathUrl}`, {
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
    });

    const allProducts = coupangRes.data?.data?.productData || [];
    const products = allProducts.filter((p: any) => !p.isAdvertisingProduct).slice(0, 10);

    const cache = loadCache();

    const enriched = products.map((product: any) => {
      const name = product.productName;
      const summary = cache[name] || { pros: [], cons: [] };
      return { ...product, summary };
    });

    return NextResponse.json({ results: enriched }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Search API Error:", error.response?.data || error.message);
    return NextResponse.json({ error: "쿠팡 검색 API 요청 실패" }, { status: 500 });
  }
}