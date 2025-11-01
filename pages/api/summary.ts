// pages/api/summary.ts
import fs from "fs";
import path from "path";
import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

// ✅ OpenAI 클라이언트 (Refilter 요약용)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ✅ 캐시 파일 경로: 실제 요약 결과 저장
const CACHE_PATH = path.join(process.cwd(), "cache", "reviews.json");

// ✅ 캐시 로드
function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) return {};
  return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8") || "{}");
}

// ✅ 캐시 저장
function saveCache(cache: Record<string, any>) {
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
}

// ✅ 이름 유사도 매칭: GPT가 이름을 살짝 바꿔도 원래 제품명으로 매칭
function findClosestName(name: string, candidates: string[]) {
  if (!name) return "";
  const cleaned = name.replace(/\s/g, "").toLowerCase();

  // 1) 완전 일치 우선
  const exact = candidates.find(
    (n) => n.replace(/\s/g, "").toLowerCase() === cleaned
  );
  if (exact) return exact;

  // 2) 부분 포함 매칭
  const partial = candidates.find((n) => {
    const nc = n.replace(/\s/g, "").toLowerCase();
    return nc.includes(cleaned) || cleaned.includes(nc);
  });
  if (partial) return partial;

  // 3) 그래도 없으면 원래 이름 반환
  return name;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ POST만 허용
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ✅ body 에서 productNames 또는 productName 추출
  const body = req.body || {};
  // search.ts 에서 productName 한 개만 보내더라도 호환되도록 함
  const productNames: string[] = Array.isArray(body.productNames)
    ? body.productNames
    : body.productName
    ? [body.productName]
    : [];

  if (productNames.length === 0) {
    return res.status(400).json({ error: "productNames is required" });
  }

  // ✅ 캐시 읽기
  const cache = loadCache();

  // ✅ 이미 요약된 제품은 빼고, 정말 새로 요약해야 하는 것만 추림
  const uncached = productNames.filter((name) => !cache[name]);

  // ✅ 전부 캐시에 있으면 그대로 리턴
  if (uncached.length === 0) {
    const results = productNames.map((name) => cache[name]);
    console.log(`⚡ Refilter 캐시 히트(전체): ${productNames.length}개`);
    return res.status(200).json(results);
  }

  try {
   // ✅ 여러 제품을 한 번에 요약하도록 프롬프트 구성 (제품 종류 무관)
const prompt = `
아래의 각 제품은 서로 다른 종류의 상품(예: 스마트폰, 케이블, 케이스 등)일 수 있습니다.
각 제품마다 독립적으로 실제 사용자 리뷰를 참고한 것처럼 장점(pros)과 단점(cons)을 요약해 주세요.

⚠️ 주의사항:
- 각 제품을 서로 비교하거나 묶지 마세요.
- 모든 제품에 반드시 하나 이상의 장점과 단점을 포함해야 합니다.
- 반드시 JSON 배열 형식으로만 응답하세요.
형식 예시:
[
  { "name": "제품명1", "pros": ["장점1", "장점2"], "cons": ["단점1"] },
  { "name": "제품명2", "pros": ["장점1"], "cons": ["단점1", "단점2"] }
]

제품 목록:
${uncached.map((n) => `- ${n}`).join("\n")}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    const raw = response.choices[0].message?.content?.trim() || "[]";

    // ✅ GPT가 ```json 으로 감쌌을 때 제거
    const cleaned = raw
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    let parsed: any[] = [];
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.warn("⚠️ Refilter 응답 JSON 파싱 실패, fallback 적용");
      // GPT가 형식 어기면 우리가 직접 만든다
      parsed = uncached.map((name) => ({
        name,
        pros: ["리뷰 데이터가 부족합니다."],
        cons: ["추가 정보 수집 중입니다."],
      }));
    }

    // ✅ 파싱된 결과를 캐시에 저장 (이름 유사도 매칭 포함)
    parsed.forEach((item) => {
      if (!item || !item.name) return;
      const matchedName = findClosestName(item.name, uncached);
      cache[matchedName] = {
        pros: Array.isArray(item.pros) ? item.pros : [],
        cons: Array.isArray(item.cons) ? item.cons : [],
        lastUpdated: new Date().toISOString(),
      };
    });

    // ✅ GPT가 일부 제품을 아예 안 돌려준 경우 → 기본값으로 채움
    uncached.forEach((name) => {
      if (!cache[name]) {
        cache[name] = {
          pros: ["리뷰 데이터가 부족합니다."],
          cons: ["추가 정보 수집 중입니다."],
          lastUpdated: new Date().toISOString(),
        };
      }
    });

    // ✅ 캐시 저장
    saveCache(cache);

    console.log(`💾 Refilter 요약 저장 완료: ${uncached.length}개 제품`);

    // ✅ 요청 순서 그대로 응답 배열 만들어서 반환
    const results = productNames.map((name) => cache[name]);
    return res.status(200).json(results);
  } catch (error: any) {
    console.error("❌ Refilter 요약 실패:", error);
    return res.status(500).json({ error: "Failed to summarize products" });
  }
}