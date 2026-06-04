import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration Vite.
// base relative ('./') pour que le build statique soit ouvrable au double-clic
// (file://) ou servi depuis n'importe quel sous-dossier — aucune dépendance
// réseau au runtime, conformément à la contrainte « 100 % local et hors-ligne ».
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  // Vitest : environnement jsdom pour les tests de logique/rendu.
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
} as never);
