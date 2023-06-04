import React, {useState, useEffect, useContext} from 'react';
import { View, StyleSheet, Text,  ScrollView, TouchableOpacity } from 'react-native';
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
        const respuesta = await fetch('http://sinnick.duckdns.org:3000/api/rutinas');
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
          <Text style={styles.texto_rutinas}>
            RUTINAS    →
          </Text>
        </TouchableOpacity>

      </ScrollView>
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
    textAlign: 'center',
    backgroundColor: '#fff1',
    width: '70%',
    height: 70,
    alignSelf: 'center',
    minWidth: 200,
    marginVertical: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto_rutinas: {
    color: '#adfa1d',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff2',
    alignContent: 'center',
  },
});

export default Inicio;