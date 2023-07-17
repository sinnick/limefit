import LoginScreen from './components/LoginScreen';
import Inicio from './components/Inicio';
import Rutinas from './components/Rutinas';
import Records from './components/Records';
import Rutina from './components/Rutina';
import { useState } from 'react';
//url api
import { URL_API } from './config';
//context
import UserContext from './context/UserContext';
import RutinasContext from './context/RutinasContext';
import RecordsContext from './context/RecordsContext';
//react navigation 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function App() {
  const [ user, setUser ]  = useState({});
  const [ rutinas, setRutinas ] = useState([]);
  const [ records, setRecords ] = useState([]);
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
    <RutinasContext.Provider value={{ rutinas, setRutinas }}>
    <RecordsContext.Provider value={{records, setRecords}}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="Login"
          // initialRouteName="Records" 
          // initialRouteName="Inicio"
          // initialRouteName="Rutinas"
          >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Inicio" component={Inicio} />
          <Stack.Screen name="Rutinas" component={Rutinas} />
          <Stack.Screen name="Records" component={Records} />
          <Stack.Screen name="Rutina" component={Rutina} />
        </Stack.Navigator>
      </NavigationContainer>
    </RecordsContext.Provider>
    </RutinasContext.Provider>
    </UserContext.Provider>
  );
}