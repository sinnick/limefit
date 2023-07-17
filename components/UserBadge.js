import { View, Text, Image, StyleSheet } from "react-native"
import { useContext } from "react"
import UserContext from "../context/UserContext"

const UserBadge = () => {
    const { user, setUser } = useContext(UserContext)
    console.log('UserBadge', { user });
    return (
        <View style={styles.cardUsuario}>
            <View style={styles.containerImagen}>
                <Image
                    source={user.FOTO ? { uri: user.FOTO } : require('../assets/clock.png')}
                    style={styles.imagePerfil} />
            </View>
            <View style={styles.view_texto_usuario}>
                <Text style={styles.texto_usuario} >
                    {user.SEXO == 'M' ? 'Bienvenida, ' : 'Bienvenido, '}
                    {user.NOMBRE || 'Nombre Generico'}
                </Text>
            </View>
        </View>
    )
}

export default UserBadge

const styles = StyleSheet.create({
    cardUsuario: {
        marginTop: 65,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#adfa1d',
        height: 40,
        width: '85%',
        marginHorizontal: 20,
        marginVertical: 10,
        borderRadius: 50,
    },
    imagePerfil: {
        borderRadius: 100,
        width: 40,
        height: '100%',
        backgroundColor: '#ccc',
        resizeMode: 'contain',
    },
    dividerImagen: {
        height: '100%',
        width: 5,
        color: '#000',
        backgroundColor: '#000',
        margin: 0
    },
    view_texto_usuario: {
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
        height: '90%',
        width: '100%',
    },
    texto_usuario: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'center',
        textAlign: 'center',
        justifyContent: 'center',
        width: '100%',
        marginRight: 50,
    },
    texto_usuario_detalles: {
        marginVertical: 5,
        color: '#000',
        marginLeft: 10,
        alignSelf: 'flex-start',
        textAlign: 'left',
        width: '65%',
    },
    containerImagen: {
        borderWidth: 5,
        marginLeft: -1,
        marginTop: -5,
        marginBottom: -5,
        borderRightColor: '#000',
        borderRadius: 100,
    }
})