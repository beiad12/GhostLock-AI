import { THEMES } from './definitions'
import type { ThemeId } from './types'

/** Writes a theme's color palette onto :root as CSS custom properties. */
export function applyTheme(themeId: ThemeId): void {
  const theme = THEMES[themeId]
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme.colors)) {
    const cssVar = `--gl-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`
    root.style.setProperty(cssVar, value)
  }
  root.dataset.theme = themeId
}
