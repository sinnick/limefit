import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { colors, fontFamily, shadows } from '../constants/theme';
import { RootStackParamList, SetCompletado, EjercicioWorkout } from '../types';
import { useWorkoutStore, useWorkoutActivo, useEjercicioActual } from '../store/workoutStore';
import { useRecordsStore } from '../store/recordsStore';
import { useUser } from '../store/userStore';
import { Button, Card, ProgressBar, Modal, ConfirmModal } from '../components/ui';
import { RestTimer } from '../components/ui/Timer';
import { SetInput } from '../components';
import { useStopwatch } from '../hooks/useTimer';
import { useToast } from '../components/ui/Toast';
import { useHaptics } from '../hooks/useHaptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WorkoutScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Workout'>;
  route: RouteProp<RootStackParamList, 'Workout'>;
}

export const WorkoutScreen: React.FC<WorkoutScreenProps> = ({
  navigation,
  route,
}) => {
  const { rutina, diaId } = route.params;
  const user = useUser();
  const haptics = useHaptics();
  const toast = useToast();
  const stopwatch = useStopwatch();

  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const ejercicioAnim = useRef(new Animated.Value(0)).current;
  const ejercicioTranslateX = useRef(new Animated.Value(50)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(20)).current;

  const {
    iniciarWorkout,
    finalizarWorkout,
    cancelarWorkout,
    completarSet,
    siguienteEjercicio,
    anteriorEjercicio,
  } = useWorkoutStore();

  const workout = useWorkoutActivo();
  const ejercicioActual = useEjercicioActual();
  const checkAndUpdatePR = useRecordsStore((state) => state.checkAndUpdatePR);

  // Iniciar workout al montar
  useEffect(() => {
    const dia = rutina.dias.find((d) => d.id === diaId);
    if (dia && !workout) {
      iniciarWorkout(rutina, dia);
      stopwatch.start();
    }

    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Animate ejercicio changes
  useEffect(() => {
    if (ejercicioActual) {
      ejercicioAnim.setValue(0);
      ejercicioTranslateX.setValue(50);
      Animated.parallel([
        Animated.timing(ejercicioAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(ejercicioTranslateX, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [ejercicioActual?.id, ejercicioAnim, ejercicioTranslateX]);

  // Progress calculation
  const progress = workout
    ? (workout.ejercicios.filter((e) => e.completado).length / workout.ejercicios.length) * 100
    : 0;

  // Animate finish button when progress >= 50
  useEffect(() => {
    if (progress >= 50) {
      Animated.parallel([
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(buttonTranslateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [progress >= 50, buttonAnim, buttonTranslateY]);

  const handleCompleteSet = useCallback(
    (set: SetCompletado) => {
      if (!workout || !ejercicioActual) return;

      const esRecord = checkAndUpdatePR(
        ejercicioActual.ejercicioId,
        ejercicioActual.nombre,
        set.peso,
        set.reps
      );

      completarSet(workout.ejercicioActualIndex, {
        ...set,
        esRecord,
      });

      if (esRecord) {
        toast.pr(`${set.peso}kg × ${set.reps} reps`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        haptics.success();
      }

      // Mostrar timer de descanso si no es el último set
      const setsCompletados = ejercicioActual.setsCompletados.length + 1;
      if (setsCompletados < ejercicioActual.setsObjetivo) {
        setShowRestTimer(true);
      } else if (setsCompletados >= ejercicioActual.setsObjetivo) {
        // Auto-avanzar al siguiente ejercicio
        if (workout.ejercicioActualIndex < workout.ejercicios.length - 1) {
          setTimeout(() => {
            siguienteEjercicio();
            haptics.medium();
          }, 1000);
        }
      }
    },
    [workout, ejercicioActual, checkAndUpdatePR, completarSet, haptics, toast]
  );

  const handleFinishWorkout = useCallback(() => {
    stopwatch.pause();
    const summary = finalizarWorkout();
    if (summary) {
      setShowSummaryModal(true);
    }
  }, [finalizarWorkout, stopwatch]);

  const handleCancelWorkout = useCallback(() => {
    setShowExitModal(false);
    stopwatch.pause();
    cancelarWorkout();
    navigation.goBack();
  }, [cancelarWorkout, navigation, stopwatch]);

  const handleBackPress = () => {
    setShowExitModal(true);
  };

  if (!workout || !ejercicioActual) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {workout.rutinaNombre}
          </Text>
          <Text style={styles.headerSubtitle}>{workout.diaNombre}</Text>
        </View>

        <View style={styles.timerContainer}>
          <Ionicons name="time-outline" size={16} color={colors.lime} />
          <Text style={styles.timerText}>{stopwatch.formatted}</Text>
        </View>
      </Animated.View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} height={4} />
        <Text style={styles.progressText}>
          {workout.ejercicios.filter((e) => e.completado).length} / {workout.ejercicios.length} ejercicios
        </Text>
      </View>

      {/* Ejercicio Navigation */}
      <View style={styles.ejercicioNav}>
        <TouchableOpacity
          onPress={() => {
            anteriorEjercicio();
            haptics.light();
          }}
          disabled={workout.ejercicioActualIndex === 0}
          style={[styles.navButton, workout.ejercicioActualIndex === 0 && styles.navButtonDisabled]}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={workout.ejercicioActualIndex === 0 ? colors.textMuted : colors.textPrimary}
          />
        </TouchableOpacity>

        <Animated.View
          style={[styles.ejercicioInfo, { opacity: ejercicioAnim, transform: [{ translateX: ejercicioTranslateX }] }]}
        >
          <Text style={styles.ejercicioNumber}>
            Ejercicio {workout.ejercicioActualIndex + 1} de {workout.ejercicios.length}
          </Text>
          <Text style={styles.ejercicioName}>{ejercicioActual.nombre}</Text>
          <View style={styles.ejercicioMeta}>
            <Text style={styles.ejercicioMetaText}>
              {ejercicioActual.setsObjetivo} sets × {ejercicioActual.repsObjetivo} reps
            </Text>
            {ejercicioActual.pesoObjetivo && (
              <Text style={styles.ejercicioMetaText}>
                • {ejercicioActual.pesoObjetivo} kg
              </Text>
            )}
          </View>
        </Animated.View>

        <TouchableOpacity
          onPress={() => {
            siguienteEjercicio();
            haptics.light();
          }}
          disabled={workout.ejercicioActualIndex === workout.ejercicios.length - 1}
          style={[
            styles.navButton,
            workout.ejercicioActualIndex === workout.ejercicios.length - 1 && styles.navButtonDisabled,
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={
              workout.ejercicioActualIndex === workout.ejercicios.length - 1
                ? colors.textMuted
                : colors.textPrimary
            }
          />
        </TouchableOpacity>
      </View>

      {/* Sets */}
      <ScrollView
        style={styles.setsContainer}
        contentContainerStyle={styles.setsContent}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: ejercicioActual.setsObjetivo }).map((_, index) => {
          const completedSet = ejercicioActual.setsCompletados[index];
          const previousSet = index > 0 ? ejercicioActual.setsCompletados[index - 1] : undefined;

          return (
            <SetInput
              key={index}
              setNumber={index + 1}
              targetReps={ejercicioActual.repsObjetivo}
              targetWeight={ejercicioActual.pesoObjetivo}
              previousSet={previousSet}
              onComplete={(set) => handleCompleteSet(set)}
              isCompleted={!!completedSet}
              completedSet={completedSet}
            />
          );
        })}
      </ScrollView>

      {/* Finish Button */}
      {progress >= 50 && (
        <Animated.View
          style={[styles.finishButtonContainer, { opacity: buttonAnim, transform: [{ translateY: buttonTranslateY }] }]}
        >
          <Button
            title={progress === 100 ? 'Finalizar Entrenamiento' : 'Terminar Antes'}
            variant={progress === 100 ? 'primary' : 'outline'}
            size="lg"
            fullWidth
            onPress={handleFinishWorkout}
            leftIcon={
              <Ionicons
                name={progress === 100 ? 'checkmark-circle' : 'stop-circle'}
                size={24}
                color={progress === 100 ? colors.background : colors.lime}
              />
            }
          />
        </Animated.View>
      )}

      {/* Rest Timer Modal */}
      <Modal
        visible={showRestTimer}
        onClose={() => setShowRestTimer(false)}
        title="Descanso"
        size="md"
      >
        <RestTimer
          initialTime={90}
          onComplete={() => setShowRestTimer(false)}
          autoStart
        />
      </Modal>

      {/* Exit Confirmation Modal */}
      <ConfirmModal
        visible={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={handleCancelWorkout}
        title="¿Salir del entrenamiento?"
        message="Tu progreso se perderá si sales ahora."
        confirmText="Salir"
        cancelText="Continuar"
        variant="danger"
      />

      {/* Summary Modal */}
      <Modal
        visible={showSummaryModal}
        onClose={() => {
          setShowSummaryModal(false);
          navigation.goBack();
        }}
        title="¡Entrenamiento Completado!"
        size="md"
        showCloseButton={false}
      >
        <View style={styles.summaryContent}>
          <View style={styles.summaryIcon}>
            <Ionicons name="trophy" size={64} color={colors.lime} />
          </View>

          <Text style={styles.summaryTitle}>¡Excelente trabajo!</Text>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Ionicons name="time-outline" size={24} color={colors.lime} />
              <Text style={styles.summaryStatValue}>{stopwatch.formatted}</Text>
              <Text style={styles.summaryStatLabel}>Duración</Text>
            </View>
            <View style={styles.summaryStat}>
              <Ionicons name="fitness-outline" size={24} color={colors.lime} />
              <Text style={styles.summaryStatValue}>
                {workout.ejercicios.filter((e) => e.completado).length}
              </Text>
              <Text style={styles.summaryStatLabel}>Ejercicios</Text>
            </View>
          </View>

          <Button
            title="Finalizar"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => {
              setShowSummaryModal(false);
              navigation.goBack();
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.lime,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  ejercicioNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  ejercicioInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  ejercicioNumber: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.lime,
    marginBottom: 4,
  },
  ejercicioName: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  ejercicioMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  ejercicioMetaText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  setsContainer: {
    flex: 1,
  },
  setsContent: {
    padding: 20,
    paddingBottom: 120,
  },
  finishButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryIcon: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 24,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 32,
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.textPrimary,
    marginTop: 8,
  },
  summaryStatLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default WorkoutScreen;
