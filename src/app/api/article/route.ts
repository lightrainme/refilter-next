import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { productName, reviews, productImage } = await req.json();

    if (!productName || !reviews) {
      return NextResponse.json(
        { error: "productName과 reviews가 필요합니다." },
        { status: 400 }
      );
    }

    // ✅ 슬러그 정규화 (한글 깨짐 방지)
    const slug = productName.toLowerCase().replace(/\s+/g, "-").normalize("NFC");

    // ✅ GPT 프롬프트 작성
    const prompt = `
아래의 실제 사용자 리뷰를 참고하여 '${productName}' 제품에 대한 블로그 아티클을 작성해주세요.
문체는 따뜻하지만 신뢰감 있게, 광고처럼 느껴지지 않게 써주세요.
제품 리뷰:
${reviews.slice(0, 5).join("\n")}
`;

    console.log("🧠 Generating article for:", productName);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion.choices[0].message?.content || "";

    // ✅ 결과 객체
    const article = {
      slug,
      productName,
      productImage: productImage || "",
      content,
      createdAt: new Date().toISOString(),
    };

    // ✅ 자동 저장 (파일 생성)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const saveUrl = `${baseUrl}/api/article-data/${slug}`;
    console.log("🧠 Saving article to:", saveUrl);

    const saveResponse = await fetch(saveUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(article),
    });

    console.log("📦 Save response status:", saveResponse.status);

    return NextResponse.json(article);
  } catch (error) {
    console.error("❌ article API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}