'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../../components/Header';

type Product = {
  productUrl: string;
  productImage: string;
  productName: string;
  productPrice: number;
};

export default function ResultClient({ initialKeyword }: { initialKeyword: string }) {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const keyword = initialKeyword.trim();
    if (!keyword) return;

    const run = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/search?keyword=${encodeURIComponent(keyword)}`);
        const productList = res.data?.data?.productData;
        setResults(Array.isArray(productList) ? productList : []);
      } catch (e) {
        console.error(e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [initialKeyword]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-200">
      <Header initialKeyword={initialKeyword} />
      {/* 아래는 동일 */}
    </div>
  );
}