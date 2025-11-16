import { NextResponse } from "next/server";

/**
 * 🔥 카테고리별 TOP10 상품 API (임시 버전)
 * - 클라이언트에서 `/api/categories/top-products?category=가전디지털`
 *   이런 식으로 요청하면 1~10위 데이터를 반환.
 * - 현재는 샘플 데이터로 구성되어 있으며,
 *   이후 Coupang 검색/베스트 API로 실제 데이터 연동 예정.
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = decodeURIComponent(searchParams.get("category") || "");

    if (!category) {
      return NextResponse.json(
        { error: "category 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    // 🚧 샘플 데이터 (TOP10)
    // 추후 실제 데이터 연동 시 여기서 API 호출 or 크롤링 적용
    const sampleProducts = Array.from({ length: 10 }, (_, idx) => ({
      rank: idx + 1,
      name: `${category} 인기상품 ${idx + 1}`,
      productId: `sample-${idx + 1}`,
      price: (idx + 1) * 10000,
      image: "https://via.placeholder.com/150",
    }));

    return NextResponse.json({
      category,
      products: sampleProducts,
    });
  } catch (err) {
    console.error("🔥 카테고리 TOP10 API 오류:", err);
    return NextResponse.json(
      { error: "서버 내부 오류" },
      { status: 500 }
    );
  }
}
