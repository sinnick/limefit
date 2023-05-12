import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState, useEffect} from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import axios from 'axios';

const Inicio = ({navigation}) => {
  const [chofer, setChofer] = useState('Bienvenido,  ');
  const [visible, setVisible] = useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  
  useEffect(() => {
    async function getChofer() {
      console.log('handlechofer');
      let respuesta;
      try {
  
        let token = await AsyncStorage.getItem('token');
        console.log('token: ', token);
        let data = JSON.stringify({
          "token": token,
        });
  
        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: `http://apps.visionblo.fer/rb/app/api/ConsultarDatosSesion`,
          headers: {
            'Content-Type': 'application/json',
          },
          data: data
        };
        respuesta = await axios.request(config);
        setChofer(`Bienvenido, \n${respuesta.data.contacto.nombre}`);
        AsyncStorage.setItem('contacto', JSON.stringify(respuesta.data.contacto));
      } catch (error) {
        console.log('error al obtener el chofer', error);
      }
    }
    getChofer();
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
      <View style={styles.cardUsuario}>
        <Image style={styles.imagePerfil} />
        <View style={styles.dividerImagen}></View>
        <View style={styles.view_texto_usuario}>
          <Text style={styles.texto_usuario}>
            Fernando Masso
          </Text>
          <Text style={styles.texto_usuario_detalles} adjustsFontSizeToFit={true}>
            Aca van mas detalles chotos y quizas algun logo 🏋
          </Text>
        </View>
      </View>
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
  imagePerfil: {
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    width: 100,
    height: 100,
    backgroundColor: '#ccc',
  },
  dividerImagen: {
    height: 100,
    width: 5,
    color: '#000',
    backgroundColor: '#000',
    margin: 0
  },
  view_texto_usuario: {
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    alignItems: 'flex-start',
    height: '90%',
    width: '100%',
  },
  texto_usuario: { 
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 10,
    alignSelf: 'flex-start',
    textAlign: 'left',
    width: '90%',
  },
  texto_usuario_detalles: {
    marginTop: 5,
    color: '#000',
    marginLeft: 10,
    alignSelf: 'flex-start',
    textAlign: 'left',
    width: '65%',
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