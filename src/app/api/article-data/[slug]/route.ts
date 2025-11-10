import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ✅ Node.js 환경 강제 실행

// ✅ 저장 폴더 경로 설정
const DATA_DIR = path.join(process.cwd(), "data/articles");

// ✅ 아티클 읽기
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const normalizedSlug = slug.normalize("NFC"); // ✅ 한글 정규화
  const filePath = path.join(DATA_DIR, `${normalizedSlug}.json`);

  try {
    const file = await fs.readFile(filePath, "utf-8");
    const article = JSON.parse(file);
    return NextResponse.json(article);
  } catch (error) {
    console.error("❌ 파일 읽기 오류:", error);
    return NextResponse.json(
      { error: "해당 아티클을 찾을 수 없습니다." },
      { status: 404 }
    );
  }
}

// ✅ 아티클 저장
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const normalizedSlug = slug.normalize("NFC"); // ✅ 한글 정규화
  const body = await req.json();
  const { productName, content } = body;

  if (!normalizedSlug || !content) {
    return NextResponse.json(
      { error: "slug와 content가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const filePath = path.join(DATA_DIR, `${normalizedSlug}.json`);
    await fs.writeFile(
      filePath,
      JSON.stringify(
        {
          slug: normalizedSlug,
          productName,
          content,
          createdAt: new Date().toISOString(),
        },
        null,
        2
      ),
      "utf-8"
    );
    return NextResponse.json({ message: "저장 완료", slug: normalizedSlug });
  } catch (error) {
    console.error("❌ 파일 저장 오류:", error);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}