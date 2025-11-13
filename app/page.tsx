// app/page.tsx - SOULVERSE Landing (Tailwind + Dark Neon Theme)
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* 메인 콘텐츠 */}
      <div className="text-center space-y-6">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-wider">
          <span className="bg-gradient-to-r from-accent to-neon bg-clip-text text-transparent">
            SOULVERSE
          </span>
        </h1>

        <p className="mt-2 text-lg md:text-xl text-muted max-w-lg mx-auto">
          사주 · MBTI · 혈액형을 한 번에 분석해서,
          &ldquo;지금 우리 사이&rdquo;를 가장 현실적으로 보여주는 AI 궁합 리포트.
        </p>

        <div className="flex flex-col items-center gap-3 mt-4">
          <Link href="/categories">
            <button
              className={`
                inline-flex items-center gap-2
                px-6 py-3 rounded-xl font-semibold
                bg-accent text-bg
                shadow-[0_0_25px_rgba(125,211,252,0.5)]
                hover:bg-neon hover:shadow-[0_0_40px_rgba(96,165,250,0.7)]
                transition-all duration-200
              `}
            >
              💫 지금 바로 운명 분석 시작하기 →
            </button>
          </Link>

          <span className="text-xs text-muted">
            * 개인 정보는 서버에 저장되지 않고, 분석 용도로만 사용됩니다.
          </span>
        </div>
      </div>

      {/* 하단 고정 배너 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pt-6 backdrop-blur-md bg-bg/80">
        <div className="max-w-lg mx-auto bg-card border border-borderc p-3 text-center text-xs text-muted rounded-lg shadow-deep">
          [예시] &ldquo;SOULVERSE 베타 오픈 기념 · 오늘 궁합 리포트 1회 무료&rdquo; 배너 영역
        </div>
      </div>
    </div>
  );
}
