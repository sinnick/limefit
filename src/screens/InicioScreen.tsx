import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { colors, fontFamily, shadows } from '../constants/theme';
import { RootStackParamList } from '../types';
import { useUser, useUserStore } from '../store/userStore';
import { useRutinasQuery, useRecordsQuery } from '../services/queries';
import { useRutinas } from '../store/rutinasStore';
import { useHistorialWorkouts } from '../store/workoutStore';
import { Card, ProgressBar, Loading } from '../components/ui';
import { UserHeader } from '../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InicioScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Inicio'>;
}

interface MenuCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  delay?: number;
}

const MenuCard: React.FC<MenuCardProps> = ({
  title,
  subtitle,
  icon,
  color,
  onPress,
  delay = 0,
}) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={[colors.card, colors.surface]}
          style={styles.menuCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={28} color={color} />
          </View>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
          <View style={styles.menuArrow}>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const InicioScreen: React.FC<InicioScreenProps> = ({ navigation }) => {
  const user = useUser();
  const logout = useUserStore((state) => state.logout);
  const rutinas = useRutinas();
  const historial = useHistorialWorkouts();

  const {
    isLoading: loadingRutinas,
    refetch: refetchRutinas,
    isRefetching,
  } = useRutinasQuery();

  const { isLoading: loadingRecords, refetch: refetchRecords } = useRecordsQuery(
    user?.DNI || ''
  );

  const isLoading = loadingRutinas || loadingRecords;

  // Estadísticas
  const entrenamientosEstaSemana = historial.filter((w) => {
    const fecha = new Date(w.fecha);
    const hoy = new Date();
    const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
    return fecha >= inicioSemana;
  }).length;

  const volumenSemana = historial
    .filter((w) => {
      const fecha = new Date(w.fecha);
      const hoy = new Date();
      const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
      return fecha >= inicioSemana;
    })
    .reduce((acc, w) => acc + w.volumenTotal, 0);

  const prsEsteMes = historial
    .filter((w) => {
      const fecha = new Date(w.fecha);
      const hoy = new Date();
      return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
    })
    .reduce((acc, w) => acc + w.prsLogrados, 0);

  const handleRefresh = () => {
    refetchRutinas();
    refetchRecords();
  };

  if (isLoading) {
    return <Loading fullScreen message="Cargando tu gimnasio..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.lime}
            colors={[colors.lime]}
          />
        }
      >
        <UserHeader
          onSettingsPress={() => {
            // TODO: Navigate to settings
          }}
        />

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{entrenamientosEstaSemana}</Text>
              <Text style={styles.statLabel}>Entrenamientos</Text>
              <Text style={styles.statPeriod}>esta semana</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(volumenSemana / 1000).toFixed(1)}k</Text>
              <Text style={styles.statLabel}>Kg Levantados</Text>
              <Text style={styles.statPeriod}>esta semana</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.lime }]}>{prsEsteMes}</Text>
              <Text style={styles.statLabel}>PRs</Text>
              <Text style={styles.statPeriod}>este mes</Text>
            </View>
          </View>
        </Animated.View>

        {/* Menu Cards */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>¿Qué vamos a hacer hoy?</Text>

          <View style={styles.menuGrid}>
            <MenuCard
              title="Mis Rutinas"
              subtitle={`${rutinas.length} rutinas`}
              icon="barbell-outline"
              color={colors.lime}
              onPress={() => navigation.navigate('Rutinas')}
              delay={200}
            />
            <MenuCard
              title="Records"
              subtitle="Tus mejores marcas"
              icon="trophy-outline"
              color="#FFD700"
              onPress={() => navigation.navigate('Records')}
              delay={300}
            />
            <MenuCard
              title="Historial"
              subtitle={`${historial.length} entrenamientos`}
              icon="calendar-outline"
              color={colors.info}
              onPress={() => navigation.navigate('Historial')}
              delay={400}
            />
            <MenuCard
              title="Mi Perfil"
              subtitle="Configuración"
              icon="person-outline"
              color={colors.textSecondary}
              onPress={() => navigation.navigate('Perfil')}
              delay={500}
            />
          </View>
        </View>

        {/* Last Workout */}
        {historial.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.lastWorkoutContainer}>
            <Text style={styles.sectionTitle}>Último entrenamiento</Text>
            <Card variant="gradient" padding="lg">
              <View style={styles.lastWorkoutHeader}>
                <View>
                  <Text style={styles.lastWorkoutName}>{historial[0].rutinaNombre}</Text>
                  <Text style={styles.lastWorkoutDay}>{historial[0].diaNombre}</Text>
                </View>
                <View style={styles.lastWorkoutDate}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.lastWorkoutDateText}>
                    {new Date(historial[0].fecha).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.lastWorkoutStats}>
                <View style={styles.lastWorkoutStat}>
                  <Ionicons name="time-outline" size={20} color={colors.lime} />
                  <Text style={styles.lastWorkoutStatValue}>{historial[0].duracion} min</Text>
                </View>
                <View style={styles.lastWorkoutStat}>
                  <Ionicons name="barbell-outline" size={20} color={colors.lime} />
                  <Text style={styles.lastWorkoutStatValue}>
                    {(historial[0].volumenTotal / 1000).toFixed(1)}k kg
                  </Text>
                </View>
                {historial[0].prsLogrados > 0 && (
                  <View style={styles.lastWorkoutStat}>
                    <Ionicons name="trophy" size={20} color="#FFD700" />
                    <Text style={[styles.lastWorkoutStatValue, { color: '#FFD700' }]}>
                      {historial[0].prsLogrados} PRs
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Logout Button */}
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  statsContainer: {
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...shadows.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: colors.border,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statPeriod: {
    fontFamily: fontFamily.light,
    fontSize: 10,
    color: colors.textMuted,
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  menuArrow: {
    position: 'absolute',
    top: 20,
    right: 16,
  },
  lastWorkoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  lastWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  lastWorkoutName: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  lastWorkoutDay: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  lastWorkoutDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastWorkoutDateText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  lastWorkoutStats: {
    flexDirection: 'row',
    gap: 24,
  },
  lastWorkoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lastWorkoutStatValue: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    color: colors.textPrimary,
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
    color: colors.error,
  },
});

export default InicioScreen;
