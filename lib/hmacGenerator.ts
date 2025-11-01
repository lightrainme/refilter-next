import crypto from 'crypto';

export function generateHmac(method: string, fullPath: string, query: string = "") {
  const accessKey = process.env.COUPANG_ACCESS_KEY || '';
  const secretKey = process.env.COUPANG_SECRET_KEY || '';

  const [path, queryString] = fullPath.split('?');
  const now = new Date();
  const timestamp = `${now.getUTCFullYear().toString().slice(2)}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}T${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}Z`;

  const message = timestamp + method + path + (queryString || '');

  const signature = crypto.createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');

  const authorization = `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${timestamp}, signature=${signature}`;

  return { authorization, timestamp };
}