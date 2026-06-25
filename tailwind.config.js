/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // MG brand red + supporting neutrals
        mg: {
          red: '#E2001A',
          'red-dark': '#B30015',
          'red-light': '#FF2D45',
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
        glow: '0 0 0 1px rgba(226,0,26,0.35), 0 8px 40px -8px rgba(226,0,26,0.45)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 50px -24px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        'mg-grad': 'linear-gradient(135deg, #E2001A 0%, #B30015 100%)',
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
