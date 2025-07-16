import { useTheme as useNextTheme } from 'next-themes'

export const useTheme = () => {
  const { theme, setTheme, systemTheme, themes } = useNextTheme()

  const currentTheme = theme === 'system' ? systemTheme : theme

  return {
    theme: currentTheme,
    setTheme,
    systemTheme,
    themes,
    isDark: currentTheme === 'dark',
    isLight: currentTheme === 'light',
    toggle: () => setTheme(currentTheme === 'dark' ? 'light' : 'dark'),
  }
}
