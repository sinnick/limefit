import { StyleSheet } from 'react-native';

// Paleta de colores principal
export const COLORS = {
  primary: '#adfa1d',       // Verde lima principal
  primaryDark: '#8bc500',   // Verde lima oscuro para efectos
  primaryLight: '#d7ff8c',  // Verde lima claro para acentos
  secondary: '#2d2d2d',     // Gris oscuro
  background: '#1a1a1a',    // Fondo principal oscuro
  darkGray: '#333333',      // Elementos oscuros
  card: '#252525',          // Fondo de tarjetas
  text: '#ffffff',          // Texto principal
  textSecondary: '#bbbbbb', // Texto secundario
  success: '#4BB543',       // Verde para éxito
  error: '#FF3B30',         // Rojo para errores
  warning: '#FF9500',       // Amarillo para advertencias
  overlay: 'rgba(0,0,0,0.7)' // Overlay para modales
};

// Tipografía
export const FONTS = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    color: COLORS.text,
    fontFamily: 'Work-Sans-Bold',
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: COLORS.text,
    fontFamily: 'Work-Sans-SemiBold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.3,
    color: COLORS.text,
    fontFamily: 'Work-Sans-Bold',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: COLORS.text,
    fontFamily: 'Work-Sans-SemiBold',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.15,
    color: COLORS.text,
    fontFamily: 'Work-Sans',
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: 0.15,
    color: COLORS.text,
    fontFamily: 'Work-Sans-SemiBold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: COLORS.textSecondary,
    fontFamily: 'Work-Sans',
  },
  button: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.secondary,
    fontFamily: 'Work-Sans-Bold',
  },
  numbers: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: COLORS.text,
    fontFamily: 'Work-Sans-Bold',
  }
};

// Espaciado
export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

// Bordes
export const BORDER_RADIUS = {
  s: 4,
  m: 8,
  l: 16,
  xl: 24,
  xxl: 32,
  circle: 9999,
};

// Sombras
export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
};

// Mixins de diseño comunes
export const LAYOUT = {
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    ...SHADOWS.small,
  },
};