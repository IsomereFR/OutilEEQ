import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relative pour un build statique ouvrable en local (poste BIOXA), sans
// hébergement ni exposition réseau (cf. PRD §4 déploiement).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', sourcemap: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
} as never);
