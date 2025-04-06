import { TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/theme';

const Card = ({ 
  title, 
  details, 
  onPress, 
  icon, 
  image,
  variant = 'default',
  badge
}) => {
  // Determinar los estilos según la variante
  const getCardStyle = () => {
    switch (variant) {
      case 'highlight':
        return styles.cardHighlight;
      case 'success':
        return styles.cardSuccess;
      case 'outline':
        return styles.cardOutline;
      default:
        return styles.cardDefault;
    }
  };

  // Determinar los estilos de texto según la variante
  const getTextStyle = () => {
    switch (variant) {
      case 'highlight':
        return styles.titleHighlight;
      case 'success':
        return styles.titleSuccess;
      case 'outline':
        return styles.titleOutline;
      default:
        return styles.titleDefault;
    }
  };

  // Determinar los estilos de detalle según la variante
  const getDetailStyle = () => {
    switch (variant) {
      case 'highlight':
      case 'success':
        return styles.detailLight;
      case 'outline':
        return styles.detailOutline;
      default:
        return styles.detailDefault;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, getCardStyle()]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      {badge && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      
      {image && (
        <View style={styles.imageContainer}>
          <Image source={image} style={styles.image} />
        </View>
      )}
      
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.title, getTextStyle()]} numberOfLines={1}>{title}</Text>
        </View>
        
        <View style={styles.detailsContainer}>
          {details.map((detail, index) => (
            <Text key={index} style={[styles.detail, getDetailStyle()]}>{detail}</Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.l,
    overflow: 'hidden',
    width: '42%',
    height: 200,
    margin: SPACING.m,
    ...SHADOWS.medium,
  },
  cardDefault: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
  },
  cardHighlight: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
  },
  cardSuccess: {
    backgroundColor: COLORS.success,
    borderWidth: 0,
  },
  cardOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  badgeContainer: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.s,
    zIndex: 1,
  },
  badgeText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  imageContainer: {
    width: '100%',
    height: 80,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: SPACING.m,
    flex: 1,
    justifyContent: 'space-between',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  iconContainer: {
    marginRight: SPACING.s,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  titleDefault: {
    color: COLORS.text,
  },
  titleHighlight: {
    color: COLORS.secondary,
  },
  titleSuccess: {
    color: COLORS.text,
  },
  titleOutline: {
    color: COLORS.primary,
  },
  detailsContainer: {
    flex: 1,
  },
  detail: {
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  detailDefault: {
    color: COLORS.textSecondary,
  },
  detailLight: {
    color: COLORS.secondary,
  },
  detailOutline: {
    color: COLORS.textSecondary,
  },
});

export default Card;