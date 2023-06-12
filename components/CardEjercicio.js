import { useState } from 'react'
import {Text, View, StyleSheet, Modal, Image, TouchableOpacity, ScrollView, Alert, Button} from 'react-native'
import Checkbox from 'expo-checkbox';

const CardEjercicio = ({ejercicio, index}) => {
 
    let [checked, setChecked] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    return(
        <TouchableOpacity style={styles.card_ejercicio} key={index}>
            <View style={{width: '70%'}}>
                <Text style={styles.ejercicio_nombre}>
                    {ejercicio.name}
                </Text>
                <Text style={styles.ejercicio_sets}>
                    Sets: {ejercicio.sets}  reps: {ejercicio.reps}
                </Text>
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
                </Modal>
            </View>
            <TouchableOpacity style={styles.boton_derecha} onPress={() => {setModalVisible(!modalVisible)}}>
                <Image source={require('../assets/help.png')} style={[styles.icon, {width: 30, height: 30}]} />
            </TouchableOpacity>
            <View style={[styles.boton_derecha, {borderTopRightRadius: 8, borderBottomRightRadius: 8}]}>
                <Checkbox
                    value={checked}
                    onValueChange={() => {
                        console.log('checked', checked);
                        setChecked(!checked)
                    }}
                    style={checked ? styles.checkbox_checked : styles.checkbox_unchecked}
                    color={checked ? '#adfa1dcc' : '#fff' }
                />
            </View>
        </TouchableOpacity>
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
    },
    checkbox_checked: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 2,
        borderWidth: 2,
        color: 'red',
    },
    checkbox_unchecked: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        borderWidth: 2,
    },
    modal_container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#101010',
        
    },
    modal_detalles: {
        width: '90%',
        color: '#101010',
        backgroundColor: '#adfa1dcc',
        padding: 12,
        alignSelf: 'center',
        borderRadius: 8,
        justifyContent: 'center',
    },
    modal_detalles_titulo: {
        color: '#101010',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modal_detalles_descripcion: {
        color: '#101010',
        fontSize: 15,
    },
    modal_boton_cerrar: {
        marginTop: 20,
        alignSelf: 'flex-end',
        borderWidth: 2,
        borderRadius: 8,
        width: 50,
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#101010',
        fontSize: 15,
        padding: 8,
    }
        
})

export default CardEjercicio