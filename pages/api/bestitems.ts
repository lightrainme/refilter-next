// pages/api/bestitems.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { generateHmac } from '@/lib/hmacGenerator';

// 카테고리 목록
const categories: Record<number, string> = {
  1001: '여성패션',
  1002: '남성패션',
  1010: '뷰티',
  1011: '출산/유아동',
  1012: '식품',
  1013: '주방용품',
  1014: '생활용품',
  1015: '홈인테리어',
  1016: '가전디지털',
  1017: '스포츠/레저',
  1018: '자동차용품',
  1019: '도서/음반/DVD',
  1020: '완구/취미',
  1021: '문구/오피스',
  1024: '헬스/건강식품',
  1025: '국내여행',
  1026: '해외여행',
  1029: '반려동물용품',
  1030: '유아동패션',
};

const DOMAIN = 'https://api-gateway.coupang.com';
const LIMIT = '1';
const SUB_ID = '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const method = 'GET';
    const results: any[] = [];

    for (const [categoryId, categoryName] of Object.entries(categories)) {
      const path = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/bestcategories/${categoryId}`;
      const query = `limit=${LIMIT}&subId=${SUB_ID}`;
      const fullPath = `${path}?${query}`;
      const fullUrl = `${DOMAIN}${fullPath}`;

      const { authorization, timestamp } = generateHmac('GET', fullPath);

      console.log('📦 요청 URL:', fullUrl);
      console.log('🪪 Authorization:', authorization);
      const response = await fetch(fullUrl, {
        method,
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
        },
      });

      console.log('📦 응답 상태:', response.status);

      const data = await response.json();
      console.log('📨 응답 데이터:', data);

      // 응답 성공시 상품 1개만 push
      if (data && data.data && data.data.length > 0) {
        const item = data.data[0];
        results.push({
          categoryId,
          categoryName,
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          productImage: item.productImage,
          productUrl: item.productUrl,
        });
      }
    }

    res.status(200).json({ results });
  } catch (err: any) {
    console.error('❌ Error fetching best items:', err);
    res.status(500).json({ error: 'Best item API 호출 중 오류 발생', detail: err.message, status: err?.response?.status || null });
  }
}