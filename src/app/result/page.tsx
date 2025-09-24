'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

export default function ResultPage() {
  const searchParams = useSearchParams();
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

        setDiag(`rCode=${String(rCode ?? 'n/a')} · candidates=${productList.length}`);
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

          return (
            <li
              key={(item.productId ?? item.productName ?? idx).toString()}
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
              </a>
            </li>
          );
        })}
      </ul>
    </main>
  );
}