import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    // The full list, not `extend`: once any screen is `raw`, Tailwind stops
    // sorting them by width and emits them in this order, and `extend` would
    // append xs after lg (so xs:h-* beat lg:h-* on desktop).
    screens: {
      xs: '420px',
      ...defaultTheme.screens,
      // Short windows (laptops, landscape tablets): tighter vertical rhythm
      // so tall forms like the auth screen still fit without scrolling.
      // Listed last so they override the width breakpoints above.
      short: { raw: '(max-height: 880px)' },
      shorter: { raw: '(max-height: 720px)' },
    },
    extend: {
      colors: {
        bg: '#ffffff',
        surface: '#f6f7f9',
        elevated: '#ffffff',
        ink: '#0b0c10',
        stone: '#666b78',
        accent: '#3d7fff',
        accent2: '#6c5ce7',
        // Headings on course pages and the orange call-to-action buttons
        navy: '#0f1f4d',
        cta: '#ff8c42',
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
      animation: {
        marquee: 'marquee 32s linear infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        float: 'float 8s ease-in-out infinite',
        bob: 'bob 6s ease-in-out infinite',
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
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
