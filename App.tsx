import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// Import global CSS for NativeWind
import './global.css';

// Screens
import {
  LoginScreen,
  InicioScreen,
  RutinasScreen,
  RutinaDetailScreen,
  WorkoutScreen,
  RecordsScreen,
  HistorialScreen,
  PerfilScreen,
} from './src/screens';
// Pantallas de Fase 1 por import default DIRECTO (no vía el barrel): importarlas
// del barrel creaba un ciclo de evaluación que las dejaba undefined en runtime
// (React Navigation: "Couldn't find a component for screen 'RecordDetail'").
import RecordDetailScreen from './src/screens/RecordDetailScreen';
import MetricasScreen from './src/screens/MetricasScreen';
import CalendarioScreen from './src/screens/CalendarioScreen';
import EditarPerfilScreen from './src/screens/EditarPerfilScreen';
// Pantallas de Fase 2 — mismo criterio: default import DIRECTO (no barrel).
import BibliotecaScreen from './src/screens/BibliotecaScreen';
import DetalleEjercicioScreen from './src/screens/DetalleEjercicioScreen';
import ScanQRScreen from './src/screens/ScanQRScreen';
import NotificacionesScreen from './src/screens/NotificacionesScreen';

// Providers
import { ToastProvider } from './src/components/ui/Toast';
import { ThemeProvider } from './src/theme/ThemeProvider';

// Store
import { useIsAuthenticated } from './src/store/userStore';

// Types
import { RootStackParamList } from './src/types';

// Constants
import { colors } from './src/constants/theme';
import { activeBrand } from './brands/registry';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create stack navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

// Create QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    },
  },
});

// Navigation component
const Navigation: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {!isAuthenticated ? (
        // Auth Stack
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      ) : (
        // Main Stack
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.background },
          }}
          initialRouteName="Inicio"
        >
          <Stack.Screen name="Inicio" component={InicioScreen} />
          <Stack.Screen name="Rutinas" component={RutinasScreen} />
          <Stack.Screen name="Rutina" component={RutinaDetailScreen} />
          <Stack.Screen
            name="Workout"
            component={WorkoutScreen}
            options={{
              animation: 'fade_from_bottom',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="Records" component={RecordsScreen} />
          <Stack.Screen name="Historial" component={HistorialScreen} />
          <Stack.Screen name="Perfil" component={PerfilScreen} />
          {/* Fase 1 — pantallas nuevas (CONTRACT-fase1 §3.3) */}
          <Stack.Screen name="RecordDetail" component={RecordDetailScreen} />
          <Stack.Screen name="Metricas" component={MetricasScreen} />
          <Stack.Screen name="Calendario" component={CalendarioScreen} />
          <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
          {/* Fase 2 — pantallas nuevas (CONTRACT-fase2 §4) */}
          <Stack.Screen name="Biblioteca" component={BibliotecaScreen} />
          <Stack.Screen name="DetalleEjercicio" component={DetalleEjercicioScreen} />
          <Stack.Screen name="ScanQR" component={ScanQRScreen} />
          <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

// Main App component
export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load the active brand's fonts (ver brands/registry.ts).
        if (activeBrand.fontAssets) {
          await Font.loadAsync(activeBrand.fontAssets);
        }
      } catch (e) {
        console.warn('Error loading fonts:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide splash screen
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ToastProvider>
              <View style={styles.container} onLayout={onLayoutRootView}>
                <Navigation />
              </View>
            </ToastProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
