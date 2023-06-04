import { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import UserBadge from './UserBadge';
import UserContext from '../context/UserContext';
import RutinasContext from '../context/RutinasContext';
import { FlatList } from 'react-native-web';


const Rutinas = ({ navigation }) => {
    const { user, setUser } = useContext(UserContext);
    const { rutinas, setRutinas } = useContext(RutinasContext);
    console.log({ rutinas });

    // const getRutinas = async () => {
    //     try {
    //         const respuesta = await fetch('http://sinnick.duckdns.org:3000/api/rutinas');
    //         const json = await respuesta.json();
    //         console.log({ json });
    //         setRutinas(json.result_rutinas);
    //     } catch (error) {
    //         console.error('error ', error);
    //     }
    // }

    // useEffect(() => {
    //     getRutinas();
    // }, []);


    return (
        <View style={styles.container}>
            <UserBadge />
            <ScrollView style={styles.scrollView}>
                <Text style={{color: '#fff', alignSelf: 'center'}}>
                    Rutinas
                </Text>
                {rutinas.map((rutina, index) => {
                    return(
                        <TouchableOpacity style={styles.card} >
                            <Text style={styles.texto_rutinas}>
                                {`${rutina.NOMBRE} - ${rutina.NIVEL} \n${rutina.DESCRIPCION}`}
                            </Text>
                            <Text style={styles.texto_rutinas_derecha}>
                                {`🕑 ${rutina.DURACION}`}
                            </Text>
                            
                                
                        </TouchableOpacity>
                    )
                    // <View>
                    // </View>
                })}
            </ScrollView>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        marginTop: 30,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#101010',
    },
    card: {
        textAlign: 'center',
        backgroundColor: '#fff1',
        width: '70%',
        height: 90,
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
    scrollView: {
        flex: 1,
        width: '100%',
        alignContent: 'center',
    },
    texto_rutinas: {
        color: '#adfa1d',
        alignSelf: 'flex-start',
    },
    texto_rutinas_derecha: {
        color: '#adfa1d',
        alignSelf: 'flex-end',
    },
})

export default Rutinas