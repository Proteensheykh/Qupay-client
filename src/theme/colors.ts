// Qupay — Phantom wallet-inspired dark design system
// Deep purples/navy, clean surfaces, green (#00E5A0) for actions
// Phantom's vibe: polished, premium, quiet confidence

export const colors = {
  light: {
    // Light mode is secondary — app is dark-first
    primary: { main: '#1C1C28', light: '#2D2D3D', dark: '#0F0F18', contrast: '#FFFFFF' },
    secondary: { main: '#AB9FF2', light: '#C4BBFF', dark: '#8B7FD4' },
    text: { primary: '#1C1C28', secondary: '#6E6E80', disabled: '#B8B8C7', muted: '#9494A8', highlight: '#AB9FF2' },
    background: { default: '#FFFFFF', paper: '#FFFFFF', surface: '#F5F5F7', surface2: '#EBEBF0', header: '#FFFFFF', disabled: '#E5E5EA', accent: '#FAF9FF', warm: '#F0EEFF' },
    divider: '#E5E5EA',
    error: { main: '#FF4D6A', light: '#FF6B83', dark: '#D43050', text: '#4F1919', bg: '#FFF0EF' },
    warning: { main: '#FFD460', light: '#FFE08A', dark: '#CCB04D', text: '#63400A', bg: '#FFF8E8' },
    info: { main: '#AB9FF2', light: '#C4BBFF', dark: '#8B7FD4', text: '#2D1F6E', bg: '#F0EEFF' },
    success: { main: '#00E5A0', light: '#33EAAD', dark: '#00B880', text: '#0A3D2A', bg: '#E6FFF5' },
    action: { active: '#6E6E80', hover: '#F5F5F7', selected: '#EBEBF0', disabled: '#B8B8C7', disabledBg: '#F5F5F7', focus: '#EBEBF0' },
    inputBorder: '#E5E5EA',
  },
  dark: {
    primary: { main: '#FFFFF5', light: '#FFFFFF', dark: '#E8E8F0', contrast: '#111118' },
    secondary: { main: '#AB9FF2', light: '#C4BBFF', dark: '#8B7FD4' },
    text: {
      primary: '#FFFFF5',
      secondary: 'rgba(255,255,245,0.6)',
      disabled: 'rgba(255,255,245,0.25)',
      muted: 'rgba(255,255,245,0.4)',
      highlight: '#AB9FF2',
    },
    background: {
      default: '#111118',     // deepest bg
      paper: '#19192A',       // card bg
      surface: '#222236',     // elevated surface
      surface2: '#2A2A42',    // higher surface
      header: '#111118',
      disabled: 'rgba(255,255,245,0.06)',
      accent: '#1A1A2E',
      warm: '#1E1A2E',        // purple tint
    },
    divider: 'rgba(255,255,245,0.08)',
    error: { main: '#FF4D6A', light: '#FF6B83', dark: '#D43050', text: '#FFB4AF', bg: 'rgba(255,77,106,0.12)' },
    warning: { main: '#FFD460', light: '#FFE08A', dark: '#CCB04D', text: '#FFDCA8', bg: 'rgba(255,212,96,0.12)' },
    info: { main: '#AB9FF2', light: '#C4BBFF', dark: '#8B7FD4', text: '#D4CCFF', bg: 'rgba(171,159,242,0.12)' },
    success: { main: '#00E5A0', light: '#33EAAD', dark: '#00B880', text: '#00E5A0', bg: 'rgba(0,229,160,0.12)' },
    action: {
      active: 'rgba(255,255,245,0.56)',
      hover: 'rgba(255,255,245,0.06)',
      selected: 'rgba(255,255,245,0.1)',
      disabled: 'rgba(255,255,245,0.2)',
      disabledBg: 'rgba(255,255,245,0.06)',
      focus: 'rgba(255,255,245,0.08)',
    },
    inputBorder: 'rgba(255,255,245,0.1)',
  },
  brand: {
    green: '#00E5A0',
    greenDark: '#060a07',
    purple: '#AB9FF2',
    purpleDark: '#3B1E90',
    blue: '#4D9EFF',
    red: '#FF4D6A',
    yellow: '#FFD460',
    greenDim: 'rgba(0,229,160,0.12)',
    greenDim2: 'rgba(0,229,160,0.06)',
    purpleDim: 'rgba(171,159,242,0.12)',
    purpleDim2: 'rgba(171,159,242,0.06)',
    blueDim: 'rgba(77,158,255,0.12)',
    redDim: 'rgba(255,77,106,0.12)',
    yellowDim: 'rgba(255,212,96,0.12)',
  },
  gradient: {
    brand: ['#00E5A0', '#00bfff'] as const,
    phantom: ['#AB9FF2', '#534BB1'] as const,
    hero: ['#1A1A2E', '#111118'] as const,
    avatar1: ['#AB9FF2', '#534BB1'] as const,
    avatar2: ['#4D9EFF', '#00E5A0'] as const,
    avatar3: ['#FF9F43', '#00E5A0'] as const,
    avatar4: ['#FF6B6B', '#FFD460'] as const,
    avatar5: ['#A855F7', '#4D9EFF'] as const,
  },
};

export type ColorMode = 'light' | 'dark';
export type ThemeColors = typeof colors.light;
