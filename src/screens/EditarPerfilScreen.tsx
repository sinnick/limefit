import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fontFamily } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { RootStackParamList, PerfilUpdate } from '../types';
import { useUser } from '../store/userStore';
import { useUpdateProfile } from '../services/queries';
import { Input } from '../components/ui/Input';
import { Button, Card } from '../components/ui';
import { useToast } from '../components/ui/Toast';

// ============================================================================
// EditarPerfilScreen (CONTRACT-fase1 §3.2 / 1.5).
//
// Form de edición del perfil del socio: FOTO (URL/dataURI), nombre, apellido,
// email, sexo y peso objetivo. Guarda con useUpdateProfile() (POST /user/profile
// por DNI) que al tener éxito refleja el user adaptado en userStore.setUser.
// El DNI NO es editable (es la clave). Solo se envían los campos modificados.
// ============================================================================

interface EditarPerfilScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditarPerfil'>;
}

type SexoOption = 'M' | 'F';

// El User guardado tiene NAME combinado ("Nombre Apellido"). Para prellenar el
// form lo partimos: primer token = nombre, el resto = apellido.
const splitNombre = (name?: string): { nombre: string; apellido: string } => {
  if (!name) return { nombre: '', apellido: '' };
  const parts = name.trim().split(/\s+/);
  return {
    nombre: parts[0] ?? '',
    apellido: parts.slice(1).join(' '),
  };
};

// Devuelve number | undefined a partir del texto del input de peso objetivo.
const parsePeso = (text: string): number | undefined => {
  const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '');
  if (!cleaned) return undefined;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
};

export const EditarPerfilScreen: React.FC<EditarPerfilScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const toast = useToast();
  const updateProfile = useUpdateProfile();

  const inicial = useMemo(() => splitNombre(user?.NAME), [user?.NAME]);

  const [nombre, setNombre] = useState(inicial.nombre);
  const [apellido, setApellido] = useState(inicial.apellido);
  const [email, setEmail] = useState(user?.email ?? '');
  const [foto, setFoto] = useState(user?.FOTO ?? '');
  const [sexo, setSexo] = useState<SexoOption | ''>('');
  const [pesoObjetivo, setPesoObjetivo] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Selección de foto: la imagen se recorta cuadrada, se reduce y se guarda como
  // data-URL base64 (el backend acepta `foto` así; el schema la acota a ~2 MB).
  const elegirFoto = async (origen: 'galeria' | 'camara') => {
    try {
      const permiso =
        origen === 'camara'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        toast.error('Necesitamos permiso para acceder a tu ' + (origen === 'camara' ? 'cámara' : 'galería'));
        return;
      }
      setSubiendoFoto(true);
      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      };
      const res =
        origen === 'camara'
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);
      if (!res.canceled && res.assets?.[0]?.base64) {
        setFoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
      }
    } catch {
      toast.error('No pudimos cargar la foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const abrirSelectorFoto = () => {
    Alert.alert('Foto de perfil', undefined, [
      { text: 'Tomar foto', onPress: () => elegirFoto('camara') },
      { text: 'Elegir de la galería', onPress: () => elegirFoto('galeria') },
      ...(foto ? [{ text: 'Quitar foto', style: 'destructive' as const, onPress: () => setFoto('') }] : []),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

  const getInitials = (): string => {
    const base = `${nombre} ${apellido}`.trim() || user?.NAME || '';
    if (!base) return '?';
    return base
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const emailValido = (value: string) =>
    value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleGuardar = () => {
    if (!emailValido(email)) {
      toast.error('Ingresá un email válido', 'Email inválido');
      return;
    }

    // Solo enviamos campos con valor (el endpoint no pisa con undefined).
    const payload: PerfilUpdate = {};
    if (nombre.trim()) payload.nombre = nombre.trim();
    if (apellido.trim()) payload.apellido = apellido.trim();
    if (email.trim()) payload.email = email.trim();
    if (foto.trim()) payload.foto = foto.trim();
    if (sexo) payload.sexo = sexo;
    const peso = parsePeso(pesoObjetivo);
    if (peso !== undefined) payload.pesoObjetivo = peso;

    if (Object.keys(payload).length === 0) {
      toast.info('No hay cambios para guardar');
      return;
    }

    updateProfile.mutate(payload, {
      onSuccess: () => {
        toast.success('Perfil actualizado', 'Listo');
        navigation.goBack();
      },
      onError: () => {
        toast.error('No se pudo guardar el perfil', 'Error');
      },
    });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
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
          marginLeft: 12,
        },
        scrollContent: {
          paddingHorizontal: 20,
        },
        avatarSection: {
          alignItems: 'center',
          marginBottom: 24,
        },
        avatarContainer: {
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
          borderWidth: 3,
          borderColor: colors.lime,
          overflow: 'hidden',
        },
        avatar: {
          width: 100,
          height: 100,
          borderRadius: 50,
        },
        avatarCamBadge: {
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.lime,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: colors.background,
        },
        avatarText: {
          fontFamily: fontFamily.bold,
          fontSize: 32,
          color: colors.lime,
        },
        avatarHint: {
          fontFamily: fontFamily.regular,
          fontSize: 13,
          color: colors.textMuted,
        },
        sectionTitle: {
          fontFamily: fontFamily.bold,
          fontSize: 16,
          color: colors.textPrimary,
          marginBottom: 12,
        },
        sexoRow: {
          flexDirection: 'row',
          gap: 12,
          marginBottom: 16,
        },
        sexoOption: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 14,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        sexoOptionActive: {
          borderColor: colors.lime,
          backgroundColor: `${colors.lime}20`,
        },
        sexoText: {
          fontFamily: fontFamily.medium,
          fontSize: 15,
          color: colors.textSecondary,
        },
        sexoTextActive: {
          color: colors.lime,
        },
        saveContainer: {
          marginTop: 16,
        },
      }),
    [colors]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar perfil</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar tocable → tomar/elegir foto */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={abrirSelectorFoto}
            activeOpacity={0.85}
            disabled={subiendoFoto}
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de perfil"
          >
            <View style={styles.avatarContainer}>
              {foto.trim() ? (
                <Image source={{ uri: foto.trim() }} style={styles.avatar} />
              ) : (
                <Text style={styles.avatarText}>{getInitials()}</Text>
              )}
              {/* Badge de cámara sobre el avatar */}
              <View style={styles.avatarCamBadge}>
                <Ionicons name="camera" size={16} color={colors.white} />
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={abrirSelectorFoto} disabled={subiendoFoto}>
            <Text style={[styles.avatarHint, { color: colors.lime }]}>
              {subiendoFoto ? 'Cargando…' : foto ? 'Cambiar foto' : 'Agregar foto'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>DNI: {user?.DNI ?? '—'}</Text>
        </View>

        <Card variant="default" padding="lg">
          <Text style={styles.sectionTitle}>Datos personales</Text>

          <Input
            label="Nombre"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Tu nombre"
            autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
          />

          <Input
            label="Apellido"
            value={apellido}
            onChangeText={setApellido}
            placeholder="Tu apellido"
            autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailValido(email) ? undefined : 'Email inválido'}
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
          />

          <Text style={styles.sectionTitle}>Sexo</Text>
          <View style={styles.sexoRow}>
            {(['M', 'F'] as SexoOption[]).map((opt) => {
              const active = sexo === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.sexoOption, active && styles.sexoOptionActive]}
                  onPress={() => setSexo(active ? '' : opt)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt === 'M' ? 'male' : 'female'}
                    size={18}
                    color={active ? colors.lime : colors.textSecondary}
                  />
                  <Text style={[styles.sexoText, active && styles.sexoTextActive]}>
                    {opt === 'M' ? 'Masculino' : 'Femenino'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <View style={{ height: 16 }} />

        <Card variant="default" padding="lg">
          <Text style={styles.sectionTitle}>Objetivos</Text>

          <Input
            label="Peso objetivo (kg)"
            value={pesoObjetivo}
            onChangeText={setPesoObjetivo}
            placeholder="Ej: 78"
            keyboardType="numeric"
            leftIcon={<Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />}
          />
        </Card>

        <View style={styles.saveContainer}>
          <Button
            title="Guardar cambios"
            variant="primary"
            size="lg"
            fullWidth
            loading={updateProfile.isPending}
            disabled={updateProfile.isPending}
            onPress={handleGuardar}
            leftIcon={
              <Ionicons name="checkmark" size={22} color={colors.background} />
            }
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditarPerfilScreen;
