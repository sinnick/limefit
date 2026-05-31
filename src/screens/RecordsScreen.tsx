import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontFamily, shadows } from '../constants/theme';
import { RootStackParamList, Record } from '../types';
import { useRecordsQuery } from '../services/queries';
import { useUser } from '../store/userStore';
import { useRecords } from '../store/recordsStore';
import { Card, EmptyState, Loading, Badge } from '../components/ui';
import { UserHeader } from '../components';

interface RecordsScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Records'>;
}

interface RecordCardProps {
  record: Record;
  index: number;
}

const RecordCard: React.FC<RecordCardProps> = ({ record, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, translateX]);

  const formattedDate = new Date(record.fecha).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX }] }}>
      <Card variant="elevated" padding="lg" style={styles.recordCard}>
        <View style={styles.cardHeader}>
          <View style={styles.trophyContainer}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.ejercicioName}>{record.ejercicioNombre}</Text>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.recordStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{record.peso}</Text>
            <Text style={styles.statLabel}>kg</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{record.reps}</Text>
            <Text style={styles.statLabel}>reps</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.lime }]}>
              {(record.peso * record.reps).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>volumen</Text>
          </View>
        </View>

        {record.notas && (
          <View style={styles.notasContainer}>
            <Text style={styles.notasText}>{record.notas}</Text>
          </View>
        )}
      </Card>
    </Animated.View>
  );
};

export const RecordsScreen: React.FC<RecordsScreenProps> = ({ navigation }) => {
  const user = useUser();
  const records = useRecords();
  const { isLoading, refetch, isRefetching } = useRecordsQuery(user?.DNI || '');

  const statsAnim = useRef(new Animated.Value(0)).current;

  const [filterBy, setFilterBy] = useState<'all' | 'recent'>('all');

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, statsAnim]);

  // Agrupar records por ejercicio y obtener el mejor
  const bestRecords = useMemo(() => {
    const grouped = new Map<string, Record>();

    records.forEach((record) => {
      const existing = grouped.get(record.ejercicioId);
      if (!existing || record.peso > existing.peso) {
        grouped.set(record.ejercicioId, record);
      }
    });

    const best = Array.from(grouped.values());

    if (filterBy === 'recent') {
      return best.sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
    }

    return best.sort((a, b) => b.peso - a.peso);
  }, [records, filterBy]);

  // Stats
  const totalPRs = bestRecords.length;
  const pesoMaximo = Math.max(...bestRecords.map((r) => r.peso), 0);
  const volumenTotal = bestRecords.reduce((acc, r) => acc + r.peso * r.reps, 0);

  if (isLoading) {
    return <Loading fullScreen message="Cargando records..." />;
  }

  return (
    <View style={styles.container}>
      <UserHeader
        title="Mis Records"
        subtitle={`${totalPRs} PRs personales`}
        showSettings={false}
      />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* Stats Summary */}
      <Animated.View style={[styles.statsContainer, { opacity: statsAnim }]}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={styles.statBoxValue}>{totalPRs}</Text>
            <Text style={styles.statBoxLabel}>PRs Totales</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="barbell" size={24} color={colors.lime} />
            <Text style={styles.statBoxValue}>{pesoMaximo}</Text>
            <Text style={styles.statBoxLabel}>Peso Máx (kg)</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="trending-up" size={24} color={colors.success} />
            <Text style={styles.statBoxValue}>{(volumenTotal / 1000).toFixed(1)}k</Text>
            <Text style={styles.statBoxLabel}>Volumen Total</Text>
          </View>
        </View>
      </Animated.View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filterBy === 'all' && styles.filterTabActive]}
          onPress={() => setFilterBy('all')}
        >
          <Text style={[styles.filterText, filterBy === 'all' && styles.filterTextActive]}>
            Por Peso
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterBy === 'recent' && styles.filterTabActive]}
          onPress={() => setFilterBy('recent')}
        >
          <Text style={[styles.filterText, filterBy === 'recent' && styles.filterTextActive]}>
            Más Recientes
          </Text>
        </TouchableOpacity>
      </View>

      {bestRecords.length === 0 ? (
        <EmptyState
          icon="trophy-outline"
          title="Sin records aún"
          description="Completa entrenamientos para establecer tus primeros records personales."
        />
      ) : (
        <FlashList
          data={bestRecords}
          renderItem={({ item, index }) => (
            <RecordCard record={item} index={index} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.lime}
              colors={[colors.lime]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...shadows.sm,
  },
  statBoxValue: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.textPrimary,
    marginTop: 8,
  },
  statBoxLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.lime,
  },
  filterText: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recordCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trophyContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `#FFD70020`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  ejercicioName: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  recordStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  notasContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  notasText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default RecordsScreen;
