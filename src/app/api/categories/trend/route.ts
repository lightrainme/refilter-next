

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const CACHE_DIR = path.join(process.cwd(), "cache");
const CACHE_FILE = path.join(CACHE_DIR, "category-trend.json");

// 캐시 로드
function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) return {};
  return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
}

// 캐시 저장
function saveCache(cache: any) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
}

// 캐시 만료 여부 (24시간)
function isExpired(updatedAt: string) {
  const now = Date.now();
  const then = new Date(updatedAt).getTime();
  const diffHours = (now - then) / (1000 * 60 * 60);
  return diffHours >= 24;
}

export async function POST(req: NextRequest) {
  try {
    const { categoryName } = await req.json();

    if (!categoryName) {
      return NextResponse.json(
        { error: "categoryName is required" },
        { status: 400 }
      );
    }

    // 1) 캐시 확인
    const cache = loadCache();
    const cached = cache[categoryName];

    if (cached && !isExpired(cached.updatedAt)) {
      return NextResponse.json({
        trendKeyword: cached.trendKeyword,
        cached: true
      });
    }

    // 2) GPT 요청
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
"${categoryName}" 카테고리에서 한국 소비자들이 최근 실제로 많이 검색한 단일 키워드 하나만 출력해줘.

규칙:
- 키워드 한 개만 출력
- 설명 금지
- 번호 금지
- 줄바꿈 금지
- 브랜드명 금지
- 예시: "에어프라이어 추천", "가성비 무선청소기", "주방 정리 아이템"

오직 키워드만 출력.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.7
    });

    const rawContent = response.choices[0].message.content as string; // GPT 응답을 문자열로 단언
    const trendKeyword = rawContent.trim(); // 공백 제거

    // 3) 캐시에 저장
    cache[categoryName] = {
      trendKeyword,
      updatedAt: new Date().toISOString()
    };
    saveCache(cache);

    // 4) 반환
    return NextResponse.json({
      trendKeyword,
      cached: false
    });
  } catch (error) {
    return NextResponse.json(
      { error: "category-trend API server error", detail: String(error) },
      { status: 500 }
    );
  }
}