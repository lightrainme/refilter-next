import type { NextApiRequest, NextApiResponse } from 'next';
import { generateHmac } from '@/lib/hmacGenerator';

const domain = 'https://api-gateway.coupang.com';
const path = '/v2/providers/affiliate_open_api/apis/openapi/products/search';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const keyword = req.method === 'GET' ? req.query.keyword : req.body.keyword;

  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: 'keyword 파라미터가 필요합니다.' });
  }

  try {
    const method = 'GET';
    const queryString = new URLSearchParams({
      keyword,
      limit: '10',
    }).toString();

    const { authorization, timestamp }: { authorization: string; timestamp: string } = await generateHmac(method, path);

    const fullUrl = `${domain}${path}?${queryString}`;

    // ✅ 디버깅 로그
    console.log("✅ HMAC Signature Debug Info:");
    console.log("timestamp:", timestamp);
    console.log("method:", method);
    console.log("path:", path);
    console.log("full request URL:", fullUrl);
    console.log("authorization header:", authorization);

    const response = await fetch(fullUrl, {
      method,
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
    });

    console.log("response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    return res.status(200).json({ keyword, data });
  } catch (error: any) {
    console.error("❌ API 호출 에러:", error);
    return res.status(500).json({
      error: 'API 호출 중 오류 발생',
      detail: error.message,
    });
  }
}