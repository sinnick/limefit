import React, { createContext, useMemo } from 'react';
import {
  darkPalette,
  lightPalette,
  shadows,
  lightShadows,
  type Palette,
  type Shadows,
} from '../constants/theme';
import { useSettings } from '../store/userStore';

// ============================================================================
// ThemeProvider (CONTRACT-fase1 §4.1 / 1.7).
//
// Lee `settings.temaOscuro` del userStore y expone la paleta + sombras activas
// por contexto. El toggle vive en PerfilScreen (updateSettings({ temaOscuro })):
// al cambiarlo, este provider re-renderiza y todas las pantallas que consumen
// `useTheme()` reciben la nueva paleta. Las pantallas viejas (que importan
// `colors` directo) no cambian — migración progresiva. Default dark = look actual.
// ============================================================================

export interface ThemeContextValue {
  colors: Palette;
  shadows: Shadows;
  isDark: boolean;
}

// Valor por defecto = dark (coincide con el default temaOscuro=true).
export const ThemeContext = createContext<ThemeContextValue>({
  colors: darkPalette,
  shadows,
  isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const settings = useSettings();
  const isDark = settings.temaOscuro;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkPalette : lightPalette,
      shadows: isDark ? shadows : lightShadows,
      isDark,
    }),
    [isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
