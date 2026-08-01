import type { ThemeDefinition, ThemeId } from './types'

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  cyberGreen: {
    id: 'cyberGreen',
    name: 'Cyber Green',
    description: 'Classic military neural-terminal green',
    colors: {
      accent: '#00ff9c',
      accentSoft: 'rgba(0, 255, 156, 0.15)',
      accentStrong: '#39ffb0',
      secondary: '#00e5ff',
      background: '#050505',
      backgroundElevated: '#0a0f0c',
      glass: 'rgba(10, 20, 15, 0.55)',
      glassBorder: 'rgba(0, 255, 156, 0.25)',
      textPrimary: '#eafff2',
      textSecondary: '#8fd8b0',
      textMuted: '#4d7a63',
      danger: '#ff3b5c',
      warning: '#ffb020',
      success: '#00ff9c'
    }
  },
  blueHologram: {
    id: 'blueHologram',
    name: 'Blue Hologram',
    description: 'Cool holographic command-deck blue',
    colors: {
      accent: '#3ac6ff',
      accentSoft: 'rgba(58, 198, 255, 0.15)',
      accentStrong: '#7fdcff',
      secondary: '#8a5cff',
      background: '#04070c',
      backgroundElevated: '#080f18',
      glass: 'rgba(10, 20, 32, 0.55)',
      glassBorder: 'rgba(58, 198, 255, 0.25)',
      textPrimary: '#eaf6ff',
      textSecondary: '#9cc7e0',
      textMuted: '#4d6a7a',
      danger: '#ff3b5c',
      warning: '#ffb020',
      success: '#3ac6ff'
    }
  },
  redAlert: {
    id: 'redAlert',
    name: 'Red Alert',
    description: 'High-alert intrusion / lockdown mode',
    colors: {
      accent: '#ff2b45',
      accentSoft: 'rgba(255, 43, 69, 0.15)',
      accentStrong: '#ff6b7f',
      secondary: '#ff9a3c',
      background: '#0a0303',
      backgroundElevated: '#160707',
      glass: 'rgba(30, 8, 8, 0.55)',
      glassBorder: 'rgba(255, 43, 69, 0.3)',
      textPrimary: '#ffecec',
      textSecondary: '#e08c94',
      textMuted: '#7a4d4d',
      danger: '#ff2b45',
      warning: '#ffb020',
      success: '#4dff9a'
    }
  },
  purpleNeon: {
    id: 'purpleNeon',
    name: 'Purple Neon',
    description: 'Deep synthwave neon violet',
    colors: {
      accent: '#b565ff',
      accentSoft: 'rgba(181, 101, 255, 0.15)',
      accentStrong: '#d19bff',
      secondary: '#ff5cd6',
      background: '#07030c',
      backgroundElevated: '#100819',
      glass: 'rgba(24, 10, 36, 0.55)',
      glassBorder: 'rgba(181, 101, 255, 0.3)',
      textPrimary: '#f6ecff',
      textSecondary: '#c9a3e0',
      textMuted: '#6a4d7a',
      danger: '#ff3b5c',
      warning: '#ffb020',
      success: '#65ffc8'
    }
  },
  matrix: {
    id: 'matrix',
    name: 'Matrix',
    description: 'Digital rain, pure phosphor green on black',
    colors: {
      accent: '#00ff41',
      accentSoft: 'rgba(0, 255, 65, 0.15)',
      accentStrong: '#66ff8f',
      secondary: '#0dff00',
      background: '#000000',
      backgroundElevated: '#020a02',
      glass: 'rgba(0, 12, 0, 0.6)',
      glassBorder: 'rgba(0, 255, 65, 0.25)',
      textPrimary: '#d6ffe0',
      textSecondary: '#66c47a',
      textMuted: '#3a6b45',
      danger: '#ff3b5c',
      warning: '#ffe020',
      success: '#00ff41'
    }
  },
  whiteSciFi: {
    id: 'whiteSciFi',
    name: 'White Sci-Fi',
    description: 'Clean clinical white-on-black lab interface',
    colors: {
      accent: '#e8f4ff',
      accentSoft: 'rgba(232, 244, 255, 0.12)',
      accentStrong: '#ffffff',
      secondary: '#8ecbff',
      background: '#020204',
      backgroundElevated: '#0a0a0e',
      glass: 'rgba(20, 22, 28, 0.55)',
      glassBorder: 'rgba(232, 244, 255, 0.2)',
      textPrimary: '#f5f8ff',
      textSecondary: '#aab4c8',
      textMuted: '#5a6478',
      danger: '#ff4f6b',
      warning: '#ffc94a',
      success: '#7ef7c4'
    }
  }
}

export const DEFAULT_THEME: ThemeId = 'cyberGreen'
export const THEME_LIST = Object.values(THEMES)
