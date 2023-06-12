import { View, Text, Image, StyleSheet } from "react-native"
import { useContext } from "react"
import UserContext from "../context/UserContext"

const UserBadge = () => {
    const { user, setUser } = useContext(UserContext)
    console.log('UserBadge', {user});
    return (
        <View style={styles.cardUsuario}>
            <Image
                source={user.FOTO ? { uri: user.FOTO } : require('../assets/user.png')}
                style={styles.imagePerfil} />
            <View style={styles.dividerImagen}></View>
            <View style={styles.view_texto_usuario}>
                <Text style={styles.texto_usuario} >
                    {user.SEXO == 'H' ? 'Bienvenido, ' : 'Bienvenida, '}
                    {user.NOMBRE || ''}
                </Text>
                <Text style={styles.texto_usuario_detalles} adjustsFontSizeToFit={true}>
                    Aca van mas detalles chotos y quizas algun logo 🏋
                </Text>
            </View>
        </View>
    )
}

export default UserBadge

const styles = StyleSheet.create({
    cardUsuario: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#adfa1d',
        maxHeight: 70,
        width: '85%',
        marginHorizontal: 20,
        marginVertical: 10,
        borderRadius: 5,
    },
    imagePerfil: {
        borderTopLeftRadius: 5,
        borderBottomLeftRadius: 5,
        width: '20%',
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
        justifyContent: 'flex-start',
        alignContent: 'flex-start',
        alignItems: 'flex-start',
        height: '90%',
        width: '100%',
    },
    texto_usuario: {
        color: '#000',
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 10,
        alignSelf: 'flex-start',
        width: '90%',
    },
    texto_usuario_detalles: {
        marginVertical: 5,
        color: '#000',
        marginLeft: 10,
        alignSelf: 'flex-start',
        textAlign: 'left',
        width: '65%',
    },
})