export type ThemeId =
  | 'cyberGreen'
  | 'blueHologram'
  | 'redAlert'
  | 'purpleNeon'
  | 'matrix'
  | 'whiteSciFi'
  | 'coloringBookTesting'

export interface ThemeDefinition {
  id: ThemeId
  name: string
  description: string
  colors: {
    /** Primary accent used for glows, borders, active states */
    accent: string
    accentSoft: string
    accentStrong: string
    /** Secondary accent for contrast highlights */
    secondary: string
    /** Page background */
    background: string
    backgroundElevated: string
    /** Glass panel fill */
    glass: string
    glassBorder: string
    /** Text colors */
    textPrimary: string
    textSecondary: string
    textMuted: string
    /** Semantic */
    danger: string
    warning: string
    success: string
  }
}
