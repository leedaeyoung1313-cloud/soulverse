// app/categories/page.tsx - 카테고리 선택 페이지 (SOULVERSE 다크 테마)
import Link from 'next/link';

const categories = [
  { 
    title: '남녀 궁합 분석',
    description: '사주, MBTI, 혈액형을 융합한 궁합 리포트',
    icon: '🧡',
    href: '/categories/compatibility',
  },
  { 
    title: '개인 운명 분석',
    description: '타고난 성향과 올 한 해 운세 예측 (추후 오픈 예정)',
    icon: '🔮',
    href: '#',
  },
  { 
    title: '오늘의 운세',
    description: '오늘 하루 분위기 가볍게 체크하기 (추후 오픈 예정)',
    icon: '✨',
    href: '#',
  },
];

type Category = (typeof categories)[number];

function CategoryCard({ title, description, icon, href }: Category) {
  const disabled = href === '#';

  return (
    <div
      className={`
        bg-card border border-borderc rounded-2xl p-4
        shadow-deep hover:shadow-deep-hover
        transition-all duration-200
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-1'}
      `}
    >
      {disabled ? (
        <div className="flex items-center gap-4">
          <div className="text-2xl">{icon}</div>
          <div className="flex-1 text-left">
            <h2 className="text-lg font-semibold text-txt">{title}</h2>
            <p className="mt-1 text-sm text-muted">{description}</p>
            <p className="mt-1 text-[11px] text-muted/70">* 곧 오픈 예정입니다.</p>
          </div>
        </div>
      ) : (
        <Link href={href} className="flex items-center gap-4">
          <div className="text-2xl">{icon}</div>
          <div className="flex-1 text-left">
            <h2 className="text-lg font-semibold text-txt">{title}</h2>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </div>
        </Link>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-bg text-txt p-4">
      <div className="max-w-xl mx-auto py-10 space-y-6">
        <h1 className="text-3xl font-bold text-center">
          원하는 분석 카테고리를 선택하세요
        </h1>

        <div className="space-y-4">
          {categories.map((category) => (
            <CategoryCard key={category.title} {...category} />
          ))}
        </div>
      </div>
    </div>
  );
}
