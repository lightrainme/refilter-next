import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import moment from 'moment';

const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY!;
const SECRET_KEY = process.env.COUPANG_SECRET_KEY!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
        return res.status(400).json({error: 'keyword 쿼리 파라미터가 필요합니다.'});
    }

    const method = 'GET';
    const domain = 'https://api-gateway.coupang.com';
    const requestPath = '/v2/providers/affiliate_open_api/apis/openapi/v1/products/search';
    const timestamp = Date.now();
    const query = `?keyword=${encodeURIComponent(keyword)}&limit=5`;
    const urlPath = `${requestPath}${query}`;
    const datetime = moment().utc().format('YYYYMMDDTHHmmss') + 'Z';
    const message = `${datetime}${method}${urlPath}`;

    const signature = crypto
        .createHmac('sha256', SECRET_KEY)
        .update(message)
        .digest('hex');

    const authorizationHeader = `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`;

    console.log('datetime:', datetime);
    console.log('message:', message);
    console.log('signature:', signature);
    console.log('url:', `${domain}${urlPath}`);
    console.log('authorizationHeader:', authorizationHeader);

    const headers = {
        'Authorization': authorizationHeader,
        'Content-Type': 'application/json',
    };

    try {
        const coupangRes = await fetch(`${domain}${urlPath}`, {
            method,
            headers,
        });

        if(!coupangRes.ok) {
            const error = await coupangRes.text();
            return res.status(coupangRes.status).json({error});
        }

        const data = await coupangRes.json();
        return res.status(200).json(data);
    } catch(error: any) {
        return res.status(500).json({ error: '쿠팡 API 호출 실패', detail: error.message})
    }

}
