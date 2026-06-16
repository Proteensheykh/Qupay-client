/**
 * Qupay color tokens — sourced from Squid Router production CSS variables
 *
 * Dark mode primary, light mode mirrored in-house.
 * Brand: royal-500 (#9E79D2)
 * Status: positive (#7AE870), partial (#F3AF25), negative (#FF4D5B)
 * Highlight: #F3C23D amber (Qupay-native, monogram/success-burst only)
 */

export const palette = {
  grey: {
    100: '#FBFBFD',
    200: '#EDEFF3',
    300: '#D1D6E0',
    400: '#A7ABBE',
    500: '#8A8FA8',
    600: '#676B7E',
    700: '#4C515D',
    800: '#292C32',
    900: '#17191C',
  },
  royal: {
    300: '#D9BEF4',
    400: '#B893EC',
    500: '#9E79D2',
    600: '#8353C5',
    700: '#6B45A1',
  },
  status: {
    positive: '#7AE870',
    partial: '#F3AF25',
    negative: '#FF4D5B',
  },
  highlight: '#F3C23D',
  /** Near-black used for the light-theme hero card + selected chips */
  ink: '#141414',
  /** Light neutral fill for chips, search fields, avatars */
  fill: '#F3F4F6',
  material: {
    lightThin: 'rgba(251,251,253,0.10)',
    lightAverage: 'rgba(251,251,253,0.33)',
    lightThick: 'rgba(251,251,253,0.66)',
    darkThin: 'rgba(23,25,28,0.10)',
    darkAverage: 'rgba(23,25,28,0.33)',
    darkThick: 'rgba(23,25,28,0.66)',
  },
  marketing: {
    ground: '#FFFFFF',
    muralFg: '#D1D6E0',
  },
} as const;

export const colors = {
  light: {
    primary: {
      main: palette.grey[900],
      light: palette.grey[800],
      dark: '#000000',
      contrast: palette.grey[100],
    },
    secondary: {
      main: palette.royal[500],
      light: palette.royal[400],
      dark: palette.royal[600],
    },
    text: {
      primary: palette.grey[900],
      secondary: palette.grey[600],
      disabled: palette.grey[500],
      muted: palette.grey[500],
      highlight: palette.royal[500],
      inverse: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
      surface: palette.fill,
      surface2: palette.grey[200],
      header: '#FFFFFF',
      disabled: palette.grey[200],
      accent: '#F5F0FC',
      warm: palette.fill,
      inverse: palette.ink,
    },
    divider: 'rgba(17,19,28,0.06)',
    error: {
      main: palette.status.negative,
      light: '#FF8080',
      dark: '#CC3E48',
      text: '#7F1D24',
      bg: 'rgba(255,77,91,0.10)',
    },
    warning: {
      main: palette.status.partial,
      light: '#F7C560',
      dark: '#C28C1E',
      text: '#7A5500',
      bg: 'rgba(243,175,37,0.12)',
    },
    info: {
      main: palette.royal[400],
      light: palette.royal[300],
      dark: palette.royal[600],
      text: palette.royal[700],
      bg: 'rgba(158,121,210,0.12)',
    },
    success: {
      main: palette.status.positive,
      light: '#9EEF96',
      dark: '#62BA5A',
      text: '#1A4D16',
      bg: 'rgba(122,232,112,0.12)',
    },
    action: {
      active: palette.grey[600],
      hover: palette.grey[200],
      selected: palette.grey[200],
      disabled: palette.grey[500],
      disabledBg: palette.grey[200],
      focus: palette.grey[200],
    },
    inputBorder: palette.material.darkThin,
  },

  dark: {
    primary: {
      main: palette.grey[100],
      light: palette.grey[100],
      dark: palette.grey[300],
      contrast: palette.grey[900],
    },
    secondary: {
      main: palette.royal[500],
      light: palette.royal[400],
      dark: palette.royal[600],
    },
    text: {
      primary: palette.grey[300],
      secondary: palette.grey[500],
      disabled: palette.grey[600],
      muted: palette.grey[500],
      highlight: palette.royal[500],
      inverse: palette.grey[900],
    },
    background: {
      default: palette.grey[900],
      paper: palette.grey[900],
      surface: palette.grey[800],
      surface2: palette.grey[800],
      header: palette.grey[900],
      disabled: palette.grey[800],
      accent: '#1E1A2E',
      warm: palette.grey[800],
      inverse: palette.grey[100],
    },
    divider: palette.material.lightThin,
    error: {
      main: palette.status.negative,
      light: '#FF8080',
      dark: '#CC3E48',
      text: '#FF8080',
      bg: 'rgba(255,77,91,0.15)',
    },
    warning: {
      main: palette.status.partial,
      light: '#F7C560',
      dark: '#C28C1E',
      text: '#F7C560',
      bg: 'rgba(243,175,37,0.15)',
    },
    info: {
      main: palette.royal[400],
      light: palette.royal[300],
      dark: palette.royal[600],
      text: palette.royal[300],
      bg: 'rgba(158,121,210,0.15)',
    },
    success: {
      main: palette.status.positive,
      light: '#9EEF96',
      dark: '#62BA5A',
      text: '#9EEF96',
      bg: 'rgba(122,232,112,0.15)',
    },
    action: {
      active: palette.grey[400],
      hover: palette.material.lightThin,
      selected: 'rgba(251,251,253,0.10)',
      disabled: palette.grey[600],
      disabledBg: palette.grey[800],
      focus: 'rgba(251,251,253,0.08)',
    },
    inputBorder: palette.material.lightThin,
  },

  brand: {
    primary: palette.royal[500],
    primaryLight: palette.royal[400],
    primarySoft: palette.royal[300],
    primaryPressed: palette.royal[600],
    primaryDeep: palette.royal[700],
    highlight: palette.highlight,
    // Legacy aliases — components may reference these during migration
    mint: palette.royal[500],
    mintDark: palette.royal[600],
    violet: palette.royal[600],
    violetDark: palette.royal[700],
    magenta: palette.status.negative,
    magentaDark: '#CC3E48',
    red: palette.status.negative,
    amber: palette.status.partial,
    blue: palette.royal[400],
    mintDim: 'rgba(158,121,210,0.15)',
    mintDim2: 'rgba(158,121,210,0.06)',
    violetDim: 'rgba(131,83,197,0.15)',
    violetDim2: 'rgba(131,83,197,0.06)',
    magentaDim: 'rgba(255,77,91,0.15)',
    redDim: 'rgba(255,77,91,0.15)',
    amberDim: 'rgba(243,175,37,0.15)',
    green: palette.status.positive,
    greenDark: '#62BA5A',
    purple: palette.royal[600],
    purpleDark: palette.royal[700],
    yellow: palette.status.partial,
    greenDim: 'rgba(122,232,112,0.15)',
    greenDim2: 'rgba(122,232,112,0.06)',
    purpleDim: 'rgba(131,83,197,0.15)',
    purpleDim2: 'rgba(131,83,197,0.06)',
    blueDim: 'rgba(184,147,236,0.12)',
    yellowDim: 'rgba(243,175,37,0.15)',
  },

  gradient: {
    light: {
      brand: [palette.royal[500], palette.royal[600]] as const,
      hero: [palette.royal[500], palette.royal[400], palette.royal[300]] as const,
      route: [palette.royal[500], palette.royal[300]] as const,
      phantom: [palette.royal[500], palette.royal[400]] as const,
      avatar1: [palette.royal[500], palette.royal[600]] as const,
      avatar2: [palette.royal[400], palette.royal[600]] as const,
      avatar3: [palette.royal[300], palette.royal[500]] as const,
      avatar4: [palette.status.partial, palette.royal[500]] as const,
      avatar5: [palette.royal[400], palette.royal[700]] as const,
    },
    dark: {
      brand: [palette.royal[500], palette.royal[600]] as const,
      hero: [palette.royal[500], palette.royal[400], palette.royal[300]] as const,
      route: [palette.royal[500], palette.royal[300]] as const,
      phantom: [palette.royal[500], palette.royal[400]] as const,
      avatar1: [palette.royal[500], palette.royal[600]] as const,
      avatar2: [palette.royal[400], palette.royal[600]] as const,
      avatar3: [palette.royal[300], palette.royal[500]] as const,
      avatar4: [palette.status.partial, palette.royal[500]] as const,
      avatar5: [palette.royal[400], palette.royal[700]] as const,
    },
  },
};

export type ColorMode = 'light' | 'dark';
export type ThemeColors = typeof colors.light;
