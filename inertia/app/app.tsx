/// <reference path="../../config/inertia.ts" />

import '../css/app.css'
import { hydrateRoot } from 'react-dom/client'
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { ThemeProvider } from '~/providers/theme_provider'
import { QueryProvider } from '~/providers/query_provider'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: async (name) => {
    /**
     * `resolvePageComponent` resolves to the page *module*; Inertia v3's
     * resolver contract wants the component itself.
     */
    const moduloPagina = await resolvePageComponent<{ default: ResolvedComponent }>(
      `../pages/${name}.tsx`,
      import.meta.glob<{ default: ResolvedComponent }>('../pages/**/*.tsx')
    )

    return moduloPagina.default
  },

  setup({ el, App, props }) {
    hydrateRoot(
      el,
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryProvider>
          <App {...props} />
        </QueryProvider>
      </ThemeProvider>
    )
  },
})
