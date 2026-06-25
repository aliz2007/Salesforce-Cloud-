/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // MG brand red (official Pantone 485C #CD1316) — deep, premium
        mg: {
          red: '#CD1316',
          'red-dark': '#9E0E12',
          'red-light': '#E63A3D',
          black: '#0a0a0b',
          ink: '#121214',
          panel: '#17171a',
          line: '#26262b',
          mute: '#8a8a93',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(205,19,22,0.4), 0 8px 40px -8px rgba(205,19,22,0.5)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 50px -24px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        'mg-grad': 'linear-gradient(135deg, #CD1316 0%, #9E0E12 100%)',
        'panel-grad': 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'pulse-ring': 'pulse-ring 2.2s ease-out infinite',
      },
    },
  },
  plugins: [],
}
