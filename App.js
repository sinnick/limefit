import { StyleSheet, Text, View } from 'react-native';
import LoginScreen from './components/LoginScreen';
import Inicio from './components/Inicio';

//react navigation 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="Login">
          {/* initialRouteName="Inicio"> */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Inicio" component={Inicio} />
        </Stack.Navigator>
      </NavigationContainer>
  );
}