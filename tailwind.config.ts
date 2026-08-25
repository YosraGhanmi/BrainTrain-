import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#ffffff',
        surface: '#f6f7f9',
        elevated: '#ffffff',
        ink: '#0b0c10',
        stone: '#666b78',
        accent: '#3d7fff',
        accent2: '#6c5ce7',
        gold: '#b8860b',
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.08)',
        glow: '0 0 60px rgba(61, 127, 255, 0.18)',
        goldglow: '0 0 60px rgba(184, 134, 11, 0.15)',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.08em',
      },
      screens: {
        xs: '420px',
      },
      animation: {
        marquee: 'marquee 32s linear infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        float: 'float 8s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(4%, -6%) scale(1.08)' },
          '66%': { transform: 'translate(-3%, 4%) scale(0.96)' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(0, -22px) rotate(6deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
