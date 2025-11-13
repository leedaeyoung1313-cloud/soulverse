// app/categories/compatibility/[topicKey]/page.tsx
'use client';

import React, { useMemo, useState } from 'react';

interface AnalysisPageProps {
  params: {
    topicKey: string;
  };
}

type Facets = {
  emotion: number;
  comm: number;
  reality: number;
  growth: number;
  sustain: number;
};

type ApiResponse = {
  score?: number;
  summary?: string;
  oneliner?: string;
  insights?: string[];
  facets?: Facets;
  error?: string;
  detail?: string;
};

const API_URL = '/api/compat';

function clampScore(v: number | undefined, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeFacets(facets: Facets | undefined): Facets {
  const base: Facets = {
    emotion: 80,
    comm: 80,
    reality: 70,
    growth: 90,
    sustain: 80,
  };
  if (!facets) return base;
  return {
    emotion: clampScore(facets.emotion, 0, 100, base.emotion),
    comm: clampScore(facets.comm, 0, 100, base.comm),
    reality: clampScore(facets.reality, 0, 100, base.reality),
    growth: clampScore(facets.growth, 0, 100, base.growth),
    sustain: clampScore(facets.sustain, 0, 100, base.sustain),
  };
}

const topicTitleMap: Record<string, string> = {
  compatibility_basic: '기본 궁합 리포트',
  red_line: '레드 라인 궁합 분석',
  lucky_color: '행운 컬러 & 무드',
};

export default function AnalysisPage({ params }: AnalysisPageProps) {
  const { topicKey } = params;

  const [manBirth, setManBirth] = useState('');
  const [womanBirth, setWomanBirth] = useState('');
  const [manMbti, setManMbti] = useState('');
  const [womanMbti, setWomanMbti] = useState('');
  const [manBlood, setManBlood] = useState('');
  const [womanBlood, setWomanBlood] = useState('');
  const [manTime, setManTime] = useState('');
  const [womanTime, setWomanTime] = useState('');

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => {
    return topicTitleMap[topicKey] ?? '궁합 분석';
  }, [topicKey]);

  const canSubmit = useMemo(() => {
    return Boolean(manBirth && womanBirth && manMbti && womanMbti);
  }, [manBirth, womanBirth, manMbti, womanMbti]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const payload = {
        topic: topicKey,
        man_birth: manBirth,
        woman_birth: womanBirth,
        man_mbti: manMbti.toUpperCase(),
        woman_mbti: womanMbti.toUpperCase(),
        man_blood: manBlood.trim().toUpperCase() || undefined,
        woman_blood: womanBlood.trim().toUpperCase() || undefined,
        man_time: manTime.trim() || undefined,
        woman_time: womanTime.trim() || undefined,
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || `API ${res.status} 오류가 발생했습니다.`);
      }

      const json = (await res.json()) as ApiResponse;
      if ((json as any).error) {
        throw new Error(json.detail || 'AI 분석 중 오류가 발생했습니다.');
      }

      const score = clampScore(json.score, 30, 98, 80);
      const facets = normalizeFacets(json.facets);

      setData({
        ...json,
        score,
        facets,
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-txt p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            SOULVERSE · COMPAT
          </p>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-sm text-muted">
            사주 · MBTI · 혈액형을 조합해 두 사람의 관계를 현실적으로 분석합니다.
          </p>
        </header>

        {/* 입력 폼 */}
        <section className="bg-card border border-borderc rounded-2xl p-6 shadow-deep">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-txt/90">남자</h2>
                <div className="space-y-1 text-left">
                  <label className="text-xs text-muted">생년월일</label>
                  <input
                    type="date"
                    value={manBirth}
                    onChange={(e) => setManBirth(e.target.value)}
                    className="w-full rounded-md bg-bg border border-borderc px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs text-muted">MBTI</label>
                  <input
                    type="text"
                    value={manMbti}
                    onChange={(e) => setManMbti(e.target.value)}
                    placeholder="예: ENTP"
                    className="w-full rounded-md bg-bg border border-borderc px-3 py-2 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs text-muted">혈액형 (선택)</label>
                  <input
                    type="text"
                    value={manBlood}
                    onChange={(e) => setManBlood(e.target.value)}
                    placeholder="예: O"
                    className="w-full rounded-md bg-bg border border-borderc px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs text-muted">태어난 시간 (선택)</label>
                  <input
                    type="time"
                    value={manTime}
                    onChange={(e) => setManTime(e.target.value)}
                    className="w-full rounded-md bg-bg border border-borderc px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-txt/90">여자</h2>
                <div className="space-y-1 text-left">
                  <label className="text-xs text-muted">생년월일</label>
                  <input
                    type="date"
                    value={womanBirth}
                    onChange={(e) => setWomanBirth(e.target.value)}
                    className="w-full rounded-md bg-bg border border-borderc px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs text-muted">MBTI</label>
                  <input
                    type="text"
                    value={womanMbti}
                    onChange={(e) => setWomanMbti(e.target.value)}
                    placeholder="예: ESFP"
                    className="w-full rounded-md bg-bg border border-borderc px-3 py-2 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs text-muted">혈액형 (선택)</label>
                  <input
                    type="text"
                    value={womanBlood}
                    onChange={(e) => setWomanBlood(e.target.value)}
                    placeholder="예: A"
                    className="w-full rounded-md bg-bg border border-borderc px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-xs text-muted">태어난 시간 (선택)</label>
                  <input
                    type="time"
                    value={womanTime}
                    onChange={(e) => setWomanTime(e.target.value)}
                    className="w-full rounded-md bg-bg border border-borderc px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className={`
                w-full mt-2 inline-flex items-center justify-center gap-2
                px-4 py-3 rounded-xl font-semibold
                bg-accent text-bg
                shadow-[0_0_25px_rgba(125,211,252,0.5)]
                hover:bg-neon hover:shadow-[0_0_40px_rgba(96,165,250,0.7)]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
              `}
            >
              {loading ? '분석 중...' : 'AI 궁합 리포트 받기'}
            </button>
          </form>
        </section>

        {/* 결과 영역 */}
        {data && !error && (
          <section className="bg-card border border-borderc rounded-2xl p-6 shadow-deep space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border-2 border-accent flex items-center justify-center bg-bg shadow-[0_0_25px_rgba(125,211,252,0.4)]">
                <span className="text-2xl font-bold">
                  {clampScore(data.score, 30, 98, 80)}
                </span>
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-lg font-semibold mb-1">
                  {data.oneliner || '두 사람의 관계에는 함께 성장할 여지가 충분합니다.'}
                </h2>
                <p className="text-sm text-muted">
                  {data.summary ||
                    '서로의 기질과 현실적인 상황을 함께 고려해, 관계를 더 안정적으로 만드는 방향을 제안합니다.'}
                </p>
              </div>
            </div>

            {/* Facets 막대 그래프 */}
            {data.facets && (
              <div className="space-y-2">
                {Object.entries(data.facets).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs text-muted mb-1 capitalize">
                      <span>{key}</span>
                      <span>{value}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-borderc/60 overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 인사이트 리스트 */}
            {data.insights && data.insights.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-semibold">관계에 도움이 되는 인사이트</h3>
                <ul className="list-disc list-inside text-sm text-muted space-y-1">
                  {data.insights.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
