import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, RefreshControl, Pressable, Animated, Easing } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../hooks/useTheme';
import { fontFamily } from '../constants/theme';
import { RootStackParamList, Rutina } from '../types';
import { useRutinas } from '../store/rutinasStore';
import { useRutinasQuery } from '../services/queries';
import { EmptyState, Loading } from '../components/ui';
import { UserHeader } from '../components';

// ============================================================================
// RutinasScreen — lista de rutinas asignadas al socio. Alineada al lenguaje de
// la home (ui-taste): superficies planas con hairline (sin sombras), un grid de
// iconos 20/16 (sin 18/24 mezclados), Pressable con estado de press.
// ============================================================================

interface RutinasScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Rutinas'>;
}

const ICON = 20; // navegación / icono principal
const ICON_SM = 16; // iconos inline junto a texto secundario

const RutinaCard: React.FC<{ rutina: Rutina; index: number; onPress: () => void }> = ({
  rutina,
  index,
  onPress,
}) => {
  const { colors } = useTheme();
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 260,
      delay: index * 50,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, v]);

  const dias = rutina.dias ?? [];
  const totalEjercicios = dias.reduce((acc, d) => acc + (d.ejercicios?.length ?? 0), 0);

  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Abrir rutina ${rutina.nombre}`}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: pressed ? colors.surface : colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: `${colors.accent}20` }]}>
            <Ionicons name="barbell" size={ICON} color={colors.accent} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.rutinaName, { color: colors.textPrimary }]}>{rutina.nombre}</Text>
            {rutina.descripcion ? (
              <Text style={[styles.rutinaDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                {rutina.descripcion}
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={ICON} color={colors.textMuted} />
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={ICON_SM} color={colors.textMuted} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {dias.length} {dias.length === 1 ? 'día' : 'días'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="fitness-outline" size={ICON_SM} color={colors.textMuted} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {totalEjercicios} {totalEjercicios === 1 ? 'ejercicio' : 'ejercicios'}
            </Text>
          </View>
          {rutina.tiempoEstimado ? (
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={ICON_SM} color={colors.textMuted} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {rutina.tiempoEstimado} min
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const RutinasScreen: React.FC<RutinasScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const rutinas = useRutinas();
  const insets = useSafeAreaInsets();
  const { isLoading, isError, refetch, isRefetching } = useRutinasQuery();

  if (isLoading && rutinas.length === 0) {
    return <Loading fullScreen message="Cargando rutinas..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <UserHeader
        title="Mis rutinas"
        subtitle={`${rutinas.length} ${rutinas.length === 1 ? 'rutina asignada' : 'rutinas asignadas'}`}
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
          title="Todavía no tenés rutinas"
          description="Cuando tu entrenador te asigne una, la vas a ver acá."
        />
      ) : (
        <FlashList
          data={rutinas}
          renderItem={({ item, index }) => (
            <RutinaCard rutina={item} index={index} onPress={() => navigation.navigate('Rutina', { rutina: item })} />
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
              colors={[colors.accent]}
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
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 12,
  },
  rutinaName: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  rutinaDesc: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    marginTop: 2,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
  },
});

export default RutinasScreen;
