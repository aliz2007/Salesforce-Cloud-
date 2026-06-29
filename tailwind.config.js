/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── MG Maroc, calé sur mg-maroc.com (thème clair) ──
        mg: {
          red: '#E11D24', // compromis : plus profond que le site (#FD2F33), plus vif que l'officiel
          'red-site': '#FD2F33', // rouge exact de mg-maroc.com
          'red-deep': '#CD1316', // rouge MG officiel (Pantone 485C) — le plus profond
          'red-dark': '#B5141A',
          'red-light': '#FF5C5F',
          'red-wash': '#FFF1F1', // fond rouge très clair (états sélectionnés)
          ink: '#1C1917', // texte principal (noir chaud)
          'ink-soft': '#57534D', // texte secondaire
          mute: '#8A857E', // texte atténué
          line: '#E7E4E0', // bordures (gris chaud)
          panel: '#FFFFFF', // surface des cartes
          wash: '#F6F5F3', // fond de section subtil
          base: '#FFFFFF', // fond de page
          stage: '#0E0E10', // backdrop sombre pour la présentation média
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
      letterSpacing: {
        mg: '0.22em', // tracking large facon MG ("D É C O U V R E Z")
      },
      boxShadow: {
        glow: '0 1px 0 0 rgba(255,255,255,0.4) inset, 0 10px 30px -10px rgba(225,29,36,0.5)',
        'glow-lg': '0 1px 0 0 rgba(255,255,255,0.45) inset, 0 18px 60px -12px rgba(225,29,36,0.65)',
        card: '0 1px 2px rgba(28,25,23,0.04), 0 14px 34px -16px rgba(28,25,23,0.22)',
        'card-hover': '0 2px 4px rgba(28,25,23,0.05), 0 24px 50px -20px rgba(28,25,23,0.30)',
        bubble: '0 24px 50px -18px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        'mg-grad': 'linear-gradient(135deg, #E11D24 0%, #B5141A 100%)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.85' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(4%, -6%) scale(1.08)' },
          '66%': { transform: 'translate(-5%, 4%) scale(0.96)' },
        },
        'ken-burns': {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '100%': { transform: 'scale(1.12) translate(-1.5%, -1.5%)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 3.6s ease-in-out infinite',
        'float-slow': 'float-slow 5s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 14s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 9s ease-in-out infinite',
        'spin-slow': 'spin-slow 26s linear infinite',
        aurora: 'aurora 22s ease-in-out infinite',
        'ken-burns': 'ken-burns 24s ease-in-out infinite alternate',
        'fade-in': 'fade-in 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}
