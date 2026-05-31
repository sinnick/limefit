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
  const rutinas = useRutinas();
  const { isLoading, refetch, isRefetching } = useRutinasQuery();

  const handleRutinaPress = (rutina: Rutina) => {
    navigation.navigate('Rutina', { rutina });
  };

  if (isLoading) {
    return <Loading fullScreen message="Cargando rutinas..." />;
  }

  return (
    <View style={styles.container}>
      <UserHeader
        title="Mis Rutinas"
        subtitle={`${rutinas.length} rutinas disponibles`}
        showSettings={false}
      />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      {rutinas.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="No tienes rutinas"
          description="Aún no se han creado rutinas para ti. Contacta al gimnasio para que te asignen una."
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
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
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
