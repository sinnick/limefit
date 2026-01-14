import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { colors, fontFamily } from '../../constants/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'lime';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  outlined?: boolean;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.surface, text: colors.textSecondary },
  success: { bg: `${colors.success}20`, text: colors.success },
  warning: { bg: `${colors.warning}20`, text: colors.warning },
  error: { bg: `${colors.error}20`, text: colors.error },
  info: { bg: `${colors.info}20`, text: colors.info },
  lime: { bg: `${colors.lime}20`, text: colors.lime },
};

const sizeConfig: Record<BadgeSize, { paddingH: number; paddingV: number; fontSize: number }> = {
  sm: { paddingH: 8, paddingV: 2, fontSize: 10 },
  md: { paddingH: 12, paddingV: 4, fontSize: 12 },
  lg: { paddingH: 16, paddingV: 6, fontSize: 14 },
};

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  size = 'md',
  outlined = false,
  style,
}) => {
  const colorConfig = variantColors[variant];
  const sizeStyles = sizeConfig[size];

  const containerStyle: ViewStyle = {
    alignSelf: 'flex-start',
    paddingHorizontal: sizeStyles.paddingH,
    paddingVertical: sizeStyles.paddingV,
    borderRadius: 100,
    backgroundColor: outlined ? 'transparent' : colorConfig.bg,
    borderWidth: outlined ? 1 : 0,
    borderColor: colorConfig.text,
    ...style,
  };

  const textStyle: TextStyle = {
    fontFamily: fontFamily.semibold,
    fontSize: sizeStyles.fontSize,
    color: colorConfig.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  };

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{text}</Text>
    </View>
  );
};

// Grupo Muscular Badge
interface GrupoMuscularBadgeProps {
  grupo: string;
  size?: BadgeSize;
}

const grupoColors: Record<string, BadgeVariant> = {
  pecho: 'lime',
  espalda: 'info',
  hombros: 'warning',
  biceps: 'success',
  triceps: 'success',
  piernas: 'error',
  abdominales: 'default',
  gluteos: 'error',
  cardio: 'warning',
  fullbody: 'lime',
};

export const GrupoMuscularBadge: React.FC<GrupoMuscularBadgeProps> = ({
  grupo,
  size = 'sm',
}) => {
  const variant = grupoColors[grupo.toLowerCase()] || 'default';

  return (
    <Badge
      text={grupo}
      variant={variant}
      size={size}
    />
  );
};

// Dificultad Badge
interface DificultadBadgeProps {
  dificultad: 'principiante' | 'intermedio' | 'avanzado';
  size?: BadgeSize;
}

const dificultadConfig: Record<string, { variant: BadgeVariant; label: string }> = {
  principiante: { variant: 'success', label: 'Principiante' },
  intermedio: { variant: 'warning', label: 'Intermedio' },
  avanzado: { variant: 'error', label: 'Avanzado' },
};

export const DificultadBadge: React.FC<DificultadBadgeProps> = ({
  dificultad,
  size = 'sm',
}) => {
  const config = dificultadConfig[dificultad] || dificultadConfig.principiante;

  return (
    <Badge
      text={config.label}
      variant={config.variant}
      size={size}
    />
  );
};

export default Badge;
