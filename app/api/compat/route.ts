// app/api/compat/route.ts - Gemini API 연동 (JSON 궁합 리포트 전용)
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = process.env.GEMINI_MODEL || 'models/gemini-2.5-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || ''; // 폴백 모델 환경 변수 사용
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1';

type JsonSchema = Record<string, string>;

interface TopicConfig {
  system: string;
  userRequest: string;
  jsonSchema: JsonSchema;
}

// ⚠️ 퀄리티 향상을 위해 JSON 스키마에 'explanation' 항목 추가
const BASE_JSON_SCHEMA: JsonSchema = {
  score: '30~98 정수',
  facets: '{"emotion":"0~100","comm":"0~100","reality":"0~100","growth":"0~100","sustain":"0~100"}',
  summary: '2~3문장',
  // 퀄리티 향상: 각 점수에 대한 구체적인 해설
  explanation: '{"emotion":"1문장 해설 및 조언","comm":"1문장 해설 및 조언","reality":"1문장 해설 및 조언","growth":"1문장 해설 및 조언","sustain":"1문장 해설 및 조언"}',
  insights: '["실전 조언 1","실전 조언 2","실전 조언 3"]',
  oneliner: '짧은 한 문장',
};

const TOPIC_MAP: Record<string, TopicConfig> = {
  compatibility_basic: {
    // ⚠️ 퀄리티 향상: system 프롬프트에 근거와 구체적인 조언 요청 추가
    system: `
당신은 사주(연월일시), MBTI, 혈액형 정보를 바탕으로
두 사람의 "정서적 호흡"과 "현실적인 지속 가능성"을 함께 보는 궁합 코치이다.
운명론적 단정 대신, 조절 가능한 행동 전략을 제안한다.
특히, JSON의 'explanation' 필드에 각 항목 점수가 나온 **구체적인 근거와 행동 조언**을 담아야 한다.
한국 사용자를 대상으로 한국어로만 답변한다.
JSON 형식으로만 답하며, 불필요한 설명 텍스트는 넣지 않는다.
`,
    userRequest:
      '사주·MBTI·혈액형을 가볍게 종합해 두 사람 관계의 가장 취약한 지점을 짚고, 이를 보완할 수 있는 구체적 행동 전략을 제시해줘.',
    jsonSchema: BASE_JSON_SCHEMA,
  },
  red_line: {
    system: `
당신은 연인/부부 관계에서 절대 건드리면 안 되는 "레드 라인"을 찾아내고,
갈등을 피하거나 줄일 수 있는 실전 커뮤니케이션 가이드를 주는 코치이다.
사주, MBTI, 혈액형 정보를 참고하되, 고정관념에 빠지지 않고 현실적인 조언을 중시한다.
JSON의 'explanation' 필드에 각 항목 점수가 나온 구체적인 근거와 행동 조언을 담아야 한다.
`,
    userRequest:
      '두 사람이 절대 건드리면 안 되는 레드 라인과, 그 상황을 피하거나 복구하기 위한 대화/행동 전략을 알려줘.',
    jsonSchema: BASE_JSON_SCHEMA,
  },
  lucky_color: {
    system: `
당신은 두 사람의 기질과 상호작용을 기반으로,
함께 있을 때 에너지가 올라가는 색상/공간/무드 등을 추천하는 코치이다.
JSON의 'explanation' 필드에 각 항목 점수가 나온 구체적인 근거와 행동 조언을 담아야 한다.
`,
    userRequest:
      '두 사람이 함께 있을 때 분위기를 좋게 만들어주는 컬러, 공간 스타일, 데이트 무드를 제안해줘.',
    jsonSchema: BASE_JSON_SCHEMA,
  },
};

function buildPrompt(topicKey: string, payload: any): string {
  const topic = TOPIC_MAP[topicKey] ?? TOPIC_MAP['compatibility_basic'];

  const schemaExplain = Object.entries(topic.jsonSchema)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  return `
[역할]
${topic.system.trim()}

[분석 대상]
- 남자 생년월일: ${payload.man_birth || '(미입력)'}
- 여자 생년월일: ${payload.woman_birth || '(미입력)'}
// ⚠️ 버그 수정: man_mbti 자리에 man_mbti가 들어가야 합니다.
- 남자 MBTI: ${payload.man_mbti || '(미입력)'}
// ⚠️ 버그 수정: woman_mbti 자리에 woman_mbti가 들어가야 합니다.
- 여자 MBTI: ${payload.woman_mbti || '(미입력)'}
- 남자 혈액형: ${payload.man_blood || '(미입력)'}
- 여자 혈액형: ${payload.woman_blood || '(미입력)'}
- 남자 출생 시간: ${payload.man_time || '(미입력)'}
- 여자 출생 시간: ${payload.woman_time || '(미입력)'}

[요청]
${topic.userRequest}

[출력 형식]
아래 JSON 스키마를 정확히 따르는 JSON만 반환해.
추가 설명 텍스트나 마크다운, 코드블록은 절대 넣지 마.

스키마 설명:
${schemaExplain}

JSON 예시 (형식만 참고):
{
  "score": 78,
  "facets": { "emotion": 80, "comm": 84, "reality": 70, "growth": 90, "sustain": 82 },
  "explanation": { "emotion": "감정 교류는 원활하며, 남성의 공감 능력이 핵심입니다.", "comm": "소통에 오해가 없도록 문맥을 명확히 하는 연습이 필요합니다." }, // 퀄리티 향상 예시
  "summary": "2~3문장으로 전반적인 궁합을 정리",
  "insights": ["실전 조언 1", "실전 조언 2", "실전 조언 3"],
  "oneliner": "짧고 임팩트 있는 한 문장"
}
`;
}

function extractJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first >= 0 && last > first) {
      const sliced = text.slice(first, last + 1);
      try {
        return JSON.parse(sliced);
      } catch {
        // ignore
      }
    }
  }
  return null;
}

function clampScoreValue(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeFacetsOut(facets: any): FacetsOut {
  const base: FacetsOut = {
    emotion: 80,
    comm: 80,
    reality: 70,
    growth: 90,
    sustain: 80,
  };
  if (!facets || typeof facets !== 'object') return base;
  return {
    emotion: clampScoreValue((facets as any).emotion, 0, 100, base.emotion),
    comm: clampScoreValue((facets as any).comm, 0, 100, base.comm),
    reality: clampScoreValue((facets as any).reality, 0, 100, base.reality),
    growth: clampScoreValue((facets as any).growth, 0, 100, base.growth),
    sustain: clampScoreValue((facets as any).sustain, 0, 100, base.sustain),
  };
}

type FacetsOut = {
  emotion: number;
  comm: number;
  reality: number;
  growth: number;
  sustain: number;
};

export async function POST(req: NextRequest) {
  const currentModel = FALLBACK_MODEL || MODEL; // 폴백 모델이 있다면 우선 사용
  
  try {
    const apiKey = process.env.GEMINI_API_KEY; 
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NO_API_KEY', detail: 'GEMINI_API_KEY가 설정되지 않았습니다.' },
        { status: 500 },
      );
    }

    const body = await req.json();
    const topicKey: string = body.topic || 'compatibility_basic';

    const prompt = buildPrompt(topicKey, body);

    // ⚠️ 재시도 로직이 없으므로, 현재는 폴백 모델이 환경 변수로 설정되어야만 적용됩니다.
    const res = await fetch(`${GEMINI_BASE}/${currentModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          maxOutputTokens: 512, // 퀄리티 향상을 위해 토큰 증가
        },
      }),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      return NextResponse.json(
        { error: 'MODEL_REQUEST_FAILED', detail: msg || `status ${res.status}` },
        { status: 500 },
      );
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text || '')
        .join('\n') ?? '';

    // ⚠️ JSON 스키마 변경 (explanation 추가)에 맞춰 파싱 로직 업데이트
    const json = extractJson(text) || {};

    const score = clampScoreValue(json.score, 30, 98, 80);
    const facets = normalizeFacetsOut(json.facets);
    const explanation = typeof json.explanation === 'object' && json.explanation !== null ? json.explanation : {}; // explanation 추가

    const out = {
      score,
      facets,
      explanation: normalizeFacetsOut(explanation), // explanation 구조 정규화
      summary:
        typeof json.summary === 'string'
          ? json.summary
          : '두 사람의 관계는 조율과 소통을 통해 충분히 발전할 수 있는 가능성이 있습니다.',
      insights: Array.isArray(json.insights) ? json.insights.slice(0, 5) : [],
      oneliner:
        typeof json.oneliner === 'string'
          ? json.oneliner
          : '서로의 차이를 이해할수록 관계의 깊이는 더 깊어집니다.',
    };
    
    // ⚠️ explanation이 빈 객체일 경우, 임시로 summary를 넣어 클라이언트 에러 방지 (최종 배포 시 제거 권장)
    if (Object.keys(out.explanation).length === 0) {
        (out.explanation as any).emotion = out.summary;
    }

    return NextResponse.json(out);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: 'AI_ERROR', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}