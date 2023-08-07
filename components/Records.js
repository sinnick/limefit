import { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, ImageBackground, Modal } from 'react-native';
import UserBadge from './UserBadge';
import UserContext from '../context/UserContext';
import RecordsContext from '../context/RecordsContext';
import { URL_API } from '../config';

const Records = ({ navigation }) => {
    const { user, setUser } = useContext(UserContext);
    const { records, setRecords } = useContext(RecordsContext);
    const dni = user.DNI;
    const [modalVisible, setModalVisible] = useState(false);


    console.log({ records });

    return (
        <View style={styles.container}>
            {/* <ImageBackground source={require('../assets/chalk.jpg')} style={styles.background}> */}
                <UserBadge />
                <Text style={styles.titulo_Records}>
                    Personal Records
                </Text>
                <TouchableOpacity style={styles.nuevo_record} onclick={() => navigation.navigate('NuevoRecord')}>
                    <Text style={{ fontSize: 30 }}>
                        nuevo record
                    </Text>
                    {/*                     
                    <Modal visible={modalVisible}>
                        <View style={styles.modal_container}>
                            <View style={styles.modal_detalles}>
                                <Text style={styles.modal_detalles_titulo}>Instrucciones: </Text>
                                <Text style={styles.modal_detalles_descripcion}>{ejercicio.instructions}</Text>
                                <TouchableOpacity onPress={() => { setModalVisible(!modalVisible) }} style={styles.modal_boton_cerrar}>
                                    <Text>
                                        OK
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal> */}

                </TouchableOpacity>
                <ScrollView style={styles.scrollView}>
                    {records.map((record, index) => {
                        console.log({record});
                        return (
                            <TouchableOpacity style={styles.card}>
                                <Text style={styles.texto_Records_derecha}>
                                    <Image source={require('../assets/clock.png')} style={styles.clock} />
                                    {record.FECHA.substring(0, 10)}
                                </Text>
                                <Text style={styles.texto_Records}>
                                    {`${record.EJERCICIO}, ${record.PESO} kg`}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            {/* </ImageBackground> */}
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
    titulo_Records: {
        color: '#fff',
        alignSelf: 'flex-start',
        fontSize: 30,
        marginLeft: 50,
        marginTop: 20,
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
    texto_Records: {
        fontSize: 20,
        color: '#adfa1d',
        alignSelf: 'flex-start',
        position: 'absolute',
        left: 20,
    },
    texto_Records_derecha: {
        color: '#adfa1d',
        alignSelf: 'flex-end',
        justifyContent: 'flex-start',
        alignItems: 'center',
        position: 'absolute',
        right: 20,
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
    nuevo_record: {
        backgroundColor: '#adfa1d',
        padding: 5,
        fontSize: 20,
        borderRadius: 5,
        marginTop: 20,
    },
})

export default Records