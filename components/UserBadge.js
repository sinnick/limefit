import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useContext } from "react";
import UserContext from "../context/UserContext";
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import { MaterialIcons } from '@expo/vector-icons';

const UserBadge = ({ onProfilePress }) => {
	const { user } = useContext(UserContext);

	return (
		<View style={styles.container}>
			<TouchableOpacity 
				style={styles.profileContainer} 
				onPress={onProfilePress}
				activeOpacity={0.8}
			>
				<Image
					source={user.FOTO ? { uri: user.FOTO } : require('../assets/logo_barbell.png')}
					style={styles.imagePerfil}
				/>
			</TouchableOpacity>

			<View style={styles.textContainer}>
				<Text style={styles.greeting}>Hola, buen día</Text>
				<Text style={styles.userName}>{user.NOMBRE || 'Usuario'}</Text>
			</View>

			<View style={styles.iconsContainer}>
				<TouchableOpacity style={styles.iconButton}>
					<MaterialIcons name="calendar-today" size={22} color="#333333" />
				</TouchableOpacity>
				<TouchableOpacity style={styles.iconButton}>
					<MaterialIcons name="notifications-none" size={22} color="#333333" />
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: SPACING.l,
		marginTop: SPACING.xl,
		marginBottom: SPACING.m,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255,255,255,0.1)',
		paddingBottom: SPACING.m,
	},
	profileContainer: {
		borderRadius: BORDER_RADIUS.circle,
		overflow: 'hidden',
		...SHADOWS.small,
	},
	imagePerfil: {
		width: 50,
		height: 50,
		borderRadius: BORDER_RADIUS.circle,
		backgroundColor: '#adfa1d',
	},
	textContainer: {
		flex: 1,
		marginLeft: SPACING.m,
	},
	greeting: {
		...FONTS.caption,
		color: COLORS.textSecondary,
		fontSize: 12,
	},
	userName: {
		...FONTS.h2,
		color: COLORS.text,
		fontWeight: 'bold',
	},
	iconsContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconButton: {
		marginLeft: SPACING.s,
		backgroundColor: '#adfa1d',
		padding: SPACING.xs,
		borderRadius: BORDER_RADIUS.circle,
		...SHADOWS.small,
	},
});

export default UserBadge;