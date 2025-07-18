import type { NextApiRequest, NextApiResponse } from 'next';
import { generateHmac } from '@/lib/hmacGenerator';
import axios from 'axios';

const DOMAIN = 'https://api-gateway.coupang.com';
const URL = '/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink';

const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY!;
const SECRET_KEY = process.env.COUPANG_SECRET_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const REQUEST = {
    "coupangUrls": [
      "https://www.coupang.com/np/search?component=&q=good&channel=user",
      "https://www.coupang.com/np/coupangglobal"
    ]
  };

  try {
    const authorization = generateHmac('POST', URL, SECRET_KEY, ACCESS_KEY);

    const response = await axios.post(`${DOMAIN}${URL}`, REQUEST, {
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json'
      }
    });

    return res.status(200).json(response.data);
  } catch (error: any) {
    return res.status(500).json({
      error: '쿠팡 API 요청 실패',
      detail: error?.response?.data || error.message,
    });
  }
}