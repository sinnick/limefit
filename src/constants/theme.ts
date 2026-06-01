// Design System (white-label)
// Tema oscuro con accent de marca. Los colores se derivan del brand activo
// (ver brands/registry.ts); la interfaz `colors`/`shadows` se mantiene igual
// para no tocar los archivos consumidores.
import { activeBrand } from '../../brands/registry';

const p = activeBrand.palette;

// Paleta DARK (look actual = paleta de la marca). Es la fuente del `colors`
// canónico exportado abajo, por lo que NINGÚN consumidor existente cambia.
export const darkPalette = {
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

// Tipo de paleta con valores ensanchados (string) — dark usa `as const` (literales),
// pero light necesita poder llevar OTROS valores con las MISMAS keys.
export type PaletteShape = { [K in keyof typeof darkPalette]: string };

// Paleta LIGHT (1.7): fondo claro, texto oscuro; el accent de marca se conserva.
// Mismas keys que darkPalette (incluye los alias lime*) → cualquier pantalla que
// use `useTheme().colors` funciona sin cambios al alternar.
export const lightPalette: PaletteShape = {
  accent: p.accent,
  accentDark: p.accentDark,
  accentLight: p.accentLight,
  lime: p.accent,
  limeDark: p.accentDark,
  limeLight: p.accentLight,

  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceLight: '#ECECEF',
  card: '#FFFFFF',

  textPrimary: '#0A0A0A',
  textSecondary: '#4B4B4B',
  textMuted: '#8A8A8A',

  success: p.success,
  error: p.error,
  warning: p.warning,
  info: p.info,

  border: '#DADADE',
  overlay: 'rgba(0, 0, 0, 0.4)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// `colors` canónico = paleta dark (default temaOscuro=true → look actual intacto).
// Las pantallas viejas siguen importando `colors`; las nuevas usan useTheme().
export const colors = darkPalette;

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

// Familias tipográficas de la marca activa (ver brands/<key>/brand.json).
export const fontFamily = activeBrand.fontFamily;

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

// Tipo de sombra ensanchado (sin literales) para poder usar otras opacidades.
type ShadowEntry = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};
export type ShadowsShape = { [K in keyof typeof shadows]: ShadowEntry };

// Sombras para tema claro: misma forma que `shadows` pero con opacidades más
// suaves (sobre fondo claro las sombras oscuras intensas se ven sucias).
export const lightShadows: ShadowsShape = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  lime: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

export type Colors = typeof colors;
// Tipo común a ambas paletas (mismas keys, valores string). useTheme() lo usa.
export type Palette = PaletteShape;
export type Shadows = ShadowsShape;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type FontSize = typeof fontSize;
export type FontFamily = typeof fontFamily;
