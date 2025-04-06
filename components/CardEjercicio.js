import { useState } from 'react';
import { Text, View, StyleSheet, Modal, Image, TouchableOpacity, ScrollView } from 'react-native';
import Checkbox from 'expo-checkbox';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import Button from './common/Button';

const CardEjercicio = ({ ejercicio, index, isCompleted, onToggleComplete }) => {
    const [modalVisible, setModalVisible] = useState(false);
    
    // Usar el estado controlado por el componente padre en lugar del local
    const checked = isCompleted || false;
    const setChecked = (value) => {
        if (onToggleComplete) {
            onToggleComplete(value);
        }
    };

    // Función para traducir el tipo de ejercicio
    const getTipoEjercicio = (tipo) => {
        const tipos = {
            'strength': 'Fuerza',
            'cardio': 'Cardio',
            'flexibility': 'Flexibilidad',
            'balance': 'Equilibrio'
        };
        return tipos[tipo] || tipo;
    };

    // Función para traducir el músculo trabajado
    const getMusculo = (musculo) => {
        const musculos = {
            'chest': 'Pecho',
            'back': 'Espalda',
            'legs': 'Piernas',
            'shoulders': 'Hombros',
            'arms': 'Brazos',
            'abs': 'Abdominales',
            'biceps': 'Bíceps',
            'triceps': 'Tríceps',
            'forearms': 'Antebrazos',
            'calves': 'Pantorrillas'
        };
        return musculos[musculo] || musculo;
    };

    // Función para traducir la dificultad
    const getDificultad = (dificultad) => {
        const dificultades = {
            'beginner': 'Principiante',
            'intermediate': 'Intermedio',
            'advanced': 'Avanzado'
        };
        return dificultades[dificultad] || dificultad;
    };

    return (
        <View style={styles.cardContainer}>
            <View style={[styles.card, checked && styles.cardCompleted]}>
                <View style={styles.cardContent}>
                    <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName} numberOfLines={1}>
                            {ejercicio.name}
                        </Text>
                        
                        <View style={styles.detailsRow}>
                            <Text style={styles.exerciseDetails}>
                                {`${ejercicio.sets} series × ${ejercicio.reps} reps`}
                            </Text>
                            
                            <View style={styles.tagsContainer}>
                                {ejercicio.muscle && (
                                    <View style={styles.tagContainer}>
                                        <Text style={styles.tagText}>{getMusculo(ejercicio.muscle)}</Text>
                                    </View>
                                )}
                                
                                {ejercicio.difficulty && (
                                    <View style={[
                                        styles.tagContainer, 
                                        ejercicio.difficulty === 'beginner' ? styles.beginnerTag :
                                        ejercicio.difficulty === 'intermediate' ? styles.intermediateTag : 
                                        styles.advancedTag
                                    ]}>
                                        <Text style={[
                                            styles.tagText,
                                            ejercicio.difficulty !== 'beginner' && styles.darkTagText
                                        ]}>
                                            {getDificultad(ejercicio.difficulty)}
                                        </Text>
                                    </View>
                                )}
                                
                                {ejercicio.equipment && (
                                    <View style={[styles.tagContainer, styles.equipmentTag]}>
                                        <Text style={styles.tagText}>
                                            {ejercicio.equipment.replace('_', ' ')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={styles.actionsContainer}>
                        <TouchableOpacity 
                            style={styles.infoButton} 
                            onPress={() => setModalVisible(true)}
                        >
                            <Image 
                                source={require('../assets/help.png')} 
                                style={styles.infoIcon} 
                            />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.checkboxContainer}
                            onPress={() => setChecked(!checked)}
                        >
                            <Checkbox
                                value={checked}
                                onValueChange={setChecked}
                                style={styles.checkbox}
                                color={checked ? '#adfa1d' : COLORS.darkGray}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <Modal
                visible={modalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{ejercicio.name}</Text>
                            <TouchableOpacity 
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>×</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.infoGrid}>
                                {ejercicio.muscle && (
                                    <View style={styles.infoGridItem}>
                                        <Text style={styles.infoGridLabel}>Músculo:</Text>
                                        <Text style={styles.infoGridValue}>{getMusculo(ejercicio.muscle)}</Text>
                                    </View>
                                )}
                                
                                {ejercicio.type && (
                                    <View style={styles.infoGridItem}>
                                        <Text style={styles.infoGridLabel}>Tipo:</Text>
                                        <Text style={styles.infoGridValue}>{getTipoEjercicio(ejercicio.type)}</Text>
                                    </View>
                                )}
                                
                                {ejercicio.difficulty && (
                                    <View style={styles.infoGridItem}>
                                        <Text style={styles.infoGridLabel}>Dificultad:</Text>
                                        <Text style={styles.infoGridValue}>{getDificultad(ejercicio.difficulty)}</Text>
                                    </View>
                                )}
                                
                                {ejercicio.equipment && (
                                    <View style={styles.infoGridItem}>
                                        <Text style={styles.infoGridLabel}>Equipo:</Text>
                                        <Text style={styles.infoGridValue}>{ejercicio.equipment.replace('_', ' ')}</Text>
                                    </View>
                                )}
                            </View>
                            
                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Series × Repeticiones:</Text>
                                <View style={styles.setsInfoContainer}>
                                    <Text style={styles.setsInfoText}>{ejercicio.sets} series</Text>
                                    <Text style={styles.setsInfoSeparator}>×</Text>
                                    <Text style={styles.setsInfoText}>{ejercicio.reps} repeticiones</Text>
                                </View>
                            </View>

                            <View style={styles.modalSection}>
                                <Text style={styles.modalSectionTitle}>Instrucciones:</Text>
                                <Text style={styles.modalText}>{ejercicio.instructions}</Text>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <Button 
                                title="Entendido" 
                                onPress={() => setModalVisible(false)}
                                variant="primary"
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginVertical: SPACING.s,
        width: '100%',
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.m,
        borderLeftWidth: 4,
        borderLeftColor: '#adfa1d',
        ...SHADOWS.small,
    },
    cardCompleted: {
        opacity: 0.7,
        borderLeftColor: COLORS.success,
    },
    cardContent: {
        flexDirection: 'row',
        padding: SPACING.m,
        alignItems: 'center',
    },
    exerciseInfo: {
        flex: 1,
        marginRight: SPACING.s,
    },
    exerciseName: {
        ...FONTS.h2,
        fontWeight: 'bold',
        color: '#eeeeee',
        marginBottom: SPACING.xs,
        fontSize: 18,
    },
    exerciseDetails: {
        ...FONTS.body,
        color: '#888888',
        letterSpacing: 0.3,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: SPACING.xs,
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginLeft: SPACING.s,
    },
    tagContainer: {
        backgroundColor: '#adfa1d',
        borderRadius: BORDER_RADIUS.s,
        paddingHorizontal: SPACING.xs,
        paddingVertical: 2,
        marginLeft: SPACING.xs,
    },
    tagText: {
        ...FONTS.caption,
        color: '#333333',
        fontWeight: '600',
        fontSize: 10,
    },
    beginnerTag: {
        backgroundColor: '#adfa1d',
    },
    intermediateTag: {
        backgroundColor: '#f0ad4e',
    },
    advancedTag: {
        backgroundColor: '#d9534f',
    },
    darkTagText: {
        color: '#ffffff',
    },
    equipmentTag: {
        backgroundColor: '#5bc0de',
    },
    difficultyTag: {
        backgroundColor: COLORS.darkGray,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoButton: {
        padding: SPACING.s,
        marginRight: SPACING.s,
    },
    infoIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.textSecondary,
    },
    checkboxContainer: {
        padding: SPACING.xs,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: BORDER_RADIUS.s,
        borderWidth: 2,
        borderColor: COLORS.darkGray,
    },
    
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l,
    },
    modalContainer: {
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.l,
        width: '90%',
        maxHeight: '80%',
        ...SHADOWS.large,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.darkGray,
    },
    modalTitle: {
        ...FONTS.subtitle,
        color: COLORS.primary,
        flex: 1,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: BORDER_RADIUS.circle,
        backgroundColor: COLORS.darkGray,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 28,
    },
    modalBody: {
        padding: SPACING.m,
        maxHeight: 400,
    },
    modalSectionTitle: {
        ...FONTS.subtitle,
        color: COLORS.text,
        marginBottom: SPACING.s,
    },
    modalText: {
        ...FONTS.body,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    modalFooter: {
        padding: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: COLORS.darkGray,
        alignItems: 'center',
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: SPACING.m,
    },
    infoGridItem: {
        width: '50%',
        marginBottom: SPACING.s,
    },
    infoGridLabel: {
        ...FONTS.caption,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    infoGridValue: {
        ...FONTS.body,
        color: COLORS.text,
    },
    modalSection: {
        marginBottom: SPACING.m,
    },
    setsInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    setsInfoText: {
        ...FONTS.body,
        color: COLORS.text,
        fontWeight: '600',
    },
    setsInfoSeparator: {
        ...FONTS.body,
        color: COLORS.text,
        marginHorizontal: SPACING.xs,
    },
});
export default CardEjercicio;