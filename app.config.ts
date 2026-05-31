import { ExpoConfig, ConfigContext } from 'expo/config';
import limefitBrand from './brands/limefit/brand.json';
import levelgymBrand from './brands/levelgym/brand.json';

// Configuración dinámica white-label. La marca se elige con APP_BRAND (build-time).
// Reemplaza al antiguo app.json estático. Se leen los brand.json directamente
// (no se importa brands/registry.ts: el loader de Expo no resuelve .ts anidados).
const BRANDS = { limefit: limefitBrand, levelgym: levelgymBrand } as const;
const DEFAULT_BRAND = 'limefit';

export default ({ config }: ConfigContext): ExpoConfig => {
  const key = (process.env.APP_BRAND ?? DEFAULT_BRAND) as keyof typeof BRANDS;
  const brand = BRANDS[key] ?? BRANDS[DEFAULT_BRAND];
  const n = brand.native;
  const assets = `./brands/${brand.key}/assets`;

  return {
    ...config,
    name: n.name,
    slug: n.slug,
    version: '1.0.0',
    orientation: 'portrait',
    icon: `${assets}/icon.png`,
    userInterfaceStyle: 'light',
    scheme: n.scheme,
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: n.bundleIdentifier,
    },
    android: {
      package: n.androidPackage,
      adaptiveIcon: {
        foregroundImage: `${assets}/adaptive-icon.png`,
        backgroundColor: n.splashBackgroundColor,
      },
    },
    web: {
      favicon: `${assets}/icon.png`,
    },
    extra: {
      eas: { projectId: n.easProjectId },
      // Accesible en runtime vía Constants.expoConfig.extra.brand.
      brand: brand.key,
    },
    plugins: [
      'expo-font',
      [
        'expo-splash-screen',
        {
          image: `${assets}/splash.png`,
          resizeMode: 'contain',
          backgroundColor: n.splashBackgroundColor,
        },
      ],
      'expo-status-bar',
      'expo-system-ui',
    ],
  };
};
