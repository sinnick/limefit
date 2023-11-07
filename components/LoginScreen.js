import { useState, useContext } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, ActivityIndicator, ImageBackground, Alert } from 'react-native';
import UserContext from '../context/UserContext';
import { useFonts } from 'expo-font';
import { URL_API } from '../config';

const LoginScreen = ({ navigation }) => {
    const [fontsLoaded] = useFonts({
        'Work-Sans': require('../assets/fonts/Work_Sans/WorkSans-VariableFont_wght.ttf'),
    });
    const { user, setUser } = useContext(UserContext);
    const [dni, setDNI] = useState('37002007');
    const [isLoading, setIsLoading] = useState(false);
    console.log(`user, setUser `, user, setUser);

    const handleLogin = async () => {
        // que the button is pressed, show a spinner, indicating that the app is loading
        // when the fetch is done, hide the spinner
        // if the fetch fails, show an error message
        // if the fetch succeeds, navigate to the next screen
        if (!dni) {
            Alert.alert('Ingrese su DNI');
            return;
        }
        setIsLoading(true);


        console.log('username: ', dni);
        try {
            const respuesta = await fetch(`${URL_API}/login`, {
                method: 'POST',
                body: JSON.stringify({ dni: dni }),
                timeout: 5000,
            })
            if (!respuesta) {
                setIsLoading(false);
                Alert.alert('Error de login');
                return;
            }
            if (respuesta.status !== 200) { 
                setIsLoading(false);
                Alert.alert('Error de login, estado:' + respuesta.status);
                return;
            }
            console.log({ respuesta });
            const json = await respuesta.json();
            const usuario = json.user;
            if (!usuario) {
                setIsLoading(false);
                Alert.alert('Usuario no encontrado');
                return;
            }
            setIsLoading(false);
            console.log('usuario: ', usuario);
            setUser(usuario);
            navigation.navigate('Rutinas');
        } catch (error) {
            console.error('error ', error);
            setIsLoading(false);
            // Alert.alert('Error de login', error);
        }
        console.log('handleLogin');
    };

    return (
        <UserContext.Provider value={{ user, setUser }}>
            <View style={styles.container}>
                <ImageBackground style={styles.background} source={require('../assets/bg-2.jpg')} >
                        {isLoading && <ActivityIndicator size="large" color="#adfa1d" style={styles.activity} />}
                        <View style={styles.logoContainer}>
                            <View style={styles.view_titulo_logo}>
                                <Text style={styles.text_titulo_logo} >L I M E F I T</Text>
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
        height: 55,
        borderColor: '#fff',
        color: '#fff',
        fontSize: 18,
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#adfa1d',
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
        color: '#adfa1d',
        fontFamily: 'Work-Sans',
        fontSize: 50,
        fontWeight: '900',
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
    },
    activity: {
        flex: 1,
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: '#fff',
    },
});

export default LoginScreen;
