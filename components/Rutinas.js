import { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import UserBadge from './UserBadge';
import UserContext from '../context/UserContext';
import RutinasContext from '../context/RutinasContext';
import { URL_API } from '../config';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/theme';

const Rutinas = ({ navigation }) => {
    const { user } = useContext(UserContext);
    const { rutinas, setRutinas } = useContext(RutinasContext);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const getRutinas = async () => {
        setIsLoading(true);
        try {
            const respuesta = await fetch(`${URL_API}/rutinas`);
            const json = await respuesta.json();
            setRutinas(json.result_rutinas);
        } catch (error) {
            console.error('error ', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        getRutinas();
    };

    useEffect(() => {
        getRutinas();
    }, []);

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Image 
                source={require('../assets/logo_barbell.png')} 
                style={styles.emptyImage}
            />
            <Text style={styles.emptyText}>No hay rutinas disponibles</Text>
            <TouchableOpacity 
                style={styles.refreshButton} 
                onPress={handleRefresh}
            >
                <Text style={styles.refreshButtonText}>Recargar</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <UserBadge onProfilePress={() => navigation.navigate('Profile')} />
            
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Mis Rutinas</Text>
                <Text style={styles.headerSubtitle}>
                    Selecciona una rutina para comenzar
                </Text>
            </View>
            
            <FlatList
                data={rutinas}
                numColumns={1}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContainer}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                ListEmptyComponent={renderEmptyList}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.cardContainer}
                        onPress={() => navigation.navigate('Rutina', { rutina: item })}
                    >
                        <View style={styles.cardBackground}>
                            <Text style={styles.cardTitle}>{item.NOMBRE}</Text>
                            <Text style={styles.cardDetails}>
                                {item.DIAS.map((dia) => dia.day).join(', ')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerContainer: {
        paddingHorizontal: SPACING.l,
        marginBottom: SPACING.m,
    },
    headerTitle: {
        ...FONTS.title,
        color: COLORS.text,
    },
    headerSubtitle: {
        ...FONTS.caption,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    listContainer: {
        padding: SPACING.s,
        paddingBottom: SPACING.xxl,
    },
    cardContainer: {
        marginBottom: SPACING.m,
        borderRadius: BORDER_RADIUS.l,
        overflow: 'hidden',
        ...SHADOWS.medium,
    },
    cardBackground: {
        padding: SPACING.l,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#adfa1d',
        width: '100%',
        height: 120, // Altura ajustada para el contenido actual
    },
    cardTitle: {
        ...FONTS.h2,
        fontWeight: 'bold',
        color: '#333333',
        textAlign: 'center',
        marginBottom: SPACING.m,
        fontSize: 20,
        maxWidth: '90%', // Evita que textos largos rompan el diseño
    },
    cardDetails: {
        ...FONTS.body,
        color: '#555555',
        textAlign: 'center',
        letterSpacing: 0.5,
        maxWidth: '90%', // Evita que textos largos rompan el diseño
        maxHeight: 40, // Limita la altura para textos muy largos
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    emptyImage: {
        width: 80,
        height: 80,
        tintColor: COLORS.textSecondary,
        opacity: 0.5,
        marginBottom: SPACING.l,
    },
    emptyText: {
        ...FONTS.subtitle,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.l,
    },
    refreshButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        borderRadius: BORDER_RADIUS.m,
        ...SHADOWS.small,
    },
    refreshButtonText: {
        ...FONTS.button,
        color: COLORS.secondary,
    },
    daysContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: SPACING.xs,
    },
    dayTag: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333333',
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: SPACING.s,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.s,
        margin: SPACING.xs,
        overflow: 'hidden',
        textTransform: 'uppercase',
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: SPACING.s,
    },
    exerciseInfo: {
        alignItems: 'center',
    },
    daysInfo: {
        alignItems: 'center',
    },
    infoValue: {
        ...FONTS.h2,
        color: '#333333',
    },
    infoLabel: {
        ...FONTS.caption,
        color: '#555555',
    },
    divider: {
        width: 1,
        height: '100%',
        backgroundColor: '#cccccc',
        marginHorizontal: SPACING.m,
    },
    muscleGroupsText: {
        ...FONTS.body,
        color: '#555555',
        textAlign: 'center',
        marginBottom: SPACING.s,
    },
});

export default Rutinas;
