import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,css}",
    "../../packages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Night Sky Space 테마 색상 팔레트
        // 우주 밤하늘 테마 색상
        space: {
          // 깊은 우주 배경
          void: {
            50: '#0f0f23',
            100: '#0a0a1a',
            200: '#050514',
            300: '#02020e',
            400: '#010108',
            500: '#000003',
          },
          // 별과 우주 색상
          cosmic: {
            star: '#ffffff',      // 별빛
            nebula: '#6366f1',    // 성운 보라
            galaxy: '#8b5cf6',    // 은하 자주
            meteor: '#f59e0b',    // 유성 황금
            aurora: '#10b981',    // 오로라 녹색
          },
        },
        tower: {
          deep: {
            50: '#1a1a2e',
            100: '#16161f',
            200: '#0f0f15',
            300: '#0a0a0f',
            400: '#050508',
            500: '#020203',
          },
          // 금색/은색 (승리, 오델로 스텔라) - 톤다운 적용
          gold: {
            100: '#faf8f0',
            200: '#f5f1e8', // 한지색
            300: '#FFD700', // 일본 황금
            400: '#E6C200', // 부드러운 황금
            500: '#B8860B',
          },
          // 사이버 블루 추가
          cyber: {
            400: '#00d4ff',
            500: '#0ea5e9',
            600: '#0284c7'
          },
          silver: {
            100: '#f8fafc',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
          },
          // 붉은색 포인트 (보스/킹의 강렬함)
          danger: {
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
          }
        },
        // 확장 컬러 팔레트 (톤다운)
        purple: {
          100: '#f3f0ff',
          200: '#e9e5ff',
          300: '#d4c5ff',
          400: '#9966CC', // 무한성 보라
          500: '#7c3aed',
        },
        // 네온 그린 추가
        neon: {
          400: '#39ff14',
          500: '#00ff00'
        },
        // 오델로 보드 색상
        board: {
          classic: '#16a34a', // 전통 녹색
          dark: '#1f2937',     // 암흑탑
          galaxy: '#312e81',   // 은하수
          magic: '#581c87',    // 마법진
        }
      },
      fontFamily: {
        sans: ['Rajdhani', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'Rajdhani', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
      },
      spacing: {
        '18': '72px', // 바텀 네비게이션 높이
        '14': '56px', // 헤더 높이
      }
    },
  },
  plugins: [],
} satisfies Config;

