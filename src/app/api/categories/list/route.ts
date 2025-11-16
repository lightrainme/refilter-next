import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src/data/categoryMap.json");

    const raw = fs.readFileSync(filePath, "utf8"); // Node 내장함수: 파일 읽기
    const categories = JSON.parse(raw);            // JSON.parse: 문자열 → 객체

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("카테고리 파일 로드 실패:", err);
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}