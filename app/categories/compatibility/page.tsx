// app/categories/compatibility/page.tsx - 궁합 분석 옵션 선택 페이지
import Link from 'next/link';

const compatibilityOptions = [
  {
    title: '기본 궁합 리포트',
    description: '두 사람의 성격, 대화 방식, 미래 지속 가능성 분석 (일반 모드)',
    icon: '✨',
    topicKey: 'compatibility_basic',
  },
  {
    title: '레드 라인 궁합 분석',
    description: '두 사람이 절대 피해야 할 위험 요소와 갈등 해소법 심층 분석 (특화 모드)',
    icon: '🔥',
    topicKey: 'red_line',
  },
  {
    title: '행운 컬러 & 무드',
    description: '두 사람이 함께 있을 때 상승하는 컬러, 공간, 무드 추천',
    icon: '🎨',
    topicKey: 'lucky_color',
  },
];

type Option = (typeof compatibilityOptions)[number];

function OptionCard({ title, description, icon, topicKey }: Option) {
  return (
    <Link
      href={\`/categories/compatibility/\${topicKey}\`}
      className="
        block bg-card border border-borderc rounded-2xl p-4
        shadow-deep hover:shadow-deep-hover hover:-translate-y-1
        transition-all duration-200
      "
    >
      <div className="flex items-center gap-4">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1 text-left">
          <h2 className="text-lg font-semibold text-txt">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export default function CompatibilityOptionsPage() {
  return (
    <div className="min-h-screen bg-bg text-txt p-4">
      <div className="max-w-xl mx-auto py-10 space-y-6">
        <h1 className="text-3xl font-bold text-center">
          궁합 분석 옵션 선택
        </h1>

        <div className="space-y-4">
          {compatibilityOptions.map((option) => (
            <OptionCard key={option.topicKey} {...option} />
          ))}
        </div>
      </div>
    </div>
  );
}
