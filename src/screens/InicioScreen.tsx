import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../hooks/useTheme';
import { fontFamily, shadows } from '../constants/theme';
import { RootStackParamList } from '../types';
import { useUser, useUserStore } from '../store/userStore';
import { useRutinasQuery } from '../services/queries';
import { useRutinas } from '../store/rutinasStore';
import { useAsistenciaStore, useAsistenciaHistorial } from '../store/asistenciaStore';
import { Loading, Card, HabitHeatmap, UserHeader, SyncStatusBadge } from '../components';

// ============================================================================
// InicioScreen (versión simple). Solo lo esencial que pidió el usuario:
//   1. Botón "Fui al gym hoy" → marca asistencia (asistenciaStore, offline-first).
//   2. Heatmap de asistencia estilo commit graph de GitHub.
//   3. Acceso a "Mis Rutinas".
// El resto de pantallas siguen registradas en el stack (App.tsx) pero sin
// accesos desde acá — se pueden reactivar cuando haga falta.
// ============================================================================

interface InicioScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Inicio'>;
}

export const InicioScreen: React.FC<InicioScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const user = useUser();
  const insets = useSafeAreaInsets();
  const logout = useUserStore((state) => state.logout);
  const rutinas = useRutinas();

  const historial = useAsistenciaHistorial();
  const marcarAsistencia = useAsistenciaStore((s) => s.marcarAsistencia);

  const { isLoading, refetch, isRefetching } = useRutinasQuery();

  // ¿Ya registró hoy? Derivado del historial para que sea reactivo al marcar.
  const yaHoy = useMemo(() => {
    const dni = user?.DNI ?? '';
    const hoy = new Date();
    const claveHoy = `${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}`;
    return historial.some((a) => {
      const d = new Date(a.fecha);
      return a.dni === dni && `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === claveHoy;
    });
  }, [historial, user?.DNI]);

  const fechasAsistencia = useMemo(() => historial.map((a) => a.fecha), [historial]);

  const handleMarcar = () => {
    if (yaHoy) return;
    marcarAsistencia({ metodo: 'manual' });
  };

  if (isLoading) {
    return <Loading fullScreen message="Cargando..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
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

        <View style={styles.syncRow}>
          <SyncStatusBadge />
        </View>

        {/* Botón "Fui al gym hoy" */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={yaHoy ? 1 : 0.85}
            onPress={handleMarcar}
            style={[
              styles.checkinButton,
              {
                backgroundColor: yaHoy ? colors.surfaceLight : colors.accent,
                borderColor: yaHoy ? colors.accent : 'transparent',
                borderWidth: yaHoy ? 1.5 : 0,
              },
            ]}
          >
            <Ionicons
              name={yaHoy ? 'checkmark-circle' : 'barbell'}
              size={26}
              color={yaHoy ? colors.accent : colors.black}
            />
            <Text
              style={[
                styles.checkinText,
                { color: yaHoy ? colors.accent : colors.black },
              ]}
            >
              {yaHoy ? '¡Registrado hoy!' : 'Fui al gym hoy'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Heatmap de asistencia */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tu constancia</Text>
          <Card variant="default" padding="lg">
            <HabitHeatmap fechas={fechasAsistencia} />
          </Card>
        </View>

        {/* Acceso a rutinas */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Entrenamiento</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Rutinas')}>
            <Card variant="default" padding="lg">
              <View style={styles.rutinaRow}>
                <View style={[styles.rutinaIcon, { backgroundColor: `${colors.accent}20` }]}>
                  <Ionicons name="barbell-outline" size={26} color={colors.accent} />
                </View>
                <View style={styles.rutinaTextWrap}>
                  <Text style={[styles.rutinaTitle, { color: colors.textPrimary }]}>Mis Rutinas</Text>
                  <Text style={[styles.rutinaSubtitle, { color: colors.textSecondary }]}>
                    {rutinas.length} {rutinas.length === 1 ? 'rutina asignada' : 'rutinas asignadas'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  syncRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    marginBottom: 16,
  },
  checkinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    borderRadius: 20,
    ...shadows.md,
  },
  checkinText: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
  },
  rutinaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rutinaIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rutinaTextWrap: {
    flex: 1,
  },
  rutinaTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    marginBottom: 2,
  },
  rutinaSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginHorizontal: 20,
  },
  logoutText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
  },
});

export default InicioScreen;
