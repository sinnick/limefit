import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState, useEffect} from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import UserBadge from './UserBadge';

const Inicio = ({navigation}) => {
  const [visible, setVisible] = useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  
  useEffect(() => {
    async function getUsuario() {
      console.log('getting user data..');
      let respuesta;
      try {
        let temp_user = await AsyncStorage.getItem('user');
        console.log('temp_user: ', temp_user);
        setUser(JSON.parse(temp_user))
        // let token = await AsyncStorage.getItem('token');
        // console.log('token: ', token);
        // let data = JSON.stringify({
        //   "token": token,
        // });
  
        // let config = {
        //   method: 'post',
        //   maxBodyLength: Infinity,
        //   url: `http://apps.visionblo.fer/rb/app/api/ConsultarDatosSesion`,
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   data: data
        // };
        // respuesta = await axios.request(config);
        // setChofer(`Bienvenido, \n${respuesta.data.contacto.nombre}`);
        // AsyncStorage.setItem('contacto', JSON.stringify(respuesta.data.contacto));
        
      } catch (error) {
        console.log('error al obtener el chofer', error);
      }
    }
    getUsuario();
  }, []);
  
  const scanQR = () => {
    navigation.navigate('Scanner');
  };
  const Salir = () => {
    AsyncStorage.removeItem('token');
    AsyncStorage.removeItem('movil_id');
    AsyncStorage.removeItem('contacto');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <UserBadge />
      <View style={styles.titulo_rutinas}>
        <Text style={styles.texto_rutinas}>
          Rutinas
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#101010',
  },
  button: {
    textAlign: 'center',
    backgroundColor: '#fff',
    minWidth: 200,
    marginVertical: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    textAlign: 'center',
    color: '#7d1539',
    fontSize: 18,
    fontWeight: 'bold',
  },
  texto: {
    color: '#000',
    // marginBottom: 200,
    lineHeight: 25,
    marginLeft: 'auto',
    marginRight: 'auto',
    fontSize: 20,
  },
  image: {
    flex: 1,
    justifyContent: 'center',
  },
  cardUsuario: {
    flexDirection: 'row',
    backgroundColor: '#c2e000',
    maxHeight: 100,
    width: '80%',
    marginHorizontal: 20,
    marginVertical: 50,
    paddingVertical: 10,
    borderRadius: 5,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 200
  },
  titulo_rutinas: {
    flex: .2,
    width: '100%',
    backgroundColor: '#fff1',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  texto_rutinas: {
    color: '#fff',
  }
});

export default Inicio;