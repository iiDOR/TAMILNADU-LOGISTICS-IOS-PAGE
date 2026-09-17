/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold:    '#f5c518',
        'gold-2': '#e6b800',
        'gold-3': '#ffd84d',
        'gold-dim': '#9e7d00',
        base:    '#000000',
        card:    '#0a0a0a',
        elevated:'#111111',
        danger:  '#ef4444',
        success: '#22c55e',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        display: ['Bebas Neue', 'sans-serif'],
      },
      borderColor: {
        soft:     'rgba(255,255,255,0.08)',
        hairline: 'rgba(255,255,255,0.05)',
        gold:     'rgba(245,197,24,0.3)',
      },
      boxShadow: {
        gold: '0 0 12px rgba(245,197,24,0.25)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
};
