import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

/**
 * 🔥 Coupang 메인 카테고리 자동 Sync API
 * - 쿠팡 메인페이지를 HTML로 가져와 카테고리 이름 + categoryId 자동 추출
 * - 결과는 /data/categoryMap.json 에 저장
 * - 나중에 TOP10/검색 API에서 categoryId 매핑에 사용됨
 */

export async function GET() {
  try {
    const url = "https://www.coupang.com/";
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
      }
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Coupang main page" },
        { status: 500 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const categoryMap: Record<string, string> = {};

    // 🔍 쿠팡 메인페이지 왼쪽 카테고리 영역 탐색
    // 여러 구조를 동시에 탐지 (쿠팡은 상황별로 DOM이 다르게 나옴)
    $(
      ".gnb-nav-list a, #categoryMenu a, .gnb-top a, .gnb-sub a"
    ).each((_, el) => {
      const name = $(el).text().trim();
      const id = $(el).attr("data-category-id");

      if (name && id) {
        categoryMap[name] = id;
      }
    });

    // 저장 경로: /data/categoryMap.json
    const filePath = path.join(process.cwd(), "src", "data", "categoryMap.json");

    // 폴더 없으면 생성
    const folderPath = path.dirname(filePath);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // JSON 파일 저장
    fs.writeFileSync(filePath, JSON.stringify(categoryMap, null, 2), "utf-8");

    return NextResponse.json({
      message: "카테고리 자동 매핑 성공",
      count: Object.keys(categoryMap).length,
      map: categoryMap,
    });
  } catch (err) {
    console.error("🔥 카테고리 Sync 오류:", err);
    return NextResponse.json({ error: "서버 내부 오류" }, { status: 500 });
  }
}