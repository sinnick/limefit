import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import { fontFamily, spacing, borderRadius, fontSize, type Palette } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { RootStackParamList, MetodoCheckin } from '../types';
import { useAsistenciaStore, useAsistenciaHistorial } from '../store/asistenciaStore';
import { useUser } from '../store/userStore';
import { Button, Input, Card } from '../components/ui';
import { TENANT_ID } from '../constants/config';

// ============================================================================
// ScanQRScreen (CONTRACT-fase2 §2.5 / §5.5 / §4).
//
// Pantalla de check-in/asistencia. El socio escanea el QR del gym (expo-camera,
// CameraView + onBarcodeScanned) o ingresa manualmente; en ambos casos se marca
// la asistencia OFFLINE-FIRST vía asistenciaStore.marcarAsistencia (guarda local
// + encola en syncQueue type 'asistencia'). Un check-in por día (guardarraíl en
// el store + idempotencia por (GYM_ID, DNI, FECHA-día) en el backend).
//
// El QR del gym codifica un identificador de gym (tenant). Validamos que el
// contenido escaneado corresponda al gym activo (X-Brand) antes de marcar; un QR
// ajeno no registra. Si el formato no matchea, igual se permite (modo permisivo)
// pero se etiqueta el método para trazabilidad.
// ============================================================================

interface ScanQRScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ScanQR'>;
}

type Estado = 'idle' | 'ok' | 'duplicado';

// El payload del QR del gym puede venir como texto plano (el tenant) o como JSON
// `{"gym":"level"}` / `{"tenant":"level"}`. Extraemos el identificador de gym de
// forma tolerante; "" si no se reconoce.
const parseGymDelQR = (data: string): string => {
  const raw = (data ?? '').trim();
  if (!raw) return '';
  try {
    const obj = JSON.parse(raw);
    return String(obj?.gym ?? obj?.tenant ?? obj?.gymId ?? '').trim();
  } catch {
    // Texto plano (p.ej. "level" o "levelgym").
    return raw;
  }
};

// ¿El QR pertenece al gym activo? Comparación tolerante (X-Brand de la app vs
// gymId del backend pueden diferir, p.ej. "levelgym" vs "level"), case-insensitive.
const qrEsDelGym = (gymDelQr: string): boolean => {
  if (!gymDelQr) return false;
  const tenant = String(TENANT_ID).toLowerCase();
  const v = gymDelQr.toLowerCase();
  return v === tenant || tenant.includes(v) || v.includes(tenant);
};

export const ScanQRScreen: React.FC<ScanQRScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const user = useUser();
  const dni = user?.DNI || '';

  const [permission, requestPermission] = useCameraPermissions();
  const marcarAsistencia = useAsistenciaStore((s) => s.marcarAsistencia);
  const yaRegistradoHoy = useAsistenciaStore((s) => s.yaRegistradoHoy);
  const historial = useAsistenciaHistorial();

  const [estado, setEstado] = useState<Estado>('idle');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [modoManual, setModoManual] = useState(false);
  const [dniManual, setDniManual] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  // Evita procesar el mismo frame muchas veces (onBarcodeScanned dispara en cada
  // frame mientras el QR está visible). Una vez procesado, ignoramos hasta reset.
  const procesandoRef = useRef(false);

  const yaHoy = yaRegistradoHoy();

  // Registra el check-in (común a QR y manual). Offline-first: el store guarda
  // local y encola. El feedback es inmediato (no espera la red).
  const registrar = useCallback(
    (metodo: MetodoCheckin, dniUsar: string, notas?: string) => {
      if (!dniUsar) {
        setAviso('No hay socio identificado. Iniciá sesión de nuevo.');
        return;
      }
      const yaEstaba = useAsistenciaStore.getState().yaRegistradoHoy();
      marcarAsistencia({ metodo, dni: dniUsar, notas });
      setEstado(yaEstaba ? 'duplicado' : 'ok');
      setMensaje(
        yaEstaba
          ? 'Ya tenías el check-in de hoy registrado.'
          : '¡Check-in registrado! Nos vemos en el gym.'
      );
    },
    [marcarAsistencia]
  );

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (procesandoRef.current) return;
      procesandoRef.current = true;

      const gymDelQr = parseGymDelQR(result.data);
      if (!qrEsDelGym(gymDelQr)) {
        setAviso(
          'Ese QR no es de este gimnasio. Escaneá el QR de recepción.'
        );
        // Permitir reintentar con otro QR tras un instante.
        setTimeout(() => {
          procesandoRef.current = false;
        }, 1500);
        return;
      }

      setAviso(null);
      registrar('qr', dni, 'scan en recepción');
    },
    [dni, registrar]
  );

  const onCheckinManual = useCallback(() => {
    const valor = dniManual.trim();
    // Si el socio está logueado, el DNI manual debe coincidir (no se hace check-in
    // por otro). Si está vacío, usamos el del socio logueado.
    const dniUsar = valor || dni;
    if (dni && valor && valor !== dni) {
      setAviso('El DNI ingresado no coincide con tu sesión.');
      return;
    }
    setAviso(null);
    registrar('manual', dniUsar);
  }, [dni, dniManual, registrar]);

  const reset = useCallback(() => {
    setEstado('idle');
    setMensaje(null);
    setAviso(null);
    procesandoRef.current = false;
  }, []);

  const styles = makeStyles(colors);

  // --- Pantalla de éxito / duplicado ---------------------------------------
  if (estado === 'ok' || estado === 'duplicado') {
    const esOk = estado === 'ok';
    return (
      <View style={styles.container}>
        <Header colors={colors} onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <View
            style={[
              styles.resultIcon,
              { backgroundColor: esOk ? colors.success : colors.surfaceLight },
            ]}
          >
            <Ionicons
              name={esOk ? 'checkmark-circle' : 'time-outline'}
              size={72}
              color={esOk ? colors.white : colors.accent}
            />
          </View>
          <Text style={styles.resultTitle}>
            {esOk ? 'Check-in OK' : 'Ya registrado'}
          </Text>
          {mensaje && <Text style={styles.resultMessage}>{mensaje}</Text>}
          <Text style={styles.resultSub}>
            {historial.length} asistencia{historial.length === 1 ? '' : 's'} registrada
            {historial.length === 1 ? '' : 's'}
          </Text>
          <View style={styles.resultActions}>
            <Button title="Listo" variant="primary" onPress={() => navigation.goBack()} />
            <Button title="Otro check-in" variant="ghost" onPress={reset} />
          </View>
        </View>
      </View>
    );
  }

  // --- Permiso de cámara aún no resuelto -----------------------------------
  if (!modoManual && !permission) {
    return (
      <View style={styles.container}>
        <Header colors={colors} onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={styles.infoText}>Inicializando cámara...</Text>
        </View>
      </View>
    );
  }

  // --- Permiso de cámara denegado → ofrecer pedir permiso o modo manual ----
  if (!modoManual && permission && !permission.granted) {
    return (
      <View style={styles.container}>
        <Header colors={colors} onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
          <Text style={styles.resultTitle}>Cámara no disponible</Text>
          <Text style={styles.infoText}>
            Necesitamos permiso de cámara para escanear el QR del gym. También podés
            registrar tu asistencia ingresando tu DNI.
          </Text>
          <View style={styles.resultActions}>
            {permission.canAskAgain ? (
              <Button
                title="Permitir cámara"
                variant="primary"
                onPress={requestPermission}
              />
            ) : null}
            <Button
              title="Ingresar DNI manual"
              variant="outline"
              onPress={() => setModoManual(true)}
            />
          </View>
        </View>
      </View>
    );
  }

  // --- Modo manual (DNI) ---------------------------------------------------
  if (modoManual) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Header colors={colors} onBack={() => navigation.goBack()} />
        <View style={styles.manualWrap}>
          <Card variant="elevated" padding="lg">
            <Text style={styles.sectionTitle}>Check-in manual</Text>
            <Text style={styles.infoText}>
              Confirmá tu DNI para registrar la asistencia de hoy.
            </Text>
            <Input
              label="DNI"
              value={dniManual || dni}
              onChangeText={setDniManual}
              keyboardType="number-pad"
              placeholder="Tu DNI"
              editable={!dni}
              leftIcon={<Ionicons name="card-outline" size={20} color={colors.textMuted} />}
            />
            {yaHoy && (
              <Text style={styles.warnText}>Ya registraste tu asistencia hoy.</Text>
            )}
            {aviso && <Text style={styles.warnText}>{aviso}</Text>}
            <View style={styles.manualActions}>
              <Button
                title="Registrar asistencia"
                variant="primary"
                onPress={onCheckinManual}
              />
              <Button
                title="Volver al escáner"
                variant="ghost"
                onPress={() => {
                  setModoManual(false);
                  setAviso(null);
                }}
              />
            </View>
          </Card>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // --- Escáner QR ----------------------------------------------------------
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onBarcodeScanned}
      />

      {/* Overlay con header, recuadro guía y acciones, sobre la cámara */}
      <View style={styles.overlay} pointerEvents="box-none">
        <Header colors={colors} onBack={() => navigation.goBack()} transparent />

        <View style={styles.scanArea} pointerEvents="none">
          <View style={styles.reticle} />
          <Text style={styles.scanHint}>Apuntá al QR de recepción</Text>
        </View>

        <View style={styles.bottomBar}>
          {yaHoy && (
            <Text style={styles.overlayWarn}>Ya registraste tu asistencia hoy.</Text>
          )}
          {aviso && <Text style={styles.overlayWarn}>{aviso}</Text>}
          <Button
            title="Ingresar DNI manual"
            variant="outline"
            onPress={() => setModoManual(true)}
          />
        </View>
      </View>
    </View>
  );
};

// Header reutilizable (back + título). `transparent` para superponerse a la cámara.
const Header: React.FC<{
  colors: Palette;
  onBack: () => void;
  transparent?: boolean;
}> = ({ colors, onBack, transparent }) => {
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);
  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + spacing.sm },
        transparent && styles.headerTransparent,
      ]}
    >
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={transparent ? colors.white : colors.textPrimary}
        />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, transparent && { color: colors.white }]}>
        Check-in
      </Text>
    </View>
  );
};

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    headerTransparent: {
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xl,
      color: colors.textPrimary,
    },
    overlay: {
      flex: 1,
      justifyContent: 'space-between',
    },
    scanArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reticle: {
      width: 240,
      height: 240,
      borderWidth: 3,
      borderColor: colors.accent,
      borderRadius: borderRadius.xl,
      backgroundColor: 'transparent',
    },
    scanHint: {
      marginTop: spacing.lg,
      fontFamily: fontFamily.medium,
      fontSize: fontSize.base,
      color: colors.white,
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.8)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    bottomBar: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    overlayWarn: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.sm,
      color: colors.white,
      textAlign: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    manualWrap: {
      flex: 1,
      padding: spacing.lg,
      justifyContent: 'center',
    },
    sectionTitle: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.lg,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    infoText: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.base,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.sm,
    },
    warnText: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.sm,
      color: colors.warning,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    resultIcon: {
      width: 120,
      height: 120,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultTitle: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize['2xl'],
      color: colors.textPrimary,
      textAlign: 'center',
    },
    resultMessage: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.base,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    resultSub: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.sm,
      color: colors.textMuted,
      textAlign: 'center',
    },
    resultActions: {
      width: '100%',
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    manualActions: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
  });

export default ScanQRScreen;
