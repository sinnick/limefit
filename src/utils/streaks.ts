// Alias de compatibilidad. La lógica canónica de rachas y logros (1.4) vive en
// `achievements.ts` (nombre del CONTRACT-fase1 §4.1). Este archivo re-exporta
// para quien la busque como "streaks". No agrega lógica nueva.
export { calcularRacha, calcularLogros } from './achievements';
