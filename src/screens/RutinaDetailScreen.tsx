import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
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

  const headerAnim = useRef(new Animated.Value(0)).current;
  const diasAnim = useRef(new Animated.Value(0)).current;
  const diasTranslateY = useRef(new Animated.Value(20)).current;
  const ejerciciosAnim = useRef(new Animated.Value(0)).current;
  const ejerciciosTranslateY = useRef(new Animated.Value(20)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(diasAnim, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.spring(diasTranslateY, {
        toValue: 0,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(ejerciciosAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(ejerciciosTranslateY, {
        toValue: 0,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 400,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.spring(buttonTranslateY, {
        toValue: 0,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, diasAnim, diasTranslateY, ejerciciosAnim, ejerciciosTranslateY, buttonAnim, buttonTranslateY]);

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
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
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
      <Animated.View style={[styles.diasContainer, { opacity: diasAnim, transform: [{ translateY: diasTranslateY }] }]}>
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
        <Animated.View style={[styles.ejerciciosContainer, { opacity: ejerciciosAnim, transform: [{ translateY: ejerciciosTranslateY }] }]}>
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
        style={[styles.startButtonContainer, { opacity: buttonAnim, transform: [{ translateY: buttonTranslateY }] }]}
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
