import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text, Image, ImageBackground } from 'react-native';

const LoginScreen = () => {
    const [username, setUsername] = useState('');

    const handleLogin = () => {
        // Perform login logic here
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
            <View style={styles.view_titulo_logo}>
                <Text style={styles.text_titulo_logo}>L I M E F I T</Text>
            </View>
                <ImageBackground style={styles.logo} source={require('../assets/bg-fit.png')} >
                </ImageBackground>
            </View>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Ingresa tu DNI"
                    placeholderTextColor={'#fff8'}
                    onChangeText={text => setUsername(text)}
                    value={username}
                />
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: '#4F6367',
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
        borderColor: '#ccc',
        color: '#fff',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#C2E000',
        paddingVertical: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: '#4F6367',
        textAlign: 'center',
        fontWeight: 'bold',
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
});

export default LoginScreen;
