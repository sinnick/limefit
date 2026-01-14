import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, fontFamily, shadows } from '../constants/theme';
import { EjercicioEnRutina, SetCompletado } from '../types';
import { Card } from './ui/Card';
import { Badge, GrupoMuscularBadge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { Modal } from './ui/Modal';
import { useHaptics } from '../hooks/useHaptics';

interface EjercicioCardProps {
  ejercicio: EjercicioEnRutina;
  index: number;
  isActive?: boolean;
  setsCompletados?: SetCompletado[];
  onPress?: () => void;
  onComplete?: () => void;
  showDetails?: boolean;
}

export const EjercicioCard: React.FC<EjercicioCardProps> = ({
  ejercicio,
  index,
  isActive = false,
  setsCompletados = [],
  onPress,
  onComplete,
  showDetails = true,
}) => {
  const [showModal, setShowModal] = useState(false);
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  const progress = (setsCompletados.length / ejercicio.sets) * 100;
  const isCompleted = setsCompletados.length >= ejercicio.sets;

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    haptics.light();
    onPress?.();
  };

  const handleLongPress = () => {
    haptics.medium();
    setShowModal(true);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle: ViewStyle = {
    backgroundColor: isActive ? colors.surface : colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: isActive ? 2 : 0,
    borderColor: colors.lime,
    ...(isCompleted && { opacity: 0.7 }),
    ...shadows.sm,
  };

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  };

  const indexStyle: ViewStyle = {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isActive ? colors.lime : colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  };

  const indexTextStyle: TextStyle = {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: isActive ? colors.background : colors.textSecondary,
  };

  const titleStyle: TextStyle = {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  };

  const detailsStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  };

  const setsInfoStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  };

  const statStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  };

  const statTextStyle: TextStyle = {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
  };

  const statValueStyle: TextStyle = {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.lime,
  };

  return (
    <>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={handleLongPress}
          activeOpacity={1}
          delayLongPress={500}
        >
          <View style={containerStyle}>
            <View style={headerStyle}>
              <View style={indexStyle}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={18} color={isActive ? colors.background : colors.success} />
                ) : (
                  <Text style={indexTextStyle}>{index + 1}</Text>
                )}
              </View>
              <Text style={titleStyle} numberOfLines={1}>
                {ejercicio.nombre}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(true)} style={{ padding: 4 }}>
                <Ionicons name="information-circle-outline" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={detailsStyle}>
              <View style={setsInfoStyle}>
                <View style={statStyle}>
                  <Ionicons name="layers-outline" size={18} color={colors.lime} />
                  <Text style={statTextStyle}>
                    <Text style={statValueStyle}>{setsCompletados.length}</Text>/{ejercicio.sets} sets
                  </Text>
                </View>
                <View style={statStyle}>
                  <Ionicons name="repeat-outline" size={18} color={colors.lime} />
                  <Text style={statTextStyle}>
                    <Text style={statValueStyle}>{ejercicio.reps}</Text> reps
                  </Text>
                </View>
                {ejercicio.peso && (
                  <View style={statStyle}>
                    <Ionicons name="barbell-outline" size={18} color={colors.lime} />
                    <Text style={statTextStyle}>
                      <Text style={statValueStyle}>{ejercicio.peso}</Text> kg
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {showDetails && setsCompletados.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <ProgressBar progress={progress} height={4} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={ejercicio.nombre}
        size="md"
      >
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Badge text={`${ejercicio.sets} sets`} variant="lime" />
            <Badge text={`${ejercicio.reps} reps`} variant="lime" />
            {ejercicio.peso && <Badge text={`${ejercicio.peso} kg`} variant="lime" />}
          </View>

          {ejercicio.notas && (
            <View>
              <Text style={{ fontFamily: fontFamily.semibold, fontSize: 14, color: colors.textSecondary, marginBottom: 4 }}>
                Notas
              </Text>
              <Text style={{ fontFamily: fontFamily.regular, fontSize: 16, color: colors.textPrimary }}>
                {ejercicio.notas}
              </Text>
            </View>
          )}

          {ejercicio.descanso && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="timer-outline" size={20} color={colors.lime} />
              <Text style={{ fontFamily: fontFamily.medium, fontSize: 14, color: colors.textSecondary }}>
                Descanso: <Text style={{ color: colors.lime }}>{ejercicio.descanso}s</Text>
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

export default EjercicioCard;
