import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Animated,
  Easing,
  AccessibilityInfo,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../hooks/useTheme';
import { fontFamily } from '../constants/theme';
import { RootStackParamList } from '../types';
import { useUser, useUserStore } from '../store/userStore';
import { useRutinasQuery, useAvisoBannerQuery } from '../services/queries';
import { useRutinas } from '../store/rutinasStore';
import { useAsistenciaStore, useAsistenciaHistorial } from '../store/asistenciaStore';
import { calcularRachaAsistencia, diaKey } from '../utils/asistenciaStats';
import { Loading, HabitHeatmap, UserHeader, SyncStatusBadge, AvisoBanner } from '../components';

// ============================================================================
// InicioScreen — home simple: marcar el día, ver la constancia, ir a la rutina.
//
// Jerarquía (ui-taste): el hero de RACHA es la firma — número gigante en Bebas.
// El accent se reserva para datos y acción; las superficies dan la profundidad.
//
// Polish (design-eng): marcar el día es la ÚNICA acción diaria, así que es el
// momento que se celebra — háptica de éxito + pop del número de racha (la celda
// hace lo suyo en HabitHeatmap). El CTA se transforma con crossfade en vez de
// cortar entre estados. Entrada con stagger corto.
// ============================================================================

interface InicioScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Inicio'>;
}

const ICON = 20; // un solo tamaño de icono en toda la pantalla

/** Bloque que entra con fade + desplazamiento corto, escalonado por `orden`. */
const Entrada: React.FC<{ orden: number; activo: boolean; children: React.ReactNode }> = ({
  orden,
  activo,
  children,
}) => {
  const v = useRef(new Animated.Value(activo ? 0 : 1)).current;

  useEffect(() => {
    if (!activo) return;
    Animated.timing(v, {
      toValue: 1,
      duration: 260,
      delay: orden * 50,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activo, orden, v]);

  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
};

export const InicioScreen: React.FC<InicioScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const user = useUser();
  const insets = useSafeAreaInsets();
  const logout = useUserStore((state) => state.logout);
  const rutinas = useRutinas();

  const historial = useAsistenciaHistorial();
  const marcarAsistencia = useAsistenciaStore((s) => s.marcarAsistencia);
  const desmarcarAsistencia = useAsistenciaStore((s) => s.desmarcarAsistencia);
  const { isLoading, isError, refetch, isRefetching } = useRutinasQuery();
  const { data: aviso } = useAvisoBannerQuery();

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (vivo) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      vivo = false;
      sub.remove();
    };
  }, []);

  // Fechas del socio logueado (el store guarda por DNI).
  const fechas = useMemo(() => {
    const dni = user?.DNI ?? '';
    return historial.filter((a) => a.dni === dni).map((a) => a.fecha);
  }, [historial, user?.DNI]);

  const racha = useMemo(() => calcularRachaAsistencia(fechas), [fechas]);
  const yaHoy = useMemo(() => {
    const hoy = diaKey(new Date().toISOString());
    return fechas.some((f) => diaKey(f) === hoy);
  }, [fechas]);

  // --- Animaciones ---
  const popRacha = useRef(new Animated.Value(1)).current; // número que sube
  const escalaCta = useRef(new Animated.Value(1)).current; // press del CTA
  const fadeCta = useRef(new Animated.Value(1)).current; // crossfade de estado

  // El número de racha hace pop cuando crece. Nunca al montar.
  const rachaPrevia = useRef(racha.actual);
  useEffect(() => {
    if (racha.actual > rachaPrevia.current && !reduceMotion) {
      popRacha.setValue(1);
      Animated.sequence([
        Animated.spring(popRacha, {
          toValue: 1.14,
          speed: 50,
          bounciness: 10,
          useNativeDriver: true,
        }),
        Animated.spring(popRacha, {
          toValue: 1,
          speed: 20,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
    rachaPrevia.current = racha.actual;
  }, [racha.actual, reduceMotion, popRacha]);

  // Crossfade del contenido del CTA al cambiar de estado (transformar, no cortar).
  const yaHoyPrevio = useRef(yaHoy);
  useEffect(() => {
    if (yaHoy !== yaHoyPrevio.current && !reduceMotion) {
      fadeCta.setValue(0.35);
      Animated.timing(fadeCta, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
    yaHoyPrevio.current = yaHoy;
  }, [yaHoy, reduceMotion, fadeCta]);

  // El CTA marca si falta, o abre el deshacer si ya está listo. El estado
  // cumplido sigue siendo tocable a propósito: es la única vía para revertir un
  // toque accidental (marcar es irreversible sin esto).
  const handleCta = () => {
    if (yaHoy) {
      Alert.alert('Registrado hoy', '¿Querés deshacer el registro de hoy?', [
        {
          text: 'Deshacer',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            desmarcarAsistencia();
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]);
      return;
    }
    // Háptica primero: la confirmación táctil debe coincidir con el toque.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    marcarAsistencia({ metodo: 'manual' });
  };

  // El engranaje del header abre el menú de cuenta: editar perfil (foto, datos)
  // o cerrar sesión.
  const abrirCuenta = () => {
    Alert.alert(user?.NAME || 'Tu cuenta', undefined, [
      { text: 'Editar perfil', onPress: () => navigation.navigate('EditarPerfil') },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  // Press: hundido inmediato, release con spring (RN no interpola el estilo
  // de `pressed`, así que el rebote lo damos nosotros).
  const alPresionar = () => {
    Animated.spring(escalaCta, {
      toValue: 0.97,
      speed: 50,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };
  const alSoltar = () => {
    // Critically damped (Apple §4): soltar el botón es un reposition sin
    // momentum, no un flick — no debe rebotar. El delight del check-in vive en
    // los pops de la celda y la racha, no en el botón.
    Animated.spring(escalaCta, {
      toValue: 1,
      speed: 30,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  if (isLoading) {
    return <Loading fullScreen message="Cargando..." />;
  }

  const listo = yaHoy;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <UserHeader onSettingsPress={abrirCuenta} />

        {/* ---- Aviso de servicio del gym (si hay uno vigente) ---- */}
        {aviso ? <AvisoBanner aviso={aviso} /> : null}

        {/* ---- Hero de racha ---- */}
        <Entrada orden={0} activo={!reduceMotion}>
          <View style={styles.hero}>
            <View style={styles.rachaRow}>
              <Animated.Text
                style={[
                  styles.rachaNumero,
                  { color: colors.accent, transform: [{ scale: popRacha }] },
                ]}
              >
                {racha.actual}
              </Animated.Text>
              <View style={styles.rachaMeta}>
                <Text style={[styles.rachaLabel, { color: colors.textPrimary }]}>
                  {racha.actual === 1 ? 'día seguido' : 'días seguidos'}
                </Text>
                <Text style={[styles.rachaSub, { color: colors.textSecondary }]}>
                  {racha.actual === 0 ? 'Sin racha activa' : `Tu mejor racha: ${racha.mejor}`}
                </Text>
                <View style={styles.syncRow}>
                  <SyncStatusBadge />
                </View>
              </View>
            </View>
          </View>
        </Entrada>

        {/* ---- Acción principal ---- */}
        <Entrada orden={1} activo={!reduceMotion}>
          <View style={styles.ctaWrap}>
            <Animated.View style={{ transform: [{ scale: escalaCta }] }}>
              <Pressable
                onPress={handleCta}
                onPressIn={alPresionar}
                onPressOut={alSoltar}
                accessibilityRole="button"
                accessibilityLabel={
                  listo ? 'Registrado hoy. Tocá para deshacer.' : 'Marcar que fuiste al gym hoy'
                }
                accessibilityHint={listo ? 'Abre la opción de deshacer el registro' : undefined}
                style={[
                  styles.cta,
                  {
                    // Estado cumplido = voz baja (hairline neutro). El accent
                    // sólido queda para cuando TODAVÍA falta marcar.
                    backgroundColor: listo ? 'transparent' : colors.accent,
                    borderColor: listo ? colors.border : 'transparent',
                  },
                ]}
              >
                <Animated.View style={[styles.ctaContenido, { opacity: fadeCta }]}>
                  <Ionicons
                    name={listo ? 'checkmark-circle' : 'add-circle-outline'}
                    size={ICON}
                    color={listo ? colors.accent : colors.white}
                  />
                  <Text
                    style={[
                      styles.ctaText,
                      { color: listo ? colors.textSecondary : colors.white },
                    ]}
                  >
                    {listo ? 'Listo por hoy' : 'Fui al gym hoy'}
                  </Text>
                </Animated.View>
              </Pressable>
            </Animated.View>
          </View>
        </Entrada>

        {/* ---- Constancia (semana; se expande al mes) ---- */}
        <Entrada orden={2} activo={!reduceMotion}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Constancia</Text>
            <HabitHeatmap fechas={fechas} />
          </View>
        </Entrada>

        {/* ---- Rutina: fila con hairline ---- */}
        <Entrada orden={3} activo={!reduceMotion}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Entrenamiento
            </Text>
            {(() => {
              // Un fallo de red sin datos cacheados NO es "no tenés rutinas":
              // esa mentira deja al socio sin saber que puede reintentar.
              const cargaFallida = isError && rutinas.length === 0;
              return (
                <Pressable
                  onPress={() => (cargaFallida ? refetch() : navigation.navigate('Rutinas'))}
                  accessibilityRole="button"
                  accessibilityLabel={cargaFallida ? 'Reintentar cargar rutinas' : 'Ver mis rutinas'}
                  style={({ pressed }) => [
                    styles.fila,
                    {
                      borderTopColor: colors.border,
                      borderBottomColor: colors.border,
                      backgroundColor: pressed ? colors.surface : 'transparent',
                    },
                  ]}
                >
                  <View style={styles.filaTexto}>
                    <Text style={[styles.filaTitulo, { color: colors.textPrimary }]}>
                      Mis rutinas
                    </Text>
                    <Text
                      style={[
                        styles.filaSub,
                        { color: cargaFallida ? colors.accent : colors.textSecondary },
                      ]}
                    >
                      {cargaFallida
                        ? 'No pudimos cargarlas · tocá para reintentar'
                        : rutinas.length === 0
                          ? 'Todavía no tenés rutinas asignadas'
                          : `${rutinas.length} ${rutinas.length === 1 ? 'rutina asignada' : 'rutinas asignadas'}`}
                    </Text>
                  </View>
                  <Ionicons
                    name={cargaFallida ? 'refresh' : 'chevron-forward'}
                    size={ICON}
                    color={cargaFallida ? colors.accent : colors.textMuted}
                  />
                </Pressable>
              );
            })()}
          </View>
        </Entrada>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hero — densidad generosa
  hero: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  rachaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rachaNumero: {
    fontFamily: fontFamily.bold, // Bebas Neue
    fontSize: 72,
    lineHeight: 76,
  },
  rachaMeta: {
    flex: 1,
    gap: 4,
  },
  rachaLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    letterSpacing: 1,
  },
  rachaSub: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
  },
  syncRow: {
    flexDirection: 'row',
    marginTop: 4,
  },

  // CTA
  ctaWrap: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  cta: {
    height: 56,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaText: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    letterSpacing: 1,
  },

  // Secciones
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Fila de rutina — densidad compacta
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filaTexto: {
    flex: 1,
    paddingRight: 12,
  },
  filaTitulo: {
    fontFamily: fontFamily.semibold,
    fontSize: 17,
  },
  filaSub: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    marginTop: 2,
  },

});

export default InicioScreen;
