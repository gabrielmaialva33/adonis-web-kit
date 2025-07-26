import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render as rtlRender } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PropsWithChildren, ReactElement } from 'react'
import { BrowserRouter } from 'react-router-dom'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: Number.POSITIVE_INFINITY, retry: false },
  },
})

export function render(
  ui: ReactElement,
  { route, ...options }: Omit<Parameters<typeof rtlRender>[1], 'wrapper'> & { route?: string } = {
    reactStrictMode: true,
  }
) {
  window.history.pushState({}, 'Test page', route)

  return {
    user: userEvent.setup(),
    ...rtlRender(ui, {
      wrapper: ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
      ),
      ...options,
    }),
  }
}

export * from '@testing-library/react'
