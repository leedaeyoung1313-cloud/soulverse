// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', 
    './pages/**/*.{js,ts,jsx,tsx,mdx}', 
    './components/**/*.{js,ts,jsx,tsx,mdx}', 
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b1020",      // 전체 배경 (Deep Navy-Black)
        card: "#121829",    // 카드/섹션 배경 
        txt: "#e2e8f0",     // 메인 텍스트 (밝은 그레이)
        muted: "#94a3b8",   // 보조 텍스트 
        accent: "#7dd3fc",  // 네온 포인트 (밝은 청록) 
        neon: "#60a5fa",    // 하이라이트/호버 
        borderc: "#1e2a3a"  // 카드/섹션 경계선 
      },
      boxShadow: {
        'deep': '0 0 20px rgba(0,0,0,0.25)', 
        'deep-hover': '0 0 25px rgba(0,0,0,0.35)', 
      }
    },
  },
  plugins: [],
}