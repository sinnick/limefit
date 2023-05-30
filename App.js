import LoginScreen from './components/LoginScreen';
import Inicio from './components/Inicio';
import { useState } from 'react';
import UserContext from './context/UserContext';

//react navigation 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function App() {
  const { user, setUser } = useState({});
  //! check this
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: true }}
          initialRouteName="Login">
           {/* initialRouteName="Inicio"> */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Inicio" component={Inicio} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserContext.Provider>
  );
}