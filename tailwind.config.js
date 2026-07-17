/** @type {import('tailwindcss').Config} */
// Direction artistique BIOXA (cf. PRD §8). Les valeurs sources vivent aussi dans
// src/theme/tokens.ts pour un usage hors classes utilitaires.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        creme: '#F7F2EA', // fond principal
        surface: '#FFFFFF', // cartes
        brume: '#D5DBDF', // filets / bordures
        marine: '#14304A', // titres, bandeaux, KPI clés
        encre: '#1E2933', // texte courant (jamais de noir pur)
        terracotta: '#C0623F', // urgence J-7, actions primaires
        ambre: '#D7A24A', // palier "à surveiller"
        sauge: '#6F9080', // touches rares
      },
      fontFamily: {
        title: ['Manrope', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        carte: '0 1px 2px rgba(20,48,74,.04), 0 8px 24px -14px rgba(20,48,74,.18)',
      },
      borderRadius: {
        xl2: '14px',
      },
    },
  },
  plugins: [],
};
