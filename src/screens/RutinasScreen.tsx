import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontFamily, shadows } from '../constants/theme';
import { RootStackParamList, Rutina } from '../types';
import { useRutinas } from '../store/rutinasStore';
import { useRutinasQuery } from '../services/queries';
import { Card, EmptyState, Loading, Badge } from '../components/ui';
import { UserHeader } from '../components';

interface RutinasScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Rutinas'>;
}

interface RutinaCardProps {
  rutina: Rutina;
  index: number;
  onPress: () => void;
}

const RutinaCard: React.FC<RutinaCardProps> = ({ rutina, index, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, translateX]);

  const dias = rutina.dias ?? [];
  const totalEjercicios = dias.reduce(
    (acc, dia) => acc + (dia.ejercicios?.length ?? 0),
    0
  );

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Card variant="elevated" padding="lg" style={styles.rutinaCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="barbell" size={24} color={colors.lime} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.rutinaName}>{rutina.nombre}</Text>
              {rutina.descripcion && (
                <Text style={styles.rutinaDescription} numberOfLines={1}>
                  {rutina.descripcion}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
          </View>

          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={18} color={colors.lime} />
              <Text style={styles.statText}>{dias.length} días</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="fitness-outline" size={18} color={colors.lime} />
              <Text style={styles.statText}>{totalEjercicios} ejercicios</Text>
            </View>
            {rutina.tiempoEstimado && (
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={18} color={colors.lime} />
                <Text style={styles.statText}>{rutina.tiempoEstimado} min</Text>
              </View>
            )}
          </View>

          {dias.length > 0 && (
            <View style={styles.diasPreview}>
              {dias.slice(0, 3).map((dia, idx) => (
                <Badge
                  key={dia.id || idx}
                  text={dia.nombre}
                  variant="lime"
                  size="sm"
                />
              ))}
              {dias.length > 3 && (
                <Badge text={`+${dias.length - 3}`} variant="default" size="sm" />
              )}
            </View>
          )}
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const RutinasScreen: React.FC<RutinasScreenProps> = ({ navigation }) => {
  // El store guarda las rutinas ASIGNADAS al socio (CONTRACT b.2). useRutinasQuery
  // las trae con rutinasApi.getMisRutinasAsignadas(dni) y las vuelca al store.
  const rutinas = useRutinas();
  const { isLoading, isError, refetch, isRefetching } = useRutinasQuery();

  const handleRutinaPress = (rutina: Rutina) => {
    navigation.navigate('Rutina', { rutina });
  };

  // Carga: solo cuando la query está pidiendo y todavía no hay nada cacheado en
  // MMKV (evita mostrar rutinas del socio anterior mientras llega la respuesta).
  if (isLoading && rutinas.length === 0) {
    return <Loading fullScreen message="Cargando rutinas..." />;
  }

  return (
    <View style={styles.container}>
      <UserHeader
        title="Mis Rutinas"
        subtitle={`${rutinas.length} rutinas asignadas`}
        showSettings={false}
        onBack={() => navigation.goBack()}
      />

      {isError && rutinas.length === 0 ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="No pudimos cargar tus rutinas"
          description="Revisá tu conexión e intentá de nuevo."
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      ) : rutinas.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="No tienes rutinas"
          description="Aún no se te ha asignado ninguna rutina. Contacta al gimnasio para que te asignen una."
        />
      ) : (
        <FlashList
          data={rutinas}
          renderItem={({ item, index }) => (
            <RutinaCard
              rutina={item}
              index={index}
              onPress={() => handleRutinaPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.lime}
              colors={[colors.lime]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  rutinaCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: `${colors.lime}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  rutinaName: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  rutinaDescription: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  diasPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default RutinasScreen;
