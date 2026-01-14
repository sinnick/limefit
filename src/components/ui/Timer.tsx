import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '../../constants/theme';
import { useTimer } from '../../hooks/useTimer';
import { Button } from './Button';

interface TimerDisplayProps {
  tiempo: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  style?: ViewStyle;
}

const sizeConfig = {
  sm: { fontSize: 24, iconSize: 20 },
  md: { fontSize: 48, iconSize: 32 },
  lg: { fontSize: 72, iconSize: 48 },
};

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  tiempo,
  size = 'md',
  showIcon = false,
  style,
}) => {
  const { fontSize, iconSize } = sizeConfig[size];

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...style,
  };

  const textStyle: TextStyle = {
    fontFamily: fontFamily.bold,
    fontSize,
    color: colors.textPrimary,
    letterSpacing: 2,
  };

  return (
    <View style={containerStyle}>
      {showIcon && (
        <Ionicons name="timer-outline" size={iconSize} color={colors.lime} />
      )}
      <Text style={textStyle}>{formatTime(tiempo)}</Text>
    </View>
  );
};

// Rest Timer Component
interface RestTimerProps {
  initialTime?: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialTime = 90,
  onComplete,
  autoStart = false,
}) => {
  const {
    tiempo,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    formatTime,
  } = useTimer({
    initialTime,
    onComplete,
    autoStart,
  });

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: isRunning ? colors.lime : colors.border,
  };

  const timerStyle: TextStyle = {
    fontFamily: fontFamily.bold,
    fontSize: 64,
    color: tiempo <= 10 ? colors.error : colors.textPrimary,
    marginBottom: 24,
  };

  const labelStyle: TextStyle = {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  };

  const buttonsStyle: ViewStyle = {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  };

  return (
    <View style={containerStyle}>
      <Text style={labelStyle}>DESCANSO</Text>
      <Text style={timerStyle}>{formatTime(tiempo)}</Text>

      <View style={buttonsStyle}>
        {!isRunning && !isPaused && (
          <Button
            title="Iniciar"
            variant="primary"
            size="md"
            onPress={() => start(initialTime)}
            leftIcon={<Ionicons name="play" size={20} color={colors.background} />}
          />
        )}

        {isRunning && (
          <Button
            title="Pausar"
            variant="outline"
            size="md"
            onPress={pause}
            leftIcon={<Ionicons name="pause" size={20} color={colors.lime} />}
          />
        )}

        {isPaused && (
          <>
            <Button
              title="Continuar"
              variant="primary"
              size="md"
              onPress={resume}
              leftIcon={<Ionicons name="play" size={20} color={colors.background} />}
            />
            <Button
              title="Reiniciar"
              variant="secondary"
              size="md"
              onPress={() => start(initialTime)}
              leftIcon={<Ionicons name="refresh" size={20} color={colors.textPrimary} />}
            />
          </>
        )}

        {(isRunning || isPaused) && (
          <Button
            title="Saltar"
            variant="ghost"
            size="md"
            onPress={() => {
              reset();
              onComplete?.();
            }}
            leftIcon={<Ionicons name="play-skip-forward" size={20} color={colors.lime} />}
          />
        )}
      </View>
    </View>
  );
};

// Quick Timer Presets
interface QuickTimerProps {
  onSelectTime: (seconds: number) => void;
}

export const QuickTimerPresets: React.FC<QuickTimerProps> = ({ onSelectTime }) => {
  const presets = [30, 60, 90, 120, 180];

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  };

  return (
    <View style={containerStyle}>
      {presets.map((seconds) => (
        <Button
          key={seconds}
          title={seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
          variant="secondary"
          size="sm"
          onPress={() => onSelectTime(seconds)}
        />
      ))}
    </View>
  );
};

export default RestTimer;
