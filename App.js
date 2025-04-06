import LoginScreen from './components/LoginScreen';
import Rutinas from './components/Rutinas';
import Records from './components/Records';
import Rutina from './components/Rutina';
import { useState, useCallback, useEffect } from 'react';
//url api
import { URL_API } from './config';
//context
import UserContext from './context/UserContext';
import RutinasContext from './context/RutinasContext';
import RecordsContext from './context/RecordsContext';
//react navigation 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Inicio from './components/Inicio';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { View } from 'react-native';

// Mantener visible la pantalla de splash hasta que se carguen las fuentes
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
	const [user, setUser] = useState({});
	const [rutinas, setRutinas] = useState([]);
	const [records, setRecords] = useState([]);
	const [appIsReady, setAppIsReady] = useState(false);

	useEffect(() => {
		async function prepare() {
			try {
				// Cargamos las fuentes
				await Font.loadAsync({
					'Work-Sans': require('./assets/fonts/Work_Sans/static/WorkSans-Regular.ttf'),
					'Work-Sans-Bold': require('./assets/fonts/Work_Sans/static/WorkSans-Bold.ttf'),
					'Work-Sans-SemiBold': require('./assets/fonts/Work_Sans/static/WorkSans-SemiBold.ttf'),
					'Work-Sans-Medium': require('./assets/fonts/Work_Sans/static/WorkSans-Medium.ttf'),
					'Work-Sans-Light': require('./assets/fonts/Work_Sans/static/WorkSans-Light.ttf'),
				});
			} catch (e) {
				console.warn(e);
			} finally {
				// Marcamos la app como lista
				setAppIsReady(true);
			}
		}

		prepare();
	}, []);

	const onLayoutRootView = useCallback(async () => {
		if (appIsReady) {
			// Esto oculta la pantalla de splash una vez que se cargaron las fuentes
			await SplashScreen.hideAsync();
		}
	}, [appIsReady]);

	if (!appIsReady) {
		return null;
	}

	return (
		<SafeAreaProvider>
			<View style={{ flex: 1 }} onLayout={onLayoutRootView}>
				<UserContext.Provider value={{ user, setUser }}>
					<RutinasContext.Provider value={{ rutinas, setRutinas }}>
						<RecordsContext.Provider value={{ records, setRecords }}>
							<NavigationContainer>
								<StatusBar style="light" backgroundColor="transparent" />
								{!user.DNI ? (
									// Stack de autenticación - no se puede volver atrás una vez autenticado
									<Stack.Navigator
										screenOptions={{ headerShown: false }}
										initialRouteName="Login"
									>
										<Stack.Screen name="Login" component={LoginScreen} />
									</Stack.Navigator>
								) : (
									// Stack principal de la aplicación - solo accesible después de autenticarse
									<Stack.Navigator
										screenOptions={{ headerShown: false }}
										initialRouteName="Inicio"
									>
										<Stack.Screen name="Inicio" component={Inicio} />
										<Stack.Screen name="Rutinas" component={Rutinas} />
										<Stack.Screen name="Records" component={Records} />
										<Stack.Screen name="Rutina" component={Rutina} />
									</Stack.Navigator>
								)}
							</NavigationContainer>
						</RecordsContext.Provider>
					</RutinasContext.Provider>
				</UserContext.Provider>
			</View>
		</SafeAreaProvider>
	);
}