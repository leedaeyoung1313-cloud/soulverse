// app/api/compat/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------
// 1) 환경변수 로딩
// ---------------------------
const RAW_MODEL = (process.env.GEMINI_MODEL || "").trim();
const API_KEY   = (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "").trim();

// Google Gemini API base
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// ---------------------------
// 2) 환경변수 sanity check
// ---------------------------

// 허용되는 모델 리스트
const VALID_MODELS = new Set([
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
  "gemini-pro-vision"
]);

// 모델 사전 검증
let MODEL = RAW_MODEL;

// "models/" 붙은 경우 자동 정정
if (MODEL.startsWith("models/")) {
  MODEL = MODEL.replace(/^models\//, "");
}

// 잘못된 모델명이라면 즉시 에러 반환
if (!VALID_MODELS.has(MODEL)) {
  console.error("[SOULVERSE] INVALID MODEL:", MODEL);
  console.error("[SOULVERSE] Valid models:", [...VALID_MODELS].join(", "));

  export async function POST() {
    return NextResponse.json({
      error: true,
      detail: `환경변수 GEMINI_MODEL 값이 잘못되었습니다: "${MODEL}". 아래 중 하나여야 합니다: ${[
        ...VALID_MODELS,
      ].join(", ")}`
    }, { status: 500 });
  }

  export async function GET() {
    return NextResponse.json({ 
      error: true,
      detail: `환경변수 GEMINI_MODEL 값이 잘못되었습니다: "${MODEL}"` 
    });
  }

  // 조기 종료
  throw new Error("Invalid Gemini model name");
}

// API_KEY 누락 체크
if (!API_KEY) {
  console.error("[SOULVERSE] API KEY MISSING");
  export async function POST() {
    return NextResponse.json({
      error: true,
      detail: "환경변수 GOOGLE_API_KEY / GEMINI_API_KEY 가 설정되지 않았습니다."
    }, { status: 500 });
  };
  throw new Error("Missing Gemini API Key");
}

// ---------------------------
// 3) Gemini 호출 함수
// ---------------------------
async function callGemini(prompt: string) {
  const url = `${BASE_URL}/models/${MODEL}:generateContent?key=${API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 800,
        topP: 0.9,
        responseMimeType: "application/json"
      }
    })
  });

  const raw = await res.text();
  if (!res.ok) {
    console.error("[SOULVERSE] Gemini Error:", raw);
    throw new Error(raw);
  }

  const data = JSON.parse(raw);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
}

// ---------------------------
// 4) POST 핸들러
// ---------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // prompt 구성
    const prompt = `
사주 + MBTI + 혈액형 기반 궁합 분석.
JSON만 출력.

남자: ${body.man_birth}, ${body.man_mbti}, ${body.man_blood || "미상"}, ${body.man_time || "미상"}
여자: ${body.woman_birth}, ${body.woman_mbti}, ${body.woman_blood || "미상"}, ${body.woman_time || "미상"}

{
 "score": 80,
 "facets": { "정서":80, "소통":80, "현실":70, "성장":90, "지속":80 },
 "summary": "2문장",
 "insights": ["A","B","C"],
 "oneliner": "한 문장",
 "explanation": { "정서":"...", "소통":"...", "현실":"...", "성장":"...", "지속":"..." }
}
`;

    const result = await callGemini(prompt);

    return NextResponse.json(JSON.parse(result));
  } catch (err: any) {
    console.error("[SOULVERSE] API ERROR:", err?.message);
    return NextResponse.json({
      error: true,
      detail: err?.message || "서버 오류"
    }, { status: 500 });
  }
}

// ---------------------------
// 5) GET = 헬스체크
// ---------------------------
export async function GET() {
  return NextResponse.json({
    ok: true,
    model: MODEL
  });
}
