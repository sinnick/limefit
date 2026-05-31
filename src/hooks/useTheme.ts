import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '../theme/ThemeProvider';

// ============================================================================
// useTheme (CONTRACT-fase1 §4.1 / 1.7).
//
// Devuelve { colors, shadows, isDark } de la paleta activa según
// settings.temaOscuro (provista por ThemeProvider). Las pantallas nuevas usan
// esto en vez de importar `colors` directo de constants/theme; así reaccionan al
// toggle de tema sin cambios extra.
// ============================================================================
export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
