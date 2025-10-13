// /pages/api/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { generateHmac } from '@/lib/hmacGenerator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const keyword = (req.query.keyword as string) || '';
  const limit = req.query.limit || 10;
  const subId = process.env.COUPANG_SUB_ID || '';

  const method = 'GET';
  const path = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}&subId=${subId}`;

  const { authorization } = generateHmac(method, path);

  try {
    const response = await axios.get(`https://api-gateway.coupang.com${path}`, {
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
    });

    // ✅ 광고상품 제외 + 상위 10개만
    const allProducts = response.data?.data?.productData || [];
    const filteredProducts = allProducts
      .filter((p: any) => !p.isAdvertisingProduct)
      .slice(0, 10);

    // ✅ 클라이언트로 응답
    res.status(200).json({ products: filteredProducts });
  } catch (error: any) {
    console.error('[쿠팡 검색 API 오류]', error.response?.data || error.message);
    res.status(500).json({ error: '쿠팡 검색 API 요청 실패' });
  }
}