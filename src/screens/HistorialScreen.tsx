import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontFamily, shadows } from '../constants/theme';
import { RootStackParamList, WorkoutCompletado } from '../types';
import { useHistorialWorkouts } from '../store/workoutStore';
import { Card, EmptyState, Badge } from '../components/ui';
import { UserHeader } from '../components';

interface HistorialScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Historial'>;
}

interface WorkoutCardProps {
  workout: WorkoutCompletado;
  index: number;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({ workout, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, translateX]);

  const formattedDate = new Date(workout.fecha).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const formattedTime = new Date(workout.fecha).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const ejerciciosCompletados = workout.ejercicios.filter((e) => e.completado).length;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX }] }}>
      <Card variant="elevated" padding="lg" style={styles.workoutCard}>
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Text style={styles.timeText}>{formattedTime}</Text>
          </View>
          {workout.prsLogrados > 0 && (
            <Badge text={`${workout.prsLogrados} PR${workout.prsLogrados > 1 ? 's' : ''}`} variant="lime" />
          )}
        </View>

        <Text style={styles.rutinaNombre}>{workout.rutinaNombre}</Text>
        <Text style={styles.diaNombre}>{workout.diaNombre}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={18} color={colors.lime} />
            <Text style={styles.statText}>{workout.duracion} min</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="fitness-outline" size={18} color={colors.lime} />
            <Text style={styles.statText}>{ejerciciosCompletados} ejercicios</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="barbell-outline" size={18} color={colors.lime} />
            <Text style={styles.statText}>{(workout.volumenTotal / 1000).toFixed(1)}k kg</Text>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
};

export const HistorialScreen: React.FC<HistorialScreenProps> = ({ navigation }) => {
  const historial = useHistorialWorkouts();
  const insets = useSafeAreaInsets();

  // Agrupar por mes
  const groupedByMonth = historial.reduce((acc, workout) => {
    const date = new Date(workout.fecha);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!acc[key]) {
      acc[key] = {
        month: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        workouts: [],
      };
    }
    acc[key].workouts.push(workout);
    return acc;
  }, {} as Record<string, { month: string; workouts: WorkoutCompletado[] }>);

  const monthSections = Object.values(groupedByMonth);

  return (
    <View style={styles.container}>
      <UserHeader
        title="Historial"
        subtitle={`${historial.length} entrenamientos`}
        showSettings={false}
        onBack={() => navigation.goBack()}
      />

      {historial.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="Sin entrenamientos"
          description="Completa tu primer entrenamiento para verlo aquí."
        />
      ) : (
        <FlashList
          data={historial}
          renderItem={({ item, index }) => (
            <WorkoutCard workout={item} index={index} />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
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
  },
  workoutCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateContainer: {},
  dateText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  timeText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  rutinaNombre: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  diaNombre: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
});

export default HistorialScreen;
