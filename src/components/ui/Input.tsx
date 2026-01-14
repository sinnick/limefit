import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  isPassword?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      containerStyle,
      inputStyle,
      isPassword = false,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const hasError = !!error;

    const getBorderColor = () => {
      if (hasError) return colors.error;
      if (isFocused) return colors.lime;
      return colors.border;
    };

    const wrapperStyle: ViewStyle = {
      marginBottom: 16,
      ...containerStyle,
    };

    const labelStyle: TextStyle = {
      fontFamily: fontFamily.medium,
      fontSize: 14,
      color: hasError ? colors.error : colors.textSecondary,
      marginBottom: 8,
    };

    const inputContainerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: getBorderColor(),
      borderRadius: 12,
      paddingHorizontal: 16,
      minHeight: 52,
    };

    const textInputStyle: TextStyle = {
      flex: 1,
      fontFamily: fontFamily.regular,
      fontSize: 16,
      color: colors.textPrimary,
      paddingVertical: 12,
      ...inputStyle,
    };

    const errorTextStyle: TextStyle = {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
    };

    const hintTextStyle: TextStyle = {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
    };

    return (
      <View style={wrapperStyle}>
        {label && <Text style={labelStyle}>{label}</Text>}
        <View style={inputContainerStyle}>
          {leftIcon && <View style={{ marginRight: 12 }}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={textInputStyle}
            placeholderTextColor={colors.textMuted}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={isPassword && !showPassword}
            {...props}
          />
          {isPassword && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{ marginLeft: 12 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          {rightIcon && !isPassword && (
            <View style={{ marginLeft: 12 }}>{rightIcon}</View>
          )}
        </View>
        {error && <Text style={errorTextStyle}>{error}</Text>}
        {hint && !error && <Text style={hintTextStyle}>{hint}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

// Componente especializado para inputs numéricos
interface NumericInputProps extends Omit<InputProps, 'keyboardType'> {
  value: number;
  onChangeValue: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChangeValue,
  min = 0,
  max = 9999,
  step = 1,
  suffix,
  ...props
}) => {
  const handleChange = (text: string) => {
    const numValue = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    const clampedValue = Math.min(Math.max(numValue, min), max);
    onChangeValue(clampedValue);
  };

  const increment = () => {
    const newValue = Math.min(value + step, max);
    onChangeValue(newValue);
  };

  const decrement = () => {
    const newValue = Math.max(value - step, min);
    onChangeValue(newValue);
  };

  return (
    <Input
      value={suffix ? `${value} ${suffix}` : String(value)}
      onChangeText={handleChange}
      keyboardType="numeric"
      leftIcon={
        <TouchableOpacity onPress={decrement} style={{ padding: 4 }}>
          <Ionicons name="remove-circle" size={24} color={colors.lime} />
        </TouchableOpacity>
      }
      rightIcon={
        <TouchableOpacity onPress={increment} style={{ padding: 4 }}>
          <Ionicons name="add-circle" size={24} color={colors.lime} />
        </TouchableOpacity>
      }
      {...props}
    />
  );
};

export default Input;
