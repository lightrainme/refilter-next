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
  const { keyword, limit = 10, refresh = false } = await req.json();
  const subId = process.env.COUPANG_SUB_ID || "";

  if (!keyword) {
    return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  }

  const method = "GET";
  const pathUrl = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${encodeURIComponent(
    keyword
  )}&limit=${limit}&subId=${subId}`;
  const { authorization } = generateHmac(method, pathUrl);

  // 스트리밍 응답 생성
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
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

      // ✅ 총 상품 개수 먼저 전송 (클라이언트 진행률 계산용)
      writer.write(encoder.encode(JSON.stringify({ total: products.length }) + "\n"));

      // ✅ 1. 상품 리스트를 먼저 스트림으로 즉시 전송
      for (const product of products) {
        const name = product.productName;
        const summary = cache[name] || { pros: [], cons: [] };
        const enrichedProduct = { ...product, summary };
        writer.write(encoder.encode(JSON.stringify({ partial: enrichedProduct }) + "\n"));
      }

      // ✅ 2. 백그라운드에서 요약 업데이트 수행
      (async () => {
        for (const product of products) {
          const name = product.productName;
          let summary = cache[name];
          if (!summary || isExpired(summary) || refresh) {
            try {
              const summaryRes = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/summary`, {
                productNames: [name],
                refresh,
              });
              const summaries = Array.isArray(summaryRes.data) ? summaryRes.data : [];
              if (summaries[0]) {
                summary = {
                  ...summaries[0],
                  updatedAt: new Date().toISOString(),
                };
                cache[name] = summary;
                fs.mkdirSync(path.dirname(cachePath), { recursive: true });
                fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf8");
              }
            } catch (err) {
              console.error("❌ GPT 요약 실패:", err);
            }
          }
        }
      })();

      // ✅ 3. 모든 리스트 전송 완료 후 종료 신호 전송
      writer.write(encoder.encode(JSON.stringify({ done: true }) + "\n"));
    } catch (error: any) {
      console.error("❌ Search API Error:", error.response?.data || error.message);
      writer.write(encoder.encode(JSON.stringify({ error: "쿠팡 검색 API 요청 실패" }) + "\n"));
    } finally {
      writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Transfer-Encoding": "chunked",
    },
  });
}

export async function GET() {
  // ✅ Next.js prefetch가 GET /api/search를 호출할 때 400 오류를 막기 위한 안전한 응답
  return NextResponse.json({ ok: true });
}