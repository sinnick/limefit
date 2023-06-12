import LoginScreen from './components/LoginScreen';
import Inicio from './components/Inicio';
import Rutinas from './components/Rutinas';
import Rutina from './components/Rutina';
import { useState } from 'react';
//context
import UserContext from './context/UserContext';
import RutinasContext from './context/RutinasContext';
//react navigation 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function App() {
  const [ user, setUser ]  = useState({});
  const [ rutinas, setRutinas ] = useState([]);
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
    <RutinasContext.Provider value={{ rutinas, setRutinas }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: true }}
          initialRouteName="Login">
           {/* initialRouteName="Rutina"> */}
          {/* initialRouteName="Inicio"> */}
          {/* initialRouteName="Rutinas"> */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Inicio" component={Inicio} />
          <Stack.Screen name="Rutinas" component={Rutinas} />
          <Stack.Screen name="Rutina" component={Rutina} />
        </Stack.Navigator>
      </NavigationContainer>
    </RutinasContext.Provider>
    </UserContext.Provider>
  );
}