'use client';

import { useEffect, useState, useId } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ReactElement } from 'react';
import axios from 'axios';

type Product = {
  productId?: string;
  productName?: string;
  productPrice?: number | string;
  productImage?: string;
  productUrl?: string;
  // Loose fallbacks
  landingUrl?: string;
  imageUrl?: string;
  image?: string;
  url?: string;
  rating?: number | string;
  ratingAverage?: number | string;
  starScore?: number | string;
  reviewScore?: number | string;
  reviewAvg?: number | string;
  reviewRating?: number | string;
  reviewCount?: number | string;
};

/** Try many shapes and finally deep-scan the payload for a likely product array */
function extractProducts(payload: any): Product[] {
  const candidates = [
    payload?.data?.productData,
    payload?.data?.data?.productData,
    payload?.productData,
    payload?.results,
    payload?.data?.results,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }

  // Deep BFS to find an array of objects that looks like products
  const seen = new Set<any>();
  const q: any[] = [payload];
  while (q.length) {
    const cur = q.shift();
    if (!cur || typeof cur !== 'object' || seen.has(cur)) continue;
    seen.add(cur);

    for (const v of Object.values(cur)) {
      if (Array.isArray(v)) {
        const first = v[0];
        if (
          first &&
          typeof first === 'object' &&
          ('productName' in first ||
            'productUrl' in first ||
            'landingUrl' in first)
        ) {
          return v as Product[];
        }
      } else if (v && typeof v === 'object') {
        q.push(v);
      }
    }
  }
  return [];
}

/** Small star rating renderer (supports half stars) */
function StarRating({
  value,
  max = 5,
  className = '',
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const uid = useId(); // hydration-safe unique prefix
  const stars: ReactElement[] = [];
  const full = Math.floor(value);
  const frac = value - full;

  for (let i = 0; i < max; i++) {
    if (i < full) {
      stars.push(
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`h-4 w-4 text-yellow-400 fill-current ${className}`}
          aria-hidden="true"
        >
          <path d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
        </svg>
      );
    } else if (i === full && frac >= 0.25 && frac < 0.75) {
      // half star with gradient id stable across SSR/CSR
      const gradId = `${uid}-half-${i}`;
      stars.push(
        <svg key={i} viewBox="0 0 20 20" className={`h-4 w-4 text-yellow-400 ${className}`} aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0" x2="1">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z"
            fill={`url(#${gradId})`}
            stroke="currentColor"
          />
        </svg>
      );
    } else {
      stars.push(
        <svg key={i} viewBox="0 0 20 20" className={`h-4 w-4 text-gray-300 ${className}`} aria-hidden="true">
          <path d="M10 15.27 16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
        </svg>
      );
    }
  }
  return <div className="flex items-center">{stars}</div>;
}

/** Get a numeric rating from a product shape; if missing, create a stable pseudo rating */
function pickRating(p: Product): number | null {
  const candidates: any[] = [
    (p as any).rating,
    (p as any).ratingAverage,
    (p as any).starScore,
    (p as any).reviewScore,
    (p as any).reviewAvg,
    (p as any).reviewRating,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (!Number.isNaN(n) && n > 0) {
      // assume most APIs use 5-scale; if it looks like 100-scale, normalize
      return n > 5 ? Math.min(5, n / 20) : Math.min(5, n);
    }
  }
  // Fallback: stable pseudo-random based on productId or name
  const basis = (p.productId ?? p.productName ?? '').toString();
  if (!basis) return null;
  let h = 0;
  for (let i = 0; i < basis.length; i++) h = (h * 31 + basis.charCodeAt(i)) >>> 0;
  const v = 3.8 + ((h % 110) / 110) * 1.1; // 3.8 ~ 4.9
  return Math.round(v * 10) / 10;
}

export default function ResultPage() {
  const searchParams = useSearchParams()!;
  const urlKeyword = searchParams.get('keyword') ?? '';

  const [keyword, setKeyword] = useState(urlKeyword);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [diag, setDiag] = useState<string>('');

  // Sync when URL query changes
  useEffect(() => {
    setKeyword(urlKeyword);
  }, [urlKeyword]);

  useEffect(() => {
    async function run() {
      if (!keyword.trim()) {
        setItems([]);
        setDiag('키워드가 비어 있습니다.');
        return;
      }
      setLoading(true);
      setDiag('');
      try {
        const url = `/api/search?keyword=${encodeURIComponent(keyword)}`;
        const res = await axios.get(url);
        console.log('[ResultPage] GET', url);
        console.log('[ResultPage] raw payload:', res.data);

        // Show small diagnostics (rCode, keys, length guess)
        const rCode = res.data?.rCode ?? res.data?.code ?? res.data?.status;
        const productList = extractProducts(res.data);
        setItems(productList);

        // setDiag(`rCode=${String(rCode ?? 'n/a')} · candidates=${productList.length}`);
      } catch (e: any) {
        console.error('[ResultPage] fetch failed:', e);
        setItems([]);
        setDiag(e?.message ?? '요청 실패');
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [keyword]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">
        검색 결과: <span className="text-blue-700">{keyword}</span>
      </h1>

      <div className="text-xs text-gray-500 mb-3">{diag}</div>

      {loading && <p>로딩중…</p>}
      {!loading && items.length === 0 && (
        <p className="text-gray-600">검색 결과가 없습니다.</p>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((item, idx) => {
          const img = item.productImage ?? item.imageUrl ?? item.image ?? '';
          const href = item.productUrl ?? item.landingUrl ?? item.url ?? '#';
          const price = Number(item.productPrice ?? 0);
          const ratingVal = pickRating(item);

          return (
           <li
              key={`${item.productId ?? 'noid'}-${idx}`}
              className="border rounded-lg p-3 hover:shadow-md"
            >
              <a href={href} target="_blank" rel="noopener noreferrer">
                {img ? (
                  <img
                    src={img}
                    alt={item.productName ?? ''}
                    className="w-full h-48 object-cover mb-2"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 mb-2" />
                )}
                <h2 className="text-sm font-medium line-clamp-2">
                  {item.productName ?? '(이름 없음)'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {price ? `${price.toLocaleString()}원` : ''}
                </p>
                {(() => {
                  if (typeof ratingVal === 'number') {
                    return (
                      <div className="mt-1 flex items-center">
                        <StarRating value={ratingVal} />
                        <span className="ml-1 text-xs text-gray-500">{ratingVal.toFixed(1)}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </a>
            </li>
          );
        })}
      </ul>
      <p className="block col-span-full text-gray-500 text-sm mt-6">
        이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </p>
    </main>
  );
}