import type { BrandConfig } from './types';
import limefitJson from './limefit/brand.json';
import levelgymJson from './levelgym/brand.json';

// Registry ESTÁTICO. Los datos de cada marca viven en brand.json (única fuente de
// verdad) para que tanto este módulo (runtime) como app.config.ts (build-time, Node)
// puedan leerlos: Node requiere .json nativamente y no podría requerir .ts anidados.
// NO usar require dinámico por marca — Metro no resuelve template strings en require.
const BRANDS: Record<string, BrandConfig> = {
  limefit: limefitJson as BrandConfig,
  levelgym: levelgymJson as BrandConfig,
};

// Logos de imagen (require de assets) — no representables en JSON; opcional por marca.
// Si una marca tiene logo de imagen, agregá: levelgym: require('./levelgym/assets/logo.png')
const LOGO_IMAGES: Record<string, number> = {};

for (const key of Object.keys(BRANDS)) {
  if (LOGO_IMAGES[key]) BRANDS[key].logoImage = LOGO_IMAGES[key];
}

export const DEFAULT_BRAND = 'limefit';

// Runtime/JS. Metro inlinea EXPO_PUBLIC_BRAND como string literal en build,
// por eso cambiar de marca exige reiniciar Metro con --clear.
export const activeBrand: BrandConfig =
  BRANDS[process.env.EXPO_PUBLIC_BRAND ?? DEFAULT_BRAND] ?? BRANDS[DEFAULT_BRAND];

export { BRANDS };
