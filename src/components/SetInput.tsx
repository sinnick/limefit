import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ViewStyle, TextStyle, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, shadows } from '../constants/theme';
import { SetCompletado } from '../types';
import { useHaptics } from '../hooks/useHaptics';

interface SetInputProps {
  setNumber: number;
  targetReps: number;
  targetWeight?: number;
  previousSet?: SetCompletado;
  onComplete: (set: SetCompletado) => void;
  isCompleted?: boolean;
  completedSet?: SetCompletado;
}

export const SetInput: React.FC<SetInputProps> = ({
  setNumber,
  targetReps,
  targetWeight = 0,
  previousSet,
  onComplete,
  isCompleted = false,
  completedSet,
}) => {
  const [peso, setPeso] = useState(completedSet?.peso.toString() || previousSet?.peso.toString() || targetWeight.toString());
  const [reps, setReps] = useState(completedSet?.reps.toString() || targetReps.toString());
  const haptics = useHaptics();
  const scale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;

  const handleComplete = () => {
    if (isCompleted) return;

    const pesoNum = parseFloat(peso) || 0;
    const repsNum = parseInt(reps) || 0;

    if (repsNum <= 0) {
      haptics.error();
      return;
    }

    haptics.success();

    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.05,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.spring(checkScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    onComplete({
      setNumero: setNumber,
      peso: pesoNum,
      reps: repsNum,
      completado: true,
      timestamp: new Date().toISOString(),
    });
  };

  const incrementPeso = () => {
    haptics.light();
    setPeso((prev) => (parseFloat(prev || '0') + 2.5).toString());
  };

  const decrementPeso = () => {
    haptics.light();
    setPeso((prev) => Math.max(0, parseFloat(prev || '0') - 2.5).toString());
  };

  const incrementReps = () => {
    haptics.light();
    setReps((prev) => (parseInt(prev || '0') + 1).toString());
  };

  const decrementReps = () => {
    haptics.light();
    setReps((prev) => Math.max(0, parseInt(prev || '0') - 1).toString());
  };

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isCompleted ? `${colors.success}15` : colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: isCompleted ? colors.success : colors.border,
  };

  const setNumberStyle: ViewStyle = {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isCompleted ? colors.success : colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  };

  const setNumberTextStyle: TextStyle = {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: isCompleted ? colors.white : colors.textSecondary,
  };

  const inputGroupStyle: ViewStyle = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  };

  const inputContainerStyle: ViewStyle = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 44,
  };

  const inputStyle: TextStyle = {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: 8,
  };

  const labelStyle: TextStyle = {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  };

  const buttonStyle: ViewStyle = {
    padding: 4,
  };

  const completeButtonStyle: ViewStyle = {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: isCompleted ? colors.success : colors.lime,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <View style={containerStyle}>
        <View style={setNumberStyle}>
          <Text style={setNumberTextStyle}>{setNumber}</Text>
        </View>

        <View style={inputGroupStyle}>
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>PESO (kg)</Text>
            <View style={inputContainerStyle}>
              <TouchableOpacity onPress={decrementPeso} style={buttonStyle} disabled={isCompleted}>
                <Ionicons name="remove" size={20} color={isCompleted ? colors.textMuted : colors.lime} />
              </TouchableOpacity>
              <TextInput
                style={inputStyle}
                value={peso}
                onChangeText={setPeso}
                keyboardType="decimal-pad"
                editable={!isCompleted}
                selectTextOnFocus
              />
              <TouchableOpacity onPress={incrementPeso} style={buttonStyle} disabled={isCompleted}>
                <Ionicons name="add" size={20} color={isCompleted ? colors.textMuted : colors.lime} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>REPS</Text>
            <View style={inputContainerStyle}>
              <TouchableOpacity onPress={decrementReps} style={buttonStyle} disabled={isCompleted}>
                <Ionicons name="remove" size={20} color={isCompleted ? colors.textMuted : colors.lime} />
              </TouchableOpacity>
              <TextInput
                style={inputStyle}
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                editable={!isCompleted}
                selectTextOnFocus
              />
              <TouchableOpacity onPress={incrementReps} style={buttonStyle} disabled={isCompleted}>
                <Ionicons name="add" size={20} color={isCompleted ? colors.textMuted : colors.lime} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleComplete}
          style={completeButtonStyle}
          disabled={isCompleted}
          activeOpacity={0.7}
        >
          {isCompleted ? (
            <Animated.View style={{ transform: [{ scale: checkScale }], opacity: checkScale }}>
              <Ionicons name="checkmark" size={24} color={colors.white} />
            </Animated.View>
          ) : (
            <Ionicons name="checkmark" size={24} color={colors.background} />
          )}
        </TouchableOpacity>
      </View>

      {previousSet && !isCompleted && (
        <View style={{ flexDirection: 'row', gap: 16, paddingLeft: 44, marginBottom: 8 }}>
          <Text style={{ fontFamily: fontFamily.regular, fontSize: 12, color: colors.textMuted }}>
            Anterior: {previousSet.peso}kg × {previousSet.reps} reps
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

export default SetInput;
