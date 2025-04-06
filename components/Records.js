import { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import UserBadge from './UserBadge';
import UserContext from '../context/UserContext';
import RecordsContext from '../context/RecordsContext';
import { URL_API } from '../config';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/theme';
import Button from './common/Button';

const Records = ({ navigation }) => {
    const { user } = useContext(UserContext);
    const { records, setRecords } = useContext(RecordsContext);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Función para cargar los records
    const getRecords = async () => {
        setIsLoading(true);
        try {
            const respuesta = await fetch(`${URL_API}/records/list`, {
                method: 'POST',
                body: JSON.stringify({ dni: user.DNI }),
            });
            const json = await respuesta.json();
            setRecords(json.result_records || []);
        } catch (error) {
            console.error('Error al cargar records:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        getRecords();
    };

    useEffect(() => {
        getRecords();
    }, []);

    // Componente para mostrar cuando no hay records
    const EmptyRecordsList = () => (
        <View style={styles.emptyContainer}>
            <Image 
                source={require('../assets/clock.png')} 
                style={styles.emptyImage}
            />
            <Text style={styles.emptyTitle}>No hay records</Text>
            <Text style={styles.emptyText}>
                Agrega tu primer record personal para comenzar a registrar tu progreso
            </Text>
        </View>
    );

    // Renderizar cada item de la lista de records
    const renderRecordItem = ({ item, index }) => (
        <TouchableOpacity 
            style={styles.recordCard}
            activeOpacity={0.8}
        >
            <View style={styles.recordInfo}>
                <Text style={styles.recordExercise}>{item.EJERCICIO}</Text>
                <Text style={styles.recordWeight}>{item.PESO} kg</Text>
            </View>
            
            <View style={styles.recordMeta}>
                <View style={styles.recordDate}>
                    <Image source={require('../assets/clock.png')} style={styles.dateIcon} />
                    <Text style={styles.dateText}>{item.FECHA.substring(0, 10)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <UserBadge onProfilePress={() => navigation.navigate('Profile')} />
            
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>Mis Records</Text>
                <Text style={styles.headerSubtitle}>Registra y sigue tu progreso</Text>
            </View>
            
            <View style={styles.buttonContainer}>
                <Button 
                    title="Nuevo Record" 
                    onPress={() => navigation.navigate('NuevoRecord')}
                    icon={
                        <Image 
                            source={require('../assets/logo_barbell.png')} 
                            style={styles.buttonIcon} 
                        />
                    }
                />
            </View>
            
            <FlatList
                data={records}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderRecordItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={EmptyRecordsList}
                refreshing={refreshing}
                onRefresh={handleRefresh}
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
    },
    buttonContainer: {
        paddingHorizontal: SPACING.l,
        marginBottom: SPACING.l,
    },
    buttonIcon: {
        width: 20,
        height: 20,
        tintColor: COLORS.secondary,
    },
    listContainer: {
        padding: SPACING.m,
        paddingBottom: SPACING.xxl,
    },
    recordCard: {
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        borderLeftWidth: 4,
        borderLeftColor: '#adfa1d',
        ...SHADOWS.small,
    },
    recordInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    recordExercise: {
        ...FONTS.h2,
        fontWeight: 'bold',
        color: '#333333',
        fontSize: 18,
    },
    recordWeight: {
        ...FONTS.h2,
        color: '#333333',
        fontWeight: 'bold',
        fontSize: 20,
    },
    recordMeta: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    recordDate: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateIcon: {
        width: 16,
        height: 16,
        tintColor: COLORS.textSecondary,
        marginRight: SPACING.xs,
    },
    dateText: {
        ...FONTS.caption,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        marginTop: SPACING.xl,
    },
    emptyImage: {
        width: 64,
        height: 64,
        tintColor: COLORS.textSecondary,
        opacity: 0.5,
        marginBottom: SPACING.l,
    },
    emptyTitle: {
        ...FONTS.subtitle,
        color: COLORS.text,
        marginBottom: SPACING.s,
    },
    emptyText: {
        ...FONTS.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

export default Records;