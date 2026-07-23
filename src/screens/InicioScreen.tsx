import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../hooks/useTheme';
import { fontFamily } from '../constants/theme';
import { RootStackParamList } from '../types';
import { useUser, useUserStore } from '../store/userStore';
import { useRutinasQuery } from '../services/queries';
import { useRutinas } from '../store/rutinasStore';
import { useAsistenciaStore, useAsistenciaHistorial } from '../store/asistenciaStore';
import { calcularRachaAsistencia, diaKey } from '../utils/asistenciaStats';
import { Loading, HabitHeatmap, UserHeader, SyncStatusBadge } from '../components';

// ============================================================================
// InicioScreen — home simple: marcar el día, ver la constancia, entrar a la rutina.
//
// Jerarquía (ui-taste): el hero de RACHA es la firma de la pantalla — número
// gigante en Bebas. El accent rojo se reserva para datos y acción; las
// superficies hacen el trabajo de profundidad. La constancia arranca colapsada
// a la semana (una fila) y se expande al mes al tocarla, para no comerse la
// pantalla. Densidad deliberada: hero generoso, fila de rutina compacta.
// ============================================================================

interface InicioScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Inicio'>;
}

const ICON = 20; // un solo tamaño de icono en toda la pantalla

export const InicioScreen: React.FC<InicioScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const user = useUser();
  const insets = useSafeAreaInsets();
  const logout = useUserStore((state) => state.logout);
  const rutinas = useRutinas();

  const historial = useAsistenciaHistorial();
  const marcarAsistencia = useAsistenciaStore((s) => s.marcarAsistencia);
  const { isLoading, refetch, isRefetching } = useRutinasQuery();

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

  const handleMarcar = () => {
    if (!yaHoy) marcarAsistencia({ metodo: 'manual' });
  };

  if (isLoading) {
    return <Loading fullScreen message="Cargando..." />;
  }

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
        <UserHeader />

        {/* ---- Hero de racha (firma de la pantalla) ---- */}
        <View style={styles.hero}>
          <View style={styles.rachaRow}>
            <Text style={[styles.rachaNumero, { color: colors.accent }]}>{racha.actual}</Text>
            <View style={styles.rachaMeta}>
              <Text style={[styles.rachaLabel, { color: colors.textPrimary }]}>
                {racha.actual === 1 ? 'día seguido' : 'días seguidos'}
              </Text>
              <Text style={[styles.rachaSub, { color: colors.textSecondary }]}>
                {racha.actual === 0
                  ? 'Sin racha activa'
                  : `Tu mejor racha: ${racha.mejor}`}
              </Text>
              <View style={styles.syncRow}>
                <SyncStatusBadge />
              </View>
            </View>
          </View>

        </View>

        {/* ---- Acción principal ---- */}
        <View style={styles.ctaWrap}>
          <Pressable
            onPress={handleMarcar}
            disabled={yaHoy}
            accessibilityRole="button"
            accessibilityLabel={yaHoy ? 'Ya registraste hoy' : 'Marcar que fuiste al gym hoy'}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: yaHoy ? colors.surface : colors.accent,
                borderColor: yaHoy ? colors.accent : 'transparent',
                transform: [{ scale: pressed ? 0.98 : 1 }],
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Ionicons
              name={yaHoy ? 'checkmark-circle' : 'add-circle-outline'}
              size={ICON}
              color={yaHoy ? colors.accent : colors.white}
            />
            <Text style={[styles.ctaText, { color: yaHoy ? colors.accent : colors.white }]}>
              {yaHoy ? 'Listo por hoy' : 'Fui al gym hoy'}
            </Text>
          </Pressable>
        </View>

        {/* ---- Constancia (colapsada a la semana; se expande al mes) ---- */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Constancia</Text>
          <HabitHeatmap fechas={fechas} />
        </View>

        {/* ---- Rutina: fila con hairline, sin card ---- */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Entrenamiento</Text>
          <Pressable
            onPress={() => navigation.navigate('Rutinas')}
            accessibilityRole="button"
            accessibilityLabel="Ver mis rutinas"
            style={({ pressed }) => [
              styles.fila,
              {
                borderTopColor: colors.border,
                borderBottomColor: colors.border,
                backgroundColor: pressed ? colors.surface : 'transparent',
              },
            ]}
          >
            <View>
              <Text style={[styles.filaTitulo, { color: colors.textPrimary }]}>Mis rutinas</Text>
              <Text style={[styles.filaSub, { color: colors.textSecondary }]}>
                {rutinas.length === 0
                  ? 'Todavía no tenés rutinas asignadas'
                  : `${rutinas.length} ${rutinas.length === 1 ? 'rutina asignada' : 'rutinas asignadas'}`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={ICON} color={colors.textMuted} />
          </Pressable>
        </View>

        <Pressable
          onPress={logout}
          accessibilityRole="button"
          style={({ pressed }) => [styles.logout, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.logoutText, { color: colors.textMuted }]}>Cerrar sesión</Text>
        </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
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
    borderTopWidth: 1,
    borderBottomWidth: 1,
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

  logout: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  logoutText: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
  },
});

export default InicioScreen;
