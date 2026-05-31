// Design System (white-label)
// Tema oscuro con accent de marca. Los colores se derivan del brand activo
// (ver brands/registry.ts); la interfaz `colors`/`shadows` se mantiene igual
// para no tocar los archivos consumidores.
import { activeBrand } from '../../brands/registry';

const p = activeBrand.palette;

export const colors = {
  // Accent de marca. Se mantienen las keys `lime*` como alias del accent para
  // no tener que reescribir los usos existentes (`colors.lime`, variant="lime", etc.).
  accent: p.accent,
  accentDark: p.accentDark,
  accentLight: p.accentLight,
  lime: p.accent,
  limeDark: p.accentDark,
  limeLight: p.accentLight,

  // Background
  background: p.background,
  surface: p.surface,
  surfaceLight: p.surfaceLight,
  card: p.card,

  // Text
  textPrimary: p.textPrimary,
  textSecondary: p.textSecondary,
  textMuted: p.textMuted,

  // Status
  success: p.success,
  error: p.error,
  warning: p.warning,
  info: p.info,

  // Misc
  border: p.border,
  overlay: 'rgba(0, 0, 0, 0.7)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const fontFamily = {
  regular: 'Work-Sans',
  medium: 'Work-Sans-Medium',
  semibold: 'Work-Sans-SemiBold',
  bold: 'Work-Sans-Bold',
  light: 'Work-Sans-Light',
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Glow con el accent de marca (key `lime` conservada como alias).
  lime: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// Alias canónico (mismo objeto que shadows.lime).
export const accentShadow = shadows.lime;

export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type FontSize = typeof fontSize;
export type FontFamily = typeof fontFamily;
