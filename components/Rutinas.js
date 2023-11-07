import { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, ImageBackground } from 'react-native';
import UserBadge from './UserBadge';
import UserContext from '../context/UserContext';
import RutinasContext from '../context/RutinasContext';
import { FlatList } from 'react-native';
import { URL_API } from '../config';

const Rutinas = ({ navigation }) => {
    const { user, setUser } = useContext(UserContext);
    const { rutinas, setRutinas } = useContext(RutinasContext);

    const getRutinas = async () => {
        try {
            const respuesta = await fetch(`${URL_API}/rutinas`);
            const json = await respuesta.json();
            setRutinas(json.result_rutinas);
        } catch (error) {
            console.error('error ', error);
        }
    }

    useEffect(() => {
        getRutinas();
    }, []);

    console.log({ rutinas });

    return (
        <View style={styles.container}>
            <UserBadge />
            <View style={styles.viewLista}>
            <Text style={styles.titulo_rutinas}>Rutinas</Text>
                <FlatList
                    data={rutinas}
                    numColumns={2} // Set the number of columns to 2
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => navigation.navigate('Rutina', { rutina: item })}
                        >
                            <Text style={styles.texto_rutinas}>{`${item.NOMBRE}`}</Text>
                            {item.DIAS.map((dia, index) => (
                                <Text key={index} style={styles.detalle_rutinas}>{`${dia.day}`}</Text>
                            ))}
                        </TouchableOpacity>
                    )}
                />

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 0,
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#adfa1d',
    },
    titulo_rutinas: {
        color: '#252525',
        alignSelf: 'flex-start',
        fontSize: 35,
    },
    card: {
        backgroundColor: '#74a814',
        width: '42%', // Adjust the width as needed
        height: 225,   // Adjust the height as needed
        margin: 15, // Add a small margin to separate the cards
        padding: 16,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        borderColor: '#000',
        borderWidth: 4,
        borderRadius: 20,
    },
    texto_rutinas: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#252525',
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    viewLista: {
        margin: 20,
        padding: 16,
        flex: 1,
        marginTop: 10,
        width: '100%',
        alignContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    detalle_rutinas: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#252525',
        alignSelf: 'flex-start',
    },
});

export default Rutinas;
