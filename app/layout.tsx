// app/layout.tsx
import './globals.css'; 
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SOULVERSE - AI 운명 분석 리포트',
  description: 'AI가 분석하는 사주, MBTI, 혈액형 종합 운명 리포트',
};

export default function RootLayout({
  children, 
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* 모든 페이지에 다크 배경(bg-bg)과 밝은 텍스트(text-txt) 적용 */}
        <main className="min-h-screen bg-bg text-txt"> 
            {children}
        </main>
      </body>
    </html>
  );
}