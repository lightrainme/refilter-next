// /pages/api/search.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import fs from "fs";
import path from "path";
import { generateHmac } from "@/lib/hmacGenerator";

// ✅ 캐시 파일 (GPT 요약 캐싱용)
const cachePath = path.join(process.cwd(), "cache", "reviews.json");
function loadCache() {
  if (!fs.existsSync(cachePath)) return {};
  return JSON.parse(fs.readFileSync(cachePath, "utf-8") || "{}");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const keyword =
    (req.method === "POST"
      ? (req.body.keyword as string)
      : (req.query.keyword as string)) || "";
  const limit = req.query.limit || 10;
  const subId = process.env.COUPANG_SUB_ID || "";

  if (!keyword) {
    return res.status(400).json({ error: "keyword is required" });
  }

  const method = "GET";
  const pathUrl = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${encodeURIComponent(
    keyword
  )}&limit=${limit}&subId=${subId}`;
  const { authorization } = generateHmac(method, pathUrl);

  try {
    // ✅ 쿠팡 API 요청
    const coupangRes = await axios.get(`https://api-gateway.coupang.com${pathUrl}`, {
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
    });

    // ✅ 광고상품 제외 + 상위 10개
    const allProducts = coupangRes.data?.data?.productData || [];
    const products = allProducts.filter((p: any) => !p.isAdvertisingProduct).slice(0, 10);

    // ✅ 캐시 로드
    const cache = loadCache();

    // ✅ 캐시에 없는 상품만 모음
    const uncached = products.filter((p: any) => !cache[p.productName]);
    const uncachedNames = uncached.map((p: any) => p.productName);

    // ✅ 한 번에 요약 요청 (ResultClient에서 처리하므로 서버에서는 비활성화)
    let summaries: Record<string, any> = {};
    /*
    if (uncachedNames.length > 0) {
      try {
        const summaryRes = await axios.post("http://localhost:3000/api/summary", {
          productNames: uncachedNames,
        });

        const dataArray = Array.isArray(summaryRes.data) ? summaryRes.data : [];
        summaries = uncachedNames.reduce((acc, name, idx) => {
          acc[name] = dataArray[idx];
          return acc;
        }, {} as Record<string, any>);
      } catch (err) {
        console.error("❌ Refilter 요약 요청 실패:", err);
      }
    }
    */

    // ✅ 캐시 + 새 요약 결합
    const enriched = products.map((product: any) => {
      const name = product.productName;
      const summary = cache[name] || summaries[name] || { pros: [], cons: [] };
      return { ...product, ...summary };
    });

    // ✅ 클라이언트로 응답
    return res.status(200).json({ results: enriched });
  } catch (error: any) {
    console.error("❌ Search API Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "쿠팡 검색 API 요청 실패" });
  }
}