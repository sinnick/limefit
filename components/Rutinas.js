import { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, ImageBackground } from 'react-native';
import UserBadge from './UserBadge';
import UserContext from '../context/UserContext';
import RutinasContext from '../context/RutinasContext';
import { FlatList } from 'react-native-web';


const Rutinas = ({ navigation }) => {
    const { user, setUser } = useContext(UserContext);
    const { rutinas, setRutinas } = useContext(RutinasContext);
    
    console.log({ rutinas });

    return (
        <View style={styles.container}>
            <ImageBackground source={require('../assets/chalk.jpg')} style={styles.background}>
                <UserBadge />
                <ScrollView style={styles.scrollView}>
                    <Text style={styles.titulo_rutinas}>
                        Rutinas
                    </Text>
                    {rutinas.map((rutina, index) => {
                        return (
                            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Rutina', { rutina })}>
                                <Text style={styles.texto_rutinas_derecha}>
                                    <Image source={require('../assets/clock.png')} style={styles.clock} />
                                    {rutina.DURACION}
                                </Text>
                                <Text style={styles.texto_rutinas}>
                                    {`${rutina.NOMBRE}`}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </ImageBackground>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 0,
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#101010',
    },
    titulo_rutinas: {
        color: '#fff',
        alignSelf: 'flex-start',
        fontSize: 30,
    },
    card: {
        textAlign: 'center',
        backgroundColor: '#121212',
        width: '100%',
        height: 70,
        alignSelf: 'center',
        minWidth: 200,
        marginVertical: 8,
        paddingHorizontal: 20,
        // paddingVertical: 10,
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: .5,
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
        width: '85%',
        alignContent: 'center',
    },
    texto_rutinas: {
        fontSize: 20,
        color: '#adfa1d',
        alignSelf: 'flex-start',
    },
    texto_rutinas_derecha: {
        color: '#adfa1d',
        alignSelf: 'flex-end',
        justifyContent: 'flex-start',
        
    },
    clock: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
        tintColor: '#fff',
    },
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        justifyContent: 'center',
        alignItems: 'center',
    },
})

export default Rutinas