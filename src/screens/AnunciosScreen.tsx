import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontFamily, shadows } from '../constants/theme';
import { Anuncio, RootStackParamList } from '../types';
import { useAnunciosQuery } from '../services/queries';
import { Card, Loading, EmptyState } from '../components/ui';

interface AnunciosScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Anuncios'>;
}

// Formatea la fecha ISO de publicación a algo legible (ej: "31 may 2026").
const formatFecha = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const AnuncioCard: React.FC<{ anuncio: Anuncio }> = ({ anuncio }) => (
  <Card variant="default" padding="md" style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.iconBadge}>
        <Ionicons name="megaphone-outline" size={20} color={colors.warning} />
      </View>
      <Text style={styles.titulo}>{anuncio.titulo}</Text>
    </View>
    {!!anuncio.fechaPublicacion && (
      <Text style={styles.fecha}>{formatFecha(anuncio.fechaPublicacion)}</Text>
    )}
    {!!anuncio.cuerpo && <Text style={styles.cuerpo}>{anuncio.cuerpo}</Text>}
  </Card>
);

export const AnunciosScreen: React.FC<AnunciosScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } = useAnunciosQuery();

  // El backend ya ordena por FECHA_PUBLICACION DESC; re-ordenamos por las dudas.
  const anuncios = React.useMemo(() => {
    const list = data ?? [];
    return [...list].sort((a, b) => {
      const ta = a.fechaPublicacion ? new Date(a.fechaPublicacion).getTime() : 0;
      const tb = b.fechaPublicacion ? new Date(b.fechaPublicacion).getTime() : 0;
      return tb - ta;
    });
  }, [data]);

  const renderItem: ListRenderItem<Anuncio> = ({ item }) => (
    <AnuncioCard anuncio={item} />
  );

  if (isLoading) {
    return <Loading fullScreen message="Cargando anuncios..." />;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Anuncios</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={anuncios}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          anuncios.length === 0
            ? styles.emptyContent
            : [styles.listContent, { paddingBottom: insets.bottom + 24 }]
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.lime}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="megaphone-outline"
            title="No hay anuncios"
            description="Cuando el gym publique novedades, las vas a ver acá."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    marginBottom: 12,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${colors.warning}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titulo: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  fecha: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  cuerpo: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

export default AnunciosScreen;
