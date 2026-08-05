/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Ce depot n'avait aucun runner de test. L'absence a bloque la premiere
  // story de l'epic themes-par-app : le skill dev de BMAD exige des tests
  // couvrant la matrice d'acceptation, et n'avait rien pour les executer.
  // jsdom suffit ici — les tests portent sur applyThemeTokens, qui ne fait
  // qu'ecrire des proprietes CSS sur un HTMLElement.
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
