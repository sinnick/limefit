import { useState, useContext } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Image, ImageBackground, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserContext from '../context/UserContext';



const LoginScreen = ({navigation}) => {
    const { user, setUser } = useContext(UserContext);
    //! and this
    const [ dni, setDNI ] = useState('37002007');
    console.log(`user, setUser `, user, setUser);

    const handleLogin = async () => {
        console.log('username: ', dni);
        try {
            const respuesta = await fetch('http://sinnick.duckdns.org:3000/api/login', {
                method: 'POST',
                body: JSON.stringify({ dni: dni }),
            })
            console.log({respuesta});
            const json = await respuesta.json();
            const usuario = json.user;
            if (!usuario) {
                Alert.alert('Usuario no encontrado');
                return;
            }
            console.log('usuario: ', usuario);
            setUser(usuario);
            
            AsyncStorage.setItem('user', JSON.stringify(usuario));
            navigation.navigate('Inicio');
        } catch (error) {
            console.error('error ', error);
        }
        console.log('handleLogin');
    };

    return (
        <UserContext.Provider value={{ user, setUser }}>
            <View style={styles.container}>
                <ImageBackground style={styles.background} source={require('../assets/bg-lime.jpg')} >
                    <View style={styles.logoContainer}>
                        <View style={styles.view_titulo_logo}>
                            <Text style={styles.text_titulo_logo}>L I M E F I T</Text>
                        </View>
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu DNI"
                            placeholderTextColor={'#fff8'}
                            onChangeText={text => setDNI(text)}
                            value={dni}
                        />
                        <TouchableOpacity style={styles.button} onPress={handleLogin}>
                            <Text style={styles.buttonText}>Login
                                {/* <View style={styles.login_arrow}>
                            <Text style={styles.text_login_arrow}>→</Text>
                        </View> */}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ImageBackground>
            </View>
        </UserContext.Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#101010',
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
        marginTop: 100,
        backgroundColor: 'transparent',
        // backgroundColor: '#4F6367',
        width: '100%',
        alignContent: 'center',
        justifyContent: 'space-between',
    },
    logo: {
        alignSelf: 'center',
        width: 300,
        height: 300,
        resizeMode: 'contain',
    },
    inputContainer: {
        flex: 1,
        marginTop: 1,
        width: '80%',
    },
    input: {
        height: 40,
        borderColor: '#fff',
        color: '#fff',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#C2E000',
        paddingVertical: 15,
        borderRadius: 5,
    },
    buttonText: {
        color: '#101010',
        textAlign: 'center',
        fontWeight: 'bold',
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
    },
    view_titulo_logo: {
        backgroundColor: 'transparent',
        width: '100%',
        // height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text_titulo_logo: {
        alignContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        color: '#C2E000',
        fontSize: 40,
        fontWeight: 'bold',
    },
    login_arrow: {
        marginBottom: 10,
        borderColor: '#000',
        borderWidth: 1,
        borderRadius: 50,
        marginLeft: 200,
        justifyContent: 'center',
        alignContent: 'center',
    },
    text_login_arrow: {
        color: '#000',
        fontSize: 20,
        fontWeight: 'bold',
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
     background: {
        flex: 1,
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        justifyContent: 'center',
        alignItems: 'center',
     }
});

export default LoginScreen;
