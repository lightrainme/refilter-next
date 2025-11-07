import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const cachePath = path.join(process.cwd(), "cache", "reviews.json");

function loadCache() {
  if (!fs.existsSync(cachePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(cachePath, "utf8") || "{}");
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, any>) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { productName, productNames } = req.body;

  const names =
    Array.isArray(productNames) && productNames.length > 0
      ? productNames
      : productName
      ? [productName]
      : [];

  if (names.length === 0) {
    return res.status(400).json({ error: "Missing product name(s)" });
  }

  const cache = loadCache();
  const uncached = names.filter((n) => !cache[n]);

  try {
    for (const name of uncached) {
      const prompt = `
아래의 상품 목록을 보고, 각 상품의 소비자 리뷰를 기반으로 장점 3가지와 단점 3가지를 예측해서 요약해줘.
JSON 배열로 아래 형식으로만 출력해줘.

[
  {
    "name": "상품명",
    "pros": ["장점1", "장점2", "장점3"],
    "cons": ["단점1", "단점2", "단점3"]
  }
]

상품 목록:
1. ${name}
      `.trim();

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      let content = completion.choices[0].message?.content || "";
      content = content.replace(/```json|```/gi, "").trim();

      try {
        const parsed = JSON.parse(content);
        parsed.forEach((entry: any) => {
          if (entry?.name && entry?.pros && entry?.cons) {
            cache[entry.name] = entry;
          }
        });
      } catch (e) {
        console.error(`⚠️ GPT JSON 파싱 실패 (상품: ${name})`, e);
      }

      // ✅ 빈 결과일 경우 재시도 로직
      if (!cache[name] || !cache[name].pros?.length || !cache[name].cons?.length) {
        console.log(`🔁 ${name} 재요약 시도 중...`);
        try {
          const retry = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          });

          let retryContent = retry.choices[0].message?.content || "";
          retryContent = retryContent.replace(/```json|```/gi, "").trim();

          const retryParsed = JSON.parse(retryContent);
          if (Array.isArray(retryParsed) && retryParsed[0]?.pros?.length) {
            cache[name] = retryParsed[0];
            console.log(`✅ ${name} 재요약 성공`);
          } else {
            console.log(`❌ ${name} 재요약 실패 (빈 결과)`);
          }
        } catch (retryError) {
          console.error(`❌ ${name} 재요약 중 오류 발생`, retryError);
        }
      }

      if (!cache[name]) {
        cache[name] = { name, pros: [], cons: [] };
      }

      // ✅ 상품 단위로 캐시 병합 및 저장
      const currentCache = loadCache();
      currentCache[name] = cache[name];
      saveCache(currentCache);
    }

    names.forEach((n) => {
      if (!cache[n]) cache[n] = { name: n, pros: [], cons: [] };
    });

    const results = names.map((n) => cache[n] || { pros: [], cons: [] });
    return res.status(200).json(results);
  } catch (error: any) {
    console.error("❌ GPT 요약 실패:", error.message);
    return res.status(500).json({ error: "Failed to generate summaries" });
  }
}