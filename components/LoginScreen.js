import { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, ImageBackground, Alert, Text, Image } from 'react-native';
import UserContext from '../context/UserContext';
import { useFonts } from 'expo-font';
import { URL_API } from '../config';
import Button from './common/Button';
import Input from './common/Input';
import { COLORS, FONTS, SPACING, LAYOUT, SHADOWS, BORDER_RADIUS } from '../styles/theme';

const LoginScreen = ({ navigation }) => {
	const [fontsLoaded] = useFonts({
		'Work-Sans': require('../assets/fonts/Work_Sans/WorkSans-VariableFont_wght.ttf'),
	});

	const { user, setUser } = useContext(UserContext);
	const [dni, setDNI] = useState('37002007');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	
	// Resetear el estado de carga cuando se vuelve a montar el componente
	useEffect(() => {
		setIsLoading(false);
	}, []);
	
	// Si ya hay un usuario autenticado, ir directamente a la pantalla de inicio
	useEffect(() => {
		if (user && user.DNI) {
			navigation.reset({
				index: 0,
				routes: [{ name: 'Inicio' }],
			});
		}
	}, [user, navigation]);

	const handleLogin = async () => {
		if (!dni) {
			setError('Por favor ingresa tu DNI');
			return;
		}

		setError('');
		setIsLoading(true);

		try {
			const respuesta = await fetch(`${URL_API}/login`, {
				method: 'POST',
				body: JSON.stringify({ dni }),
				timeout: 5000,
			});

			if (!respuesta || respuesta.status !== 200) {
				setIsLoading(false);
				setError('Error al iniciar sesión. Verifica tus credenciales.');
				return;
			}

			const json = await respuesta.json();
			const usuario = json.user;

			if (!usuario) {
				setIsLoading(false);
				setError('Usuario no encontrado. Verifica tu DNI.');
				return;
			}

			setUser(usuario);
			// Redirigir al Inicio en lugar de Rutinas
			navigation.reset({
				index: 0,
				routes: [{ name: 'Inicio' }],
			});
		} catch (error) {
			console.error('error ', error);
			setIsLoading(false);
			setError('Ocurrió un error de conexión. Intenta nuevamente.');
		}
	};

	return (
		<View style={styles.container}>
			<ImageBackground
				style={styles.background}
				source={require('../assets/bg-2.jpg')}
				resizeMode="cover"
			>
				<View style={styles.overlay} />

				{isLoading && (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={COLORS.primary} />
					</View>
				)}

				<View style={styles.logoContainer}>
					{/* <Image
						source={require('../assets/logo_barbell.png')}
						style={styles.logo}
					/> */}
					<Text style={styles.appTitle}>L I M E F I T</Text>
					<Text style={styles.appSubtitle}>Tu entrenamiento personal</Text>
				</View>

				<View style={styles.formContainer}>
					<Input
						label="Identificación"
						placeholder="Ingresa tu DNI"
						value={dni}
						onChangeText={(text) => {
							setDNI(text);
							setError('');
						}}
						keyboardType="numeric"
						error={error}
						style={styles.input}
					/>

					<Button
						title="INICIAR SESIÓN"
						onPress={handleLogin}
						size="large"
						style={styles.button}
					/>

				</View>
			</ImageBackground>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	background: {
		flex: 1,
		width: '100%',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0,0,0,0.6)',
	},
	loadingContainer: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.7)',
		zIndex: 10,
	},
	logoContainer: {
		alignItems: 'center',
		marginTop: SPACING.xxl,
		width: '100%',
	},
	logo: {
		width: 100,
		height: 100,
		tintColor: COLORS.primary,
		marginBottom: SPACING.m,
	},
	appTitle: {
		...FONTS.title,
		fontSize: 40,
		color: COLORS.primary,
		fontWeight: '900',
		letterSpacing: 4,
		marginBottom: SPACING.s,
	},
	appSubtitle: {
		...FONTS.subtitle,
		color: COLORS.text,
		marginBottom: SPACING.xl,
	},
	formContainer: {
		width: '85%',
		backgroundColor: 'rgba(37, 37, 37, 0.9)',
		borderRadius: BORDER_RADIUS.l,
		padding: SPACING.xl,
		marginBottom: SPACING.xxl,
		...SHADOWS.medium,
	},
	footerText: {
		...FONTS.caption,
		textAlign: 'center',
		marginTop: SPACING.l,
		color: COLORS.textSecondary,
	},
	input: {
		marginBottom: SPACING.l,
	},
	button: {
		marginTop: SPACING.m,
	},
});

export default LoginScreen;
