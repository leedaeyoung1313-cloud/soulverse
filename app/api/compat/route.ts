import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 환경변수
const API_KEY = process.env.GOOGLE_API_KEY || "";
const MODEL = "gemini-1.5-flash";

// Gemini API 호출
async function callGemini(prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 800,
        responseMimeType: "application/json",
      },
    }),
  });

  const raw = await res.text();

  if (!res.ok) throw new Error(raw);

  const data = JSON.parse(raw);
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
}

// POST (리포트 생성)
export async function POST(req: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: true, detail: "GOOGLE_API_KEY 누락" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const prompt = `
사주, MBTI, 혈액형 기반 궁합 리포트. JSON만 반환.

남자: ${body.man_birth}, MBTI=${body.man_mbti}, 혈액형=${body.man_blood}, 시간=${body.man_time}
여자: ${body.woman_birth}, MBTI=${body.woman_mbti}, 혈액형=${body.woman_blood}, 시간=${body.woman_time}

{
 "score": 80,
 "facets": { "정서":80, "소통":80, "현실":70, "성장":90, "지속":80 },
 "summary": "2~3문장",
 "insights": ["1","2","3"],
 "oneliner": "한 문장",
 "explanation": { "정서":"...", "소통":"...", "현실":"...", "성장":"...", "지속":"..." }
}
`;

    const text = await callGemini(prompt);
    const json = JSON.parse(text);

    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json(
      { error: true, detail: err?.message || "서버 오류" },
      { status: 500 }
    );
  }
}

// GET (헬스 체크)
export async function GET() {
  return NextResponse.json({ ok: true, model: MODEL });
}
