import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** -------------------------------------------------------
 * 1) 환경변수 로딩 + 모델 검증
 * ------------------------------------------------------*/
const RAW_MODEL = (process.env.GEMINI_MODEL || "").trim();
const API_KEY =
  (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "").trim();

const VALID_MODELS = new Set([
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
  "gemini-pro-vision"
]);

// models/ 붙으면 제거
let MODEL = RAW_MODEL.replace(/^models\//, "");

// API KEY 누락
if (!API_KEY) {
  export async function POST() {
    return NextResponse.json(
      { error: true, detail: "GOOGLE_API_KEY / GEMINI_API_KEY 누락" },
      { status: 500 }
    );
  };
  export async function GET() {
    return NextResponse.json({ error: true, detail: "API KEY 누락" });
  };
  throw new Error("API Key Missing");
}

// MODEL 누락
if (!MODEL) {
  MODEL = "gemini-1.5-flash";
}

// MODEL 유효성 검사
const MODEL_VALID = VALID_MODELS.has(MODEL);


/** -------------------------------------------------------
 * 2) Gemini API 호출 함수 (v1)
 * ------------------------------------------------------*/
async function callGemini(prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 800,
        responseMimeType: "application/json"
      }
    })
  });

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(raw);
  }

  const data = JSON.parse(raw);
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    JSON.stringify(data);

  return text;
}


/** -------------------------------------------------------
 * 3) POST: 실제 AI 궁합 분석
 * ------------------------------------------------------*/
export async function POST(req: NextRequest) {
  try {
    if (!MODEL_VALID) {
      return NextResponse.json(
        {
          error: true,
          detail: `잘못된 모델명: ${MODEL}. 사용 가능 모델: ${[
            ...VALID_MODELS,
          ].join(", ")}`
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const prompt = `
사주(연월일시), MBTI, 혈액형 기반 궁합 분석.
실전적 조언 중심, 미신 금지, 로직 중심.
JSON만 반환(설명문/코드펜스 금지).

남자: ${body.man_birth}, ${body.man_mbti}, ${body.man_blood || "미상"}, ${
      body.man_time || "미상"
    }
여자: ${body.woman_birth}, ${body.woman_mbti}, ${body.woman_blood || "미상"}, ${
      body.woman_time || "미상"
    }

{
 "score": 80,
 "facets": { "정서":80, "소통":80, "현실":70, "성장":90, "지속":80 },
 "summary": "2~3문장",
 "insights": ["실전 조언1","실전 조언2","실전 조언3"],
 "oneliner": "짧은 한 문장",
 "explanation": { "정서":"...", "소통":"...", "현실":"...", "성장":"...", "지속":"..." }
}
`;

    const raw = await callGemini(prompt);

    const json = JSON.parse(raw);
    return NextResponse.json(json);
  } catch (err: any) {
    console.error("[SOULVERSE API ERROR]", err?.message);
    return NextResponse.json(
      { error: true, detail: err?.message || "서버 오류" },
      { status: 500 }
    );
  }
}

/** -------------------------------------------------------
 * 4) GET: 헬스 체크
 * ------------------------------------------------------*/
export async function GET() {
  return NextResponse.json({ ok: true, model: MODEL });
}
