/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── LinguaRead — warm "reading desk" palette ──
        paper: '#F6F1E7', // page background (warm off-white)
        card: '#FFFDF8', // surface of cards / sheets
        ink: '#221F1A', // primary text (warm near-black)
        'ink-soft': '#5B544A', // secondary text
        mute: '#8E867A', // muted / captions
        line: '#E7DFD0', // hairline borders
        brand: {
          DEFAULT: '#0F7A6B', // deep teal — primary action
          dark: '#0B5C50',
          light: '#1AA38E',
          wash: '#E8F4F1', // selected / tint background
        },
        ember: {
          DEFAULT: '#CF5B33', // terracotta accent (record / highlights)
          dark: '#A8431F',
          wash: '#FBEDE6',
        },
        gold: '#C2941F',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
        serif: ['"Fraunces"', 'Georgia', '"Times New Roman"', 'serif'],
      },
      letterSpacing: {
        wide2: '0.18em',
      },
      boxShadow: {
        card: '0 1px 2px rgba(34,31,26,0.04), 0 14px 34px -16px rgba(34,31,26,0.22)',
        'card-hover': '0 2px 4px rgba(34,31,26,0.05), 0 24px 50px -20px rgba(34,31,26,0.30)',
        brand: '0 10px 28px -10px rgba(15,122,107,0.55)',
        ember: '0 10px 28px -10px rgba(207,91,51,0.55)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-still': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'bar': {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        'draw': { from: { strokeDashoffset: 'var(--dash)' }, to: { strokeDashoffset: '0' } },
      },
      animation: {
        'fade-in': 'fade-in 0.45s ease-out both',
        'fade-in-still': 'fade-in-still 0.5s ease-out both',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
        'spin-slow': 'spin-slow 1s linear infinite',
        'draw': 'draw 1.1s ease-out both',
      },
    },
  },
  plugins: [],
}
