import { useState, useEffect } from 'react';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserBadge from './UserBadge';
import CardEjercicio from './CardEjercicio';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/theme';

const Rutina = ({ route, navigation }) => {
	const { rutina } = route.params;
	const [activeDay, setActiveDay] = useState(0);
	const [completedExercises, setCompletedExercises] = useState({});

	// Carga los ejercicios completados desde AsyncStorage
	useEffect(() => {
		const loadCompletedExercises = async () => {
			try {
				const jsonValue = await AsyncStorage.getItem(`rutina_${rutina._id}_completed`);
				if (jsonValue != null) {
					setCompletedExercises(JSON.parse(jsonValue));
				}
			} catch (error) {
				console.error('Error al cargar ejercicios completados:', error);
			}
		};

		loadCompletedExercises();
	}, [rutina._id]);

	// Función para manejar el cambio de estado de un ejercicio
	const handleExerciseToggle = async (dayIndex, exerciseIndex, isCompleted) => {
		// Crear un identificador único para el ejercicio
		const exerciseId = `${dayIndex}_${exerciseIndex}`;

		// Actualizar el estado local
		const updatedCompleted = {
			...completedExercises,
			[exerciseId]: isCompleted
		};

		setCompletedExercises(updatedCompleted);

		// Guardar en AsyncStorage
		try {
			await AsyncStorage.setItem(
				`rutina_${rutina._id}_completed`,
				JSON.stringify(updatedCompleted)
			);
		} catch (error) {
			console.error('Error al guardar ejercicios completados:', error);
		}
	};

	// Función para verificar si un ejercicio está completado
	const isExerciseCompleted = (dayIndex, exerciseIndex) => {
		const exerciseId = `${dayIndex}_${exerciseIndex}`;
		return !!completedExercises[exerciseId];
	};

	// Calcular el progreso del día actual
	const getDayProgress = (dayIndex) => {
		const exercises = rutina.DIAS[dayIndex].exercises;
		if (!exercises || exercises.length === 0) return 0;

		let completed = 0;
		exercises.forEach((_, index) => {
			if (isExerciseCompleted(dayIndex, index)) {
				completed++;
			}
		});

		return Math.round((completed / exercises.length) * 100);
	};

	return (
		<View style={styles.container}>
			<UserBadge onProfilePress={() => navigation.navigate('Profile')} />

			<View style={styles.headerContainer}>
				<View style={styles.titleContainer}>
					<Text style={styles.routineTitle}>{rutina.NOMBRE}</Text>
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => navigation.goBack()}
					>
						<Text style={styles.backButtonText}>← Volver</Text>
					</TouchableOpacity>
				</View>

				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.tabsContainer}
				>
					{rutina.DIAS.map((dia, index) => (
						<TouchableOpacity
							key={index}
							style={[
								styles.dayTab,
								activeDay === index && styles.dayTabActive
							]}
							onPress={() => setActiveDay(index)}
						>
							<Text
								style={[
									styles.dayTabText,
									activeDay === index && styles.dayTabTextActive
								]}
							>
								{dia.day} {getDayProgress(index) > 0 && `(${getDayProgress(index)}%)`}
							</Text>
						</TouchableOpacity>
					))}
				</ScrollView>
			</View>

			<ScrollView style={styles.contentContainer}>
				<View style={styles.dayInfoContainer}>
					<Text style={styles.dayTitle}>{rutina.DIAS[activeDay].day}</Text>
					<View style={styles.dayStats}>
						<View style={styles.statItem}>
							<Text style={styles.statValue}>
								{rutina.DIAS[activeDay].exercises.length}
							</Text>
							<Text style={styles.statLabel}>Ejercicios</Text>
						</View>

						<View style={styles.statDivider}></View>

						<View style={styles.statItem}>
							<Text style={styles.statValue}>
								{rutina.DIAS[activeDay].exercises.reduce((acc, curr) => acc + parseInt(curr.sets || 0), 0)}
							</Text>
							<Text style={styles.statLabel}>Series</Text>
						</View>

						<View style={styles.statDivider}></View>

						<View style={styles.statItem}>
							<Text style={styles.statValue}>~45</Text>
							<Text style={styles.statLabel}>Minutos</Text>
						</View>
					</View>

					{getDayProgress(activeDay) > 0 && (
						<View style={styles.progressContainer}>
							<View style={styles.progressBar}>
								<View
									style={[
										styles.progressFill,
										{ width: `${getDayProgress(activeDay)}%` }
									]}
								/>
							</View>
							<Text style={styles.progressText}>
								{getDayProgress(activeDay)}% completado
							</Text>
						</View>
					)}
				</View>

				<View style={styles.exercisesContainer}>
					<Text style={styles.sectionTitle}>Ejercicios</Text>
					{rutina.DIAS[activeDay].exercises.map((ejercicio, index) => (
						<CardEjercicio
							ejercicio={ejercicio}
							index={index}
							key={`${activeDay}_${index}`}
							isCompleted={isExerciseCompleted(activeDay, index)}
							onToggleComplete={(isCompleted) =>
								handleExerciseToggle(activeDay, index, isCompleted)
							}
						/>
					))}
				</View>
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: COLORS.background,
	},
	headerContainer: {
		paddingHorizontal: SPACING.m,
		paddingBottom: SPACING.m,
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: SPACING.m,
	},
	routineTitle: {
		...FONTS.title,
		color: COLORS.text,
	},
	backButton: {
		padding: SPACING.s,
	},
	backButtonText: {
		...FONTS.body,
		color: COLORS.primary,
	},
	tabsContainer: {
		paddingBottom: SPACING.s,
	},
	dayTab: {
		paddingHorizontal: SPACING.m,
		paddingVertical: SPACING.s,
		marginRight: SPACING.s,
		borderRadius: BORDER_RADIUS.m,
		backgroundColor: COLORS.darkGray,
	},
	dayTabActive: {
		backgroundColor: COLORS.primary,
	},
	dayTabText: {
		...FONTS.body,
		color: COLORS.text,
	},
	dayTabTextActive: {
		color: COLORS.secondary,
		fontWeight: 'bold',
	},
	contentContainer: {
		flex: 1,
		padding: SPACING.m,
	},
	dayInfoContainer: {
		backgroundColor: COLORS.card,
		borderRadius: BORDER_RADIUS.m,
		padding: SPACING.m,
		marginBottom: SPACING.l,
		...SHADOWS.small,
	},
	dayTitle: {
		...FONTS.title,
		color: COLORS.primary,
		marginBottom: SPACING.s,
		fontSize: 22,
	},
	dayStats: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		backgroundColor: COLORS.darkGray,
		borderRadius: BORDER_RADIUS.s,
		paddingVertical: SPACING.s,
		paddingHorizontal: SPACING.xs,
	},
	statItem: {
		alignItems: 'center',
		flex: 1,
	},
	statValue: {
		...FONTS.subtitle,
		color: COLORS.text,
		fontSize: 20,
		fontWeight: 'bold',
	},
	statLabel: {
		...FONTS.caption,
		color: COLORS.textSecondary,
		fontSize: 12,
	},
	statDivider: {
		width: 1,
		height: '80%',
		alignSelf: 'center',
		backgroundColor: 'rgba(255,255,255,0.2)',
	},
	exercisesContainer: {
		marginBottom: SPACING.xxl,
	},
	sectionTitle: {
		...FONTS.subtitle,
		color: COLORS.text,
		marginBottom: SPACING.m,
	},
	progressContainer: {
		marginTop: SPACING.m,
	},
	progressBar: {
		height: 8,
		backgroundColor: COLORS.darkGray,
		borderRadius: BORDER_RADIUS.s,
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		backgroundColor: '#adfa1d',
	},
	progressText: {
		marginTop: SPACING.xs,
		...FONTS.caption,
		color: COLORS.textSecondary,
		textAlign: 'center',
	},
});

export default Rutina;