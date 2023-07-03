import React, {useState, useEffect, useContext} from 'react';
import { View, StyleSheet, Text,  ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import UserBadge from './UserBadge';
import UserContext from '../context/UserContext';
import RutinasContext from '../context/RutinasContext';

const Inicio = ({navigation}) => {
  const { user, setUser } = useContext(UserContext);
  const { rutinas, setRutinas } = useContext(RutinasContext);
  const [visible, setVisible] = useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  
  const getRutinas = async () => {
    try {
        const respuesta = await fetch('http://sinnick-u.duckdns.org:3000/api/rutinas');
        const json = await respuesta.json();
        console.log({ json });
        setRutinas(json.result_rutinas);
    } catch (error) {
        console.error('error ', error);
    }
}

useEffect(() => {
    getRutinas();
}, []);

  return (
    <View style={styles.container}>
      <UserBadge />
      <ScrollView style={styles.scrollView}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Rutinas')}>
          <View style={styles.card_image_container}>
          <ImageBackground source={require('../assets/bg-rutinas.jpg')} style={styles.image_bg_cards}
            imageStyle={{ borderRadius: 20}}
            >
          </ImageBackground>
          </View>
          <Text style={styles.texto_rutinas}>
            RUTINAS    →
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Rutinas')}>
          <View style={styles.card_image_container}>
          <ImageBackground source={require('../assets/bg-suplementos.jpg')} style={styles.image_bg_cards}
            imageStyle={{ borderRadius: 20}}
            >
          </ImageBackground>
          </View>
          <Text style={styles.texto_rutinas}>
            SUMPLEMENTOS    →
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Rutinas')}>
          <View style={styles.card_image_container}>
          <ImageBackground source={require('../assets/bg-food.jpg')} style={styles.image_bg_cards}
            imageStyle={{ borderRadius: 20}}
            >
          </ImageBackground>
          </View>
          <Text style={styles.texto_rutinas}>
            COMIDAS    →
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Rutinas')}>
          <View style={styles.card_image_container}>
          <ImageBackground source={require('../assets/bg-sleep.jpg')} style={styles.image_bg_cards}
            imageStyle={{ borderRadius: 20}}
            >
          </ImageBackground>
          </View>
          <Text style={styles.texto_rutinas}>
            SUEÑO    →
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Rutinas')}>
          <View style={styles.card_image_container}>
          <ImageBackground source={require('../assets/bg-metas.jpg')} style={styles.image_bg_cards}
            imageStyle={{ borderRadius: 20}}
            >
          </ImageBackground>
          </View>
          <Text style={styles.texto_rutinas}>
            METAS    →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#101010',
  },
  buttonText: {
    textAlign: 'center',
    color: '#7d1539',
    fontSize: 18,
    fontWeight: 'bold',
  },
  texto: {
    color: '#000',
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
  card: {
    opacity: 1,
    backgroundColor: '#fff1',
    width: '70%',
    height: 70,
    alignSelf: 'center',
    minWidth: 200,
    marginVertical: 20,
    borderRadius: 20,
    alignContent: 'flex-start',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  texto_rutinas: {
    opacity: 1,
    color: '#adfa1d',
    fontSize: 30,
    fontWeight: 'bold',
    paddingLeft: 10,
  },
  scrollView: {
    flex: 1,
    width: '100%',
    backgroundColor: '#101010',
    alignContent: 'center',
  },
  image_bg_cards: {
    justifyContent: 'center',
    opacity: 0.3,
    width: '100%',
    height: '100%',
  },
  card_image_container: {
    width: '100%',
    height: '100%',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    resizeMode: 'cover',
    position: 'absolute',
  }
});

export default Inicio;