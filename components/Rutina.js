import { useState } from 'react';
import {Text, View, StyleSheet, ImageBackground, Image, TextInput, TouchableOpacity, ScrollView} from 'react-native'
import UserBadge from './UserBadge';
import CardEjercicio from './CardEjercicio';

const Rutina = ({route, navigation}) => {
    console.log({route});
    console.log({navigation});
  return (
    <View style={styles.container}>
            <UserBadge />
    <View>
        <Text style={styles.rutina_nombre}>
            {route.params.rutina.NOMBRE}
        </Text>
        <Text style={styles.rutina_duracion}>
            <Image source={require('../assets/clock.png')} style={[styles.icon, {width: 20, height: 20}]} />
            {route.params.rutina.DURACION}
        </Text>
    </View>
    <ScrollView style={styles.scrollView}>
        {route.params.rutina.EJERCICIOS.map((ejercicio, index) => {
            return(
                <CardEjercicio ejercicio={ejercicio} index={index} key={index}/>
            )
        })}
    </ScrollView>
        
        
    </View>
  )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#101010',
    },
    scrollView: {
        flex: 1,
        width: '85%',
        alignContent: 'center',
    },
    card_ejercicio: {
        flexDirection: 'row',
        textAlign: 'center',
        backgroundColor: '#121212',
        width: '100%',
        height: 70,
        alignSelf: 'center',
        minWidth: 200,
        marginVertical: 8,
        paddingHorizontal: 20,
        paddingRight: 0,
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: .5,
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rutina_nombre: {
        color: '#fff',
        alignSelf: 'flex-start',
        fontSize: 30,
    },
    rutina_duracion: {
        color: '#fff',
        alignSelf: 'center',
        fontSize: 20,
    },
    icon: {
        resizeMode: 'contain',
        tintColor: '#fff',
    },
    ejercicio_nombre: {
        color: '#fff',
        alignSelf: 'flex-start',
        fontSize: 20,
    },
    ejercicio_sets: {
        color: '#fff',
        alignSelf: 'flex-start',
        fontSize: 15,
    },
    boton_derecha: {
        width: '15%',
        // backgroundColor: '#ccc',
        height: '100%',
        alignContent: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    }
})

export default Rutina