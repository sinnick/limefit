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

// Providers
import { ToastProvider } from './src/components/ui/Toast';

// Store
import { useIsAuthenticated } from './src/store/userStore';

// Types
import { RootStackParamList } from './src/types';

// Constants
import { colors } from './src/constants/theme';

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
      <StatusBar style="light" backgroundColor="transparent" translucent />
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
        // Load fonts
        await Font.loadAsync({
          'Work-Sans': require('./assets/fonts/Work_Sans/static/WorkSans-Regular.ttf'),
          'Work-Sans-Bold': require('./assets/fonts/Work_Sans/static/WorkSans-Bold.ttf'),
          'Work-Sans-SemiBold': require('./assets/fonts/Work_Sans/static/WorkSans-SemiBold.ttf'),
          'Work-Sans-Medium': require('./assets/fonts/Work_Sans/static/WorkSans-Medium.ttf'),
          'Work-Sans-Light': require('./assets/fonts/Work_Sans/static/WorkSans-Light.ttf'),
        });
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
          <ToastProvider>
            <View style={styles.container} onLayout={onLayoutRootView}>
              <Navigation />
            </View>
          </ToastProvider>
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
