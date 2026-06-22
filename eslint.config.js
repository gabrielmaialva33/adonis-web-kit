import { configApp } from '@adonisjs/eslint-config'

export default [
  ...configApp({
    ignores: ['tmp/**', 'build/**', 'node_modules/**', '.DS_Store', 'coverage/**'],
  }),
  {
    rules: {
      // Re-habilitar na Fase 5 (UI), quando o frontend for reescrito com Link tipado.
      '@adonisjs/prefer-adonisjs-inertia-link': 'off',
    },
  },
]
