/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── MG Maroc, calé sur mg-maroc.com (thème clair) ──
        mg: {
          red: '#FD2F33', // accent du site
          'red-deep': '#CD1316', // rouge MG officiel (Pantone 485C) — variante plus profonde
          'red-dark': '#D81620',
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
        glow: '0 1px 0 0 rgba(255,255,255,0.4) inset, 0 10px 30px -10px rgba(253,47,51,0.5)',
        card: '0 1px 2px rgba(28,25,23,0.04), 0 14px 34px -16px rgba(28,25,23,0.22)',
        'card-hover': '0 2px 4px rgba(28,25,23,0.05), 0 24px 50px -20px rgba(28,25,23,0.30)',
      },
      backgroundImage: {
        'mg-grad': 'linear-gradient(135deg, #FD2F33 0%, #D81620 100%)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
