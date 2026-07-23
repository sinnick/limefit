import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { fontFamily } from '../constants/theme';
import { AvisoServicio } from '../types';

// ============================================================================
// AvisoBanner — banner de aviso de servicio del gym en la home (ej. "Sede
// cerrada hoy por reparaciones"). Es información al público, no publicidad: se
// muestra fijo arriba de todo mientras el aviso esté vigente (no se descarta).
//
// El NIVEL da el tono: `info` = neutro (surface + acento sutil), `importante` =
// alerta (tinte del accent). Sigue el lenguaje de la home: hairline, radius 16,
// icono de 20.
// ============================================================================

const ICON = 20;

export const AvisoBanner: React.FC<{ aviso: AvisoServicio }> = ({ aviso }) => {
  const { colors } = useTheme();
  const importante = aviso.nivel === 'importante';

  // Entrada suave: el aviso llega async (query) y sin esto empujaría el hero de
  // golpe. Fade + leve descenso, ~250ms ease-out. Reduce-motion → solo opacity.
  const v = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => vivo && setReduceMotion(r));
    return () => {
      vivo = false;
    };
  }, []);
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [v, aviso.id]);

  const acento = importante ? colors.accent : colors.textSecondary;
  const fondo = importante ? `${colors.accent}14` : colors.surface;
  const borde = importante ? colors.accent : colors.border;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: v,
          transform: reduceMotion
            ? undefined
            : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
        },
      ]}
    >
      <View
        style={[styles.banner, { backgroundColor: fondo, borderColor: borde }]}
        accessibilityRole="alert"
        accessibilityLabel={`Aviso: ${aviso.titulo}. ${aviso.cuerpo}`}
      >
        <Ionicons
          name={importante ? 'alert-circle' : 'information-circle'}
          size={ICON}
          color={acento}
          style={styles.icon}
        />
        <View style={styles.texto}>
          <Text style={[styles.titulo, { color: colors.textPrimary }]}>{aviso.titulo}</Text>
          <Text style={[styles.cuerpo, { color: colors.textSecondary }]}>{aviso.cuerpo}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    marginTop: 1,
  },
  texto: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  cuerpo: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 19,
  },
});

export default AvisoBanner;
