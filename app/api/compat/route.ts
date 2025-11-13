// app/api/compat/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEBUG = process.env.DEBUG_SOULVERSE === '1';

// ⚠️ 모델 기본값에서 'models/' 제거 (URL에서만 붙입니다)
const MODEL = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
// 두 이름 다 허용
const API_KEY = (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '').trim();
const BASE    = (process.env.GEMINI_BASE  || 'https://generativelanguage.googleapis.com').trim();

type Body = {
  topic: 'compatibility_basic'|'red_line'|'lucky_color'|string;
  man_birth: string;
  woman_birth: string;
  man_mbti: string;
  woman_mbti: string;
  man_blood?: 'A'|'B'|'O'|'AB';
  woman_blood?: 'A'|'B'|'O'|'AB';
  man_time?: string;    // HH:MM
  woman_time?: string;  // HH:MM
};

const JSON_SPEC = `반드시 아래 JSON만 반환(설명문/코드펜스 금지):
{
 "score": <30~98 정수>,
 "facets": { "정서":0~100, "소통":0~100, "현실":0~100, "성장":0~100, "지속":0~100 },
 "summary": "2~3문장",
 "insights": ["불릿1","불릿2","불릿3"],
 "oneliner": "짧은 한 문장",
 "explanation": { "정서":"한 문장", "소통":"한 문장", "현실":"한 문장", "성장":"한 문장", "지속":"한 문장" }
}`;

const SYSTEM = `
너는 사주(연월일시=기질/리듬), MBTI(의사소통/갈등복구/의사결정), 혈액형(문화권 일반론)을
편향 없이 종합 분석하는 코치다. 운명론 금지, 행동전략 중심. 한국어, 짧고 단정한 코칭 톤.
시간/혈액형 미입력 시 일반론으로 합리적 보정. 과한 상투어/미신 금지. 실전 조언에 초점.
${JSON_SPEC}
`;

function sanitizeJson(text: string) {
  let t = (text || '').trim();
  if (t.startsWith('```')) t = t.replace(/^```[a-z]*\n?/i, '');
  if (t.endsWith('```')) t = t.replace(/```$/, '');
  const last = t.lastIndexOf('}');
  if (last !== -1) t = t.slice(0, last + 1);
  return t;
}

async function callGemini(userPayload: string, signal: AbortSignal) {
  // 여기서만 models/ 접두 추가
  const url = `${BASE}/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${API_KEY}`;
  if (DEBUG) console.log('[SOULVERSE] Gemini URL:', url);

  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: SYSTEM }] },
        { role: 'user', parts: [{ text: userPayload }] }
      ],
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 800,
        responseMimeType: 'application/json'
      }
    })
  });

  const rawText = await res.text();
  if (!res.ok) {
    // Google 에러 메세지 그대로 남겨 디버그에 도움
    throw new Error(`Gemini ${res.status}: ${rawText}`);
  }

  // v1beta 응답: JSON 문자열 형태가 들어옵니다
  try {
    const json = JSON.parse(rawText);
    const text =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ??
      json?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data ??
      '';
    return String(text || '');
  } catch {
    // 어떤 경우엔 이미 최종 JSON이 바로 text로 오기도 함
    return rawText;
  }
}

function normalizeOutput(parsed: any) {
  const num = (v: any, d: number, min=0, max=100) => {
    const n = Number(v);
    if (Number.isNaN(n)) return d;
    return Math.max(min, Math.min(max, Math.round(n)));
  };

  const score = num(parsed?.score, 80, 30, 98);
  const f = parsed?.facets || {};
  const explanation = parsed?.explanation || {};

  return {
    score,
    facets: {
      "정서": num(f["정서"], 80),
      "소통": num(f["소통"], 80),
      "현실": num(f["현실"], 70),
      "성장": num(f["성장"], 90),
      "지속": num(f["지속"], 80),
    },
    summary: String(parsed?.summary || '').slice(0, 400),
    insights: Array.isArray(parsed?.insights) ? parsed.insights.slice(0,3).map(String) : [],
    oneliner: String(parsed?.oneliner || '').slice(0, 80),
    explanation: {
      "정서": String(explanation["정서"] || ''),
      "소통": String(explanation["소통"] || ''),
      "현실": String(explanation["현실"] || ''),
      "성장": String(explanation["성장"] || ''),
      "지속": String(explanation["지속"] || ''),
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json({ error: true, detail: 'API 키(GOOGLE_API_KEY 또는 GEMINI_API_KEY)가 없습니다.' }, { status: 500 });
    }

    const body = await req.json() as Body;
    const missing: string[] = [];
    if (!body.man_birth)  missing.push('man_birth');
    if (!body.woman_birth) missing.push('woman_birth');
    if (!body.man_mbti)   missing.push('man_mbti');
    if (!body.woman_mbti) missing.push('woman_mbti');
    if (missing.length) {
      return NextResponse.json({ error: true, detail: `필수 입력 누락: ${missing.join(', ')}` }, { status: 400 });
    }

    const topic = (body.topic || 'compatibility_basic') as Body['topic'];
    const userPayload = `
[토픽] ${topic}
[남] 생년월일=${body.man_birth}, 시간=${body.man_time || '미상'}, MBTI=${body.man_mbti}, 혈액형=${body.man_blood || '미상'}
[여] 생년월일=${body.woman_birth}, 시간=${body.woman_time || '미상'}, MBTI=${body.woman_mbti}, 혈액형=${body.woman_blood || '미상'}

요구:
- 관계의 강/약점과 개선전략을 실전적으로.
- 점수/요약/인사이트/설명이 서로 논리적으로 일관.
- 한국어, 짧고 단정한 코칭 톤.
${JSON_SPEC}
예시:
{
 "score": 82,
 "facets": { "정서":78, "소통":85, "현실":72, "성장":88, "지속":80 },
 "summary": "요약 2~3문장.",
 "insights": ["실전조언1","실전조언2","실전조언3"],
 "oneliner": "짧은 한 문장",
 "explanation": { "정서":"...", "소통":"...", "현실":"...", "성장":"...", "지속":"..." }
}
`;

    // 타임아웃 + 1회 재시도
    const once = async () => {
      const controller = new AbortController();
      const to = setTimeout(()=>controller.abort(), 20000);
      try {
        return await callGemini(userPayload, controller.signal);
      } finally {
        clearTimeout(to);
      }
    };

    let text = '';
    try { text = await once(); }
    catch (e1) {
      if (DEBUG) console.error('[SOULVERSE] 1st call error:', e1);
      text = await once(); // 재시도
    }

    const raw = sanitizeJson(text);
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (e2) {
      // 중괄호 블록만 추출해서 재시도
      const m = raw.match(/\{[\s\S]*\}$/);
      if (!m) {
        if (DEBUG) console.error('[SOULVERSE] JSON parse fail raw=', raw);
        throw new Error('JSON 파싱 실패');
      }
      parsed = JSON.parse(m[0]);
    }

    return NextResponse.json(normalizeOutput(parsed));
  } catch (err: any) {
  const msg = err?.message || '서버 내부 오류';
  console.error('[SOULVERSE] API ERROR:', msg);
  return NextResponse.json({ error: true, detail: msg }, { status: 500 });
}

}

export async function GET() {
  return NextResponse.json({ ok: true });
}
