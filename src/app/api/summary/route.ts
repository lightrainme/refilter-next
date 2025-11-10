import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

// ✅ 캐시 만료일 설정 (단위: 일)
// 연우가 이 숫자만 바꾸면 자동 갱신 주기를 쉽게 변경할 수 있습니다.
const CACHE_TTL_DAYS = 7;

// ✅ OpenAI 클라이언트 초기화
// process.env.OPENAI_API_KEY 환경변수에서 API 키를 읽어옵니다.
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ 캐시 파일 경로 설정
// 프로젝트 루트(process.cwd()) 기준으로 cache/reviews.json 파일을 저장합니다.
const cachePath = path.join(process.cwd(), "cache", "reviews.json");

// ✅ 캐시 로드 함수
// 캐시 파일이 존재하면 JSON으로 읽어오고, 없으면 빈 객체 반환
function loadCache() {
  if (!fs.existsSync(cachePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(cachePath, "utf8") || "{}");
  } catch {
    return {};
  }
}

// ✅ 캐시 저장 함수
// 디렉토리가 없을 경우 생성하고 JSON 파일로 저장
function saveCache(cache: Record<string, any>) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf8");
}

// ✅ 캐시 만료 여부를 계산하는 함수
function isExpired(item: any) {
  if (!item?.updatedAt) return true;
  const now = new Date();
  const updatedAt = new Date(item.updatedAt);
  const diffDays = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > CACHE_TTL_DAYS;
}

// ✅ POST 요청 핸들러
// 상품 이름(하나 또는 여러 개)을 받아 각 상품의 리뷰 요약(장점/단점)을 생성합니다.
export async function POST(req: NextRequest) {
  // 클라이언트에서 보낸 JSON 요청 바디 파싱
  const body = await req.json();
  const { productName, productNames, refresh } = body;

  // productNames가 배열이면 그대로 사용, 단일 productName이면 배열로 변환
  const names =
    Array.isArray(productNames) && productNames.length > 0
      ? productNames
      : productName
      ? [productName]
      : [];

  // ✅ 필수값 검증
  if (names.length === 0) {
    return NextResponse.json({ error: "Missing product name(s)" }, { status: 400 });
  }

  // 기존 캐시 로드
  const cache = loadCache();

  // ✅ 갱신이 필요한 상품 필터링
  // - 캐시가 없거나
  // - TTL(7일)을 초과했거나
  // - refresh=true로 강제 갱신 요청된 경우
  const uncached = names.filter(
    (n) => !cache[n] || isExpired(cache[n]) || refresh === true
  );

  try {
    // 캐시되지 않았거나 만료된 상품만 GPT 요청 실행
    for (const name of uncached) {
      // GPT 프롬프트: 주어진 상품 이름을 기반으로 리뷰의 장단점 예측
      const prompt = `
아래의 상품 목록을 보고, 각 상품의 소비자 리뷰를 기반으로 장점 3가지와 단점 3가지를 예측해서 요약해줘.
JSON 배열로 아래 형식으로만 출력해줘.

[
  {
    "name": "상품명",
    "pros": ["장점1", "장점2", "장점3"],
    "cons": ["단점1", "단점2", "단점3"]
  }
]

상품 목록:
1. ${name}
      `.trim();

      // ✅ OpenAI GPT 호출 (gpt-4o-mini 모델 사용)
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      // GPT 응답 텍스트 정리 및 JSON 파싱
      let content = completion.choices[0].message?.content || "";
      content = content.replace(/```json|```/gi, "").trim();

      try {
        const parsed = JSON.parse(content);
        parsed.forEach((entry: any) => {
          if (entry?.name && entry?.pros && entry?.cons) {
            cache[entry.name] = {
              ...entry,
              updatedAt: new Date().toISOString(), // ✅ 캐시 생성일 기록
            };
          }
        });
      } catch (e) {
        console.error(`⚠️ GPT JSON 파싱 실패 (상품: ${name})`, e);
      }

      // ✅ GPT가 올바른 JSON을 반환하지 않거나 빈 배열일 경우 재시도
      if (!cache[name] || !cache[name].pros?.length || !cache[name].cons?.length) {
        console.log(`🔁 ${name} 재요약 시도 중...`);
        try {
          const retry = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          });

          let retryContent = retry.choices[0].message?.content || "";
          retryContent = retryContent.replace(/```json|```/gi, "").trim();

          const retryParsed = JSON.parse(retryContent);
          if (Array.isArray(retryParsed) && retryParsed[0]?.pros?.length) {
            cache[name] = {
              ...retryParsed[0],
              updatedAt: new Date().toISOString(),
            };
            console.log(`✅ ${name} 재요약 성공`);
          } else {
            console.log(`❌ ${name} 재요약 실패 (빈 결과)`);
          }
        } catch (retryError) {
          console.error(`❌ ${name} 재요약 중 오류 발생`, retryError);
        }
      }

      // 캐시가 여전히 비어있다면 기본값 저장
      if (!cache[name]) {
        cache[name] = { name, pros: [], cons: [], updatedAt: new Date().toISOString() };
      }

      // ✅ 상품 단위로 캐시 병합 및 저장
      const currentCache = loadCache();
      currentCache[name] = cache[name];
      saveCache(currentCache);
    }

    // 요청된 상품들에 대한 캐시 결과 반환
    const results = names.map((n) => cache[n] || { pros: [], cons: [] });
    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error("❌ GPT 요약 실패:", error.message);
    return NextResponse.json({ error: "Failed to generate summaries" }, { status: 500 });
  }
}