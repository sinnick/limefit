import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontFamily, shadows } from '../constants/theme';
import { RootStackParamList } from '../types';
import { useUser, useUserStore, useSettings } from '../store/userStore';
import { useHistorialWorkouts } from '../store/workoutStore';
import { useRecords } from '../store/recordsStore';
import { calcularLogros } from '../utils/achievements';
import { useMembresiaQuery } from '../services/queries';
import { Card, Button } from '../components/ui';

interface PerfilScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Perfil'>;
}

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  value,
  onPress,
  showArrow = true,
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}
  >
    <View style={styles.settingIcon}>
      <Ionicons name={icon} size={22} color={colors.lime} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
    </View>
    {showArrow && onPress && (
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    )}
  </TouchableOpacity>
);

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay: number;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, fadeAnim, translateY]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

export const PerfilScreen: React.FC<PerfilScreenProps> = ({ navigation }) => {
  const user = useUser();
  const logout = useUserStore((state) => state.logout);
  const updateSettings = useUserStore((state) => state.updateSettings);
  const settings = useSettings();
  const historial = useHistorialWorkouts();
  const records = useRecords();

  // Logros (1.4) — mismos hitos que en InicioScreen, sección dedicada acá.
  const logros = React.useMemo(
    () => calcularLogros(historial, records),
    [historial, records]
  );

  // Membresía (4.1) — resumen del estado de cuota para la sección "Mi membresía".
  const { data: membresia, isLoading: loadingMembresia } = useMembresiaQuery(user?.DNI ?? '');
  const membresiaResumen = (): string => {
    if (loadingMembresia) return 'Cargando...';
    if (!membresia || !membresia.tieneMembresia) return 'Sin membresía activa';
    if (membresia.estado === 'al_dia') {
      return `Al día · vence en ${membresia.diasRestantes ?? 0} días`;
    }
    if (membresia.estado === 'vencido') return 'Vencida';
    if (membresia.estado === 'suspendida') return 'Suspendida';
    return membresia.estado ?? '';
  };

  // Stats
  const totalWorkouts = historial.length;
  const totalVolumen = historial.reduce((acc, w) => acc + w.volumenTotal, 0);
  const totalTiempo = historial.reduce((acc, w) => acc + w.duracion, 0);
  const totalPRs = historial.reduce((acc, w) => acc + w.prsLogrados, 0);

  const getInitials = (): string => {
    if (!user?.NAME) return '?';
    const names = user.NAME.split(' ');
    return names.map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <AnimatedSection delay={100}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user?.FOTO ? (
                <Image source={{ uri: user.FOTO }} style={styles.avatar} />
              ) : (
                <Text style={styles.avatarText}>{getInitials()}</Text>
              )}
            </View>
            <Text style={styles.userName}>{user?.NAME || 'Usuario'}</Text>
            <Text style={styles.userDni}>DNI: {user?.DNI}</Text>
          </View>
        </AnimatedSection>

        {/* Stats */}
        <AnimatedSection delay={200}>
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totalWorkouts}</Text>
                <Text style={styles.statLabel}>Entrenamientos</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{(totalVolumen / 1000).toFixed(0)}k</Text>
                <Text style={styles.statLabel}>Kg Totales</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{Math.round(totalTiempo / 60)}h</Text>
                <Text style={styles.statLabel}>Horas</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: colors.lime }]}>{totalPRs}</Text>
                <Text style={styles.statLabel}>PRs</Text>
              </View>
            </View>
          </View>
        </AnimatedSection>

        {/* Editar perfil (1.5) */}
        <AnimatedSection delay={250}>
          <Text style={styles.sectionTitle}>Mi cuenta</Text>
          <Card variant="default" padding="none">
            <SettingItem
              icon="create-outline"
              title="Editar perfil"
              value="Nombre, email, foto y objetivos"
              onPress={() => navigation.navigate('EditarPerfil')}
            />
            <SettingItem
              icon="notifications-outline"
              title="Recordatorios"
              value="Avisos de entrenamiento"
              onPress={() => navigation.navigate('Notificaciones')}
            />
          </Card>
        </AnimatedSection>

        {/* Mi membresía (4.1) */}
        <AnimatedSection delay={280}>
          <Text style={styles.sectionTitle}>Mi membresía</Text>
          <Card variant="default" padding="none">
            <SettingItem
              icon="card-outline"
              title="Estado de cuota"
              value={membresiaResumen()}
              onPress={() => navigation.navigate('Membresia')}
            />
          </Card>
        </AnimatedSection>

        {/* Settings */}
        <AnimatedSection delay={300}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          <Card variant="default" padding="none">
            <SettingItem
              icon="timer-outline"
              title="Tiempo de descanso"
              value={`${settings.tiempoDescanso}s`}
            />
            <SettingItem
              icon="fitness-outline"
              title="Unidad de peso"
              value={settings.unidadPeso}
            />
            <SettingItem
              icon="phone-portrait-outline"
              title="Vibración"
              value={settings.vibracionActiva ? 'Activada' : 'Desactivada'}
            />
            {/* Toggle Tema claro/oscuro (1.7) — conectado a settings.temaOscuro */}
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name={settings.temaOscuro ? 'moon-outline' : 'sunny-outline'}
                  size={22}
                  color={colors.lime}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Tema oscuro</Text>
                <Text style={styles.settingValue}>
                  {settings.temaOscuro ? 'Activado' : 'Desactivado'}
                </Text>
              </View>
              <Switch
                value={settings.temaOscuro}
                onValueChange={(v) => updateSettings({ temaOscuro: v })}
                trackColor={{ false: colors.border, true: colors.lime }}
                thumbColor={colors.white}
              />
            </View>
          </Card>
        </AnimatedSection>

        {/* Logros (1.4) */}
        <AnimatedSection delay={350}>
          <Text style={styles.sectionTitle}>Logros</Text>
          <Card variant="default" padding="none">
            {logros.map((l, i) => (
              <View
                key={l.id}
                style={[
                  styles.logroItem,
                  i < logros.length - 1 && styles.logroItemBorder,
                ]}
              >
                <View
                  style={[
                    styles.logroIcon,
                    {
                      backgroundColor: l.desbloqueado
                        ? `${colors.lime}20`
                        : `${colors.textMuted}15`,
                    },
                  ]}
                >
                  <Ionicons
                    name={l.desbloqueado ? 'medal' : 'lock-closed-outline'}
                    size={20}
                    color={l.desbloqueado ? colors.lime : colors.textMuted}
                  />
                </View>
                <View style={styles.logroContent}>
                  <Text
                    style={[
                      styles.logroTitle,
                      !l.desbloqueado && { color: colors.textSecondary },
                    ]}
                  >
                    {l.titulo}
                  </Text>
                  <Text style={styles.logroDesc}>{l.descripcion}</Text>
                </View>
                {!l.desbloqueado && (
                  <Text style={styles.logroProgreso}>
                    {Math.round(l.progreso * 100)}%
                  </Text>
                )}
              </View>
            ))}
          </Card>
        </AnimatedSection>

        {/* App Info */}
        <AnimatedSection delay={400}>
          <Text style={styles.sectionTitle}>Información</Text>
          <Card variant="default" padding="none">
            <SettingItem
              icon="information-circle-outline"
              title="Versión"
              value="2.0.0"
              showArrow={false}
            />
            <SettingItem
              icon="document-text-outline"
              title="Términos y condiciones"
            />
            <SettingItem
              icon="shield-checkmark-outline"
              title="Política de privacidad"
            />
          </Card>
        </AnimatedSection>

        {/* Logout */}
        <AnimatedSection delay={500}>
          <View style={styles.logoutContainer}>
            <Button
              title="Cerrar Sesión"
              variant="danger"
              size="lg"
              fullWidth
              onPress={logout}
              leftIcon={<Ionicons name="log-out-outline" size={22} color={colors.white} />}
            />
          </View>
        </AnimatedSection>

        <Text style={styles.footerText}>
          LimeFit v2.0 - Hecho con 🍋
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 120,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.lime,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    color: colors.lime,
  },
  userName: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userDni: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.lime}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  settingValue: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logroItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logroContent: {
    flex: 1,
  },
  logroTitle: {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  logroDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logroProgreso: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    color: colors.textMuted,
  },
  logoutContainer: {
    marginTop: 32,
  },
  footerText: {
    fontFamily: fontFamily.light,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});

export default PerfilScreen;
