import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/theme';

const Button = ({ title, onPress, variant = 'primary', size = 'medium', icon, disabled = false }) => {
  // Determinar los estilos según la variante
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.buttonSecondary;
      case 'outline':
        return styles.buttonOutline;
      case 'text':
        return styles.buttonText;
      default:
        return styles.buttonPrimary;
    }
  };

  // Determinar los estilos de texto según la variante
  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.textSecondary;
      case 'outline':
        return styles.textOutline;
      case 'text':
        return styles.textText;
      default:
        return styles.textPrimary;
    }
  };

  // Determinar los estilos según el tamaño
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.buttonSmall;
      case 'large':
        return styles.buttonLarge;
      default:
        return styles.buttonMedium;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.buttonBase,
        getButtonStyle(),
        getSizeStyle(),
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text
          style={[
            styles.textBase,
            getTextStyle(),
            disabled && styles.textDisabled,
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: BORDER_RADIUS.m,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: SPACING.s,
  },
  
  // Variantes de botón
  buttonPrimary: {
    backgroundColor: '#adfa1d',
  },
  buttonSecondary: {
    backgroundColor: COLORS.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#adfa1d',
  },
  buttonText: {
    backgroundColor: 'transparent',
    ...SHADOWS.none,
  },
  buttonDisabled: {
    backgroundColor: COLORS.darkGray,
    opacity: 0.7,
  },
  
  // Tamaños de botón
  buttonSmall: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.m,
  },
  buttonMedium: {
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
  },
  buttonLarge: {
    paddingVertical: SPACING.l,
    paddingHorizontal: SPACING.xl,
  },
  
  // Estilos de texto
  textBase: {
    ...FONTS.button,
    textAlign: 'center',
  },
  textPrimary: {
    color: '#333333',
  },
  textSecondary: {
    color: COLORS.text,
  },
  textOutline: {
    color: '#adfa1d',
  },
  textText: {
    color: '#adfa1d',
  },
  textDisabled: {
    color: COLORS.textSecondary,
  },
});

export default Button;