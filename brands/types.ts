// White-label: contrato de cada marca.
// Una sola base de código; la marca activa se resuelve por env var (ver registry.ts).

export interface BrandPalette {
  // `accent` es el color de marca (reemplaza el antiguo hardcode "lime").
  accent: string;
  accentDark: string;
  accentLight: string;

  // Fondos
  background: string;
  surface: string;
  surfaceLight: string;
  card: string;

  // Texto
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Estados
  success: string;
  error: string;
  warning: string;
  info: string;

  // Misc
  border: string;
}

// Identidad nativa (consumida por app.config.ts en build-time vía APP_BRAND).
export interface BrandNativeConfig {
  name: string; // app.json "name"
  slug: string; // expo slug
  scheme: string; // deep link scheme
  bundleIdentifier: string; // iOS
  androidPackage: string; // Android
  easProjectId: string; // EAS project (uno por marca)
  splashBackgroundColor: string;
}

export interface BrandConfig {
  // Debe coincidir con el nombre de carpeta y con el valor de APP_BRAND/EXPO_PUBLIC_BRAND.
  key: string;

  // Identidad de producto (runtime)
  appName: string; // displayName visible, ej. 'LimeFit'
  tagline: string;
  logoEmoji?: string;
  // Ruta de logo de imagen (require) opcional; si está, tiene prioridad sobre el emoji.
  logoImage?: number;

  // Backend multi-tenant: identificador enviado en cada request.
  tenantId: string;

  // Identidad nativa (build)
  native: BrandNativeConfig;

  // Paleta de colores de la marca
  palette: BrandPalette;
}
