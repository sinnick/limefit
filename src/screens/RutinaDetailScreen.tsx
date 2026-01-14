import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, fontFamily, shadows } from '../constants/theme';
import { RootStackParamList, DiaRutina, EjercicioEnRutina } from '../types';
import { Button, Card, Badge, ProgressBar } from '../components/ui';
import { EjercicioCard } from '../components';
import { useHaptics } from '../hooks/useHaptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RutinaDetailScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Rutina'>;
  route: RouteProp<RootStackParamList, 'Rutina'>;
}

interface DiaTabProps {
  dia: DiaRutina;
  isSelected: boolean;
  onPress: () => void;
}

const DiaTab: React.FC<DiaTabProps> = ({ dia, isSelected, onPress }) => {
  const haptics = useHaptics();

  const handlePress = () => {
    haptics.selection();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.diaTab, isSelected && styles.diaTabSelected]}
      activeOpacity={0.7}
    >
      <Text style={[styles.diaTabText, isSelected && styles.diaTabTextSelected]}>
        {dia.nombre}
      </Text>
      <Text style={[styles.diaTabCount, isSelected && styles.diaTabCountSelected]}>
        {dia.ejercicios.length} ej.
      </Text>
    </TouchableOpacity>
  );
};

export const RutinaDetailScreen: React.FC<RutinaDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { rutina } = route.params;
  const [selectedDiaIndex, setSelectedDiaIndex] = useState(0);
  const haptics = useHaptics();

  const selectedDia = rutina.dias[selectedDiaIndex];
  const totalEjercicios = selectedDia?.ejercicios.length || 0;

  const handleStartWorkout = () => {
    if (!selectedDia) return;
    haptics.medium();
    navigation.navigate('Workout', { rutina, diaId: selectedDia.id });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{rutina.nombre}</Text>
          {rutina.descripcion && (
            <Text style={styles.headerSubtitle}>{rutina.descripcion}</Text>
          )}
        </View>

        <View style={styles.headerStats}>
          <Badge text={`${rutina.dias.length} días`} variant="lime" />
        </View>
      </Animated.View>

      {/* Día Tabs */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.diasContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.diasContent}
        >
          {rutina.dias.map((dia, index) => (
            <DiaTab
              key={dia.id || index}
              dia={dia}
              isSelected={selectedDiaIndex === index}
              onPress={() => setSelectedDiaIndex(index)}
            />
          ))}
        </ScrollView>
      </Animated.View>

      {/* Ejercicios List */}
      {selectedDia && (
        <Animated.View entering={FadeInDown.delay(200)} style={styles.ejerciciosContainer}>
          <View style={styles.ejerciciosHeader}>
            <Text style={styles.ejerciciosTitle}>{selectedDia.nombre}</Text>
            <Text style={styles.ejerciciosCount}>{totalEjercicios} ejercicios</Text>
          </View>

          <FlashList
            data={selectedDia.ejercicios}
            renderItem={({ item, index }) => (
              <EjercicioCard
                ejercicio={item}
                index={index}
                showDetails={false}
              />
            )}
            estimatedItemSize={100}
            contentContainerStyle={styles.ejerciciosList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={<View style={{ height: 120 }} />}
          />
        </Animated.View>
      )}

      {/* Start Workout Button */}
      <Animated.View
        entering={FadeInDown.delay(300)}
        style={styles.startButtonContainer}
      >
        <Button
          title="Comenzar Entrenamiento"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleStartWorkout}
          leftIcon={<Ionicons name="play" size={24} color={colors.background} />}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    marginTop: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 8,
  },
  diasContainer: {
    paddingVertical: 16,
  },
  diasContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  diaTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 100,
  },
  diaTabSelected: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  diaTabText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  diaTabTextSelected: {
    color: colors.background,
  },
  diaTabCount: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  diaTabCountSelected: {
    color: colors.background,
    opacity: 0.8,
  },
  ejerciciosContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  ejerciciosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ejerciciosTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  ejerciciosCount: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  ejerciciosList: {
    paddingBottom: 20,
  },
  startButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.lg,
  },
});

export default RutinaDetailScreen;
