import Image from "next/image";
import { Metadata } from "next";
import { notFound } from "next/navigation";

// ✅ 데이터 가져오기 함수
async function getArticle(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/article-data/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

// ✅ SEO 메타데이터
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    return { title: "리뷰를 찾을 수 없습니다 - Refilter" };
  }

  return {
    title: `${article.productName} 리뷰 요약 - Refilter`,
    description: article.content.slice(0, 120) + "...",
    openGraph: {
      images: article.productImage ? [article.productImage] : [],
    },
  };
}

// ✅ 페이지 렌더링
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return notFound();

  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        {article.productName}
      </h1>

      {article.productImage && (
        <div className="mb-8 flex justify-center">
          <Image
            src={article.productImage}
            alt={`${article.productName} 이미지`}
            width={600}
            height={400}
            className="rounded-lg shadow-md object-contain"
          />
        </div>
      )}

      <article className="prose max-w-none leading-relaxed whitespace-pre-wrap">
        {article.content}
      </article>
    </main>
  );
}