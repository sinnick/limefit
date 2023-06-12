import { useState } from 'react';
import {Text, View, StyleSheet, ImageBackground, Image, TextInput, TouchableOpacity, ScrollView} from 'react-native'
import UserBadge from './UserBadge';
import CardEjercicio from './CardEjercicio';

const Rutina = ({route, navigation}) => {
// const Rutina = ({ navigation}) => {
//     let route = {
//             "key": "Rutina-2IQo7aZkTsQFT3Hb1bS0f",
//             "name": "Rutina",
//             "params": {
//                 "rutina": {
//                     "_id": "647d0d144ee92199676b9d24",
//                     "ID": 1,
//                     "NOMBRE": "Abdominales",
//                     "DESCRIPCION": "rutina de abs",
//                     "EJERCICIOS": [
//                         {
//                             "name": "Landmine twist",
//                             "type": "strength",
//                             "muscle": "abdominals",
//                             "equipment": "other",
//                             "difficulty": "intermediate",
//                             "instructions": "Position a bar into a landmine or securely anchor it in a corner. Load the bar to an appropriate weight. Raise the bar from the floor, taking it to shoulder height with both hands with your arms extended in front of you. Adopt a wide stance. This will be your starting position. Perform the movement by rotating the trunk and hips as you swing the weight all the way down to one side. Keep your arms extended throughout the exercise. Reverse the motion to swing the weight all the way to the opposite side. Continue alternating the movement until the set is complete.",
//                             "reps" : 10,
//                             "sets": 4
//                         },
//                         {
//                             "name": "Elbow plank",
//                             "type": "strength",
//                             "muscle": "abdominals",
//                             "equipment": "body_only",
//                             "difficulty": "intermediate",
//                             "instructions": "Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder. Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised.",
//                             "reps" : 10,
//                             "sets": 4
//                         },
//                         {
//                             "name": "Bottoms Up",
//                             "type": "strength",
//                             "muscle": "abdominals",
//                             "equipment": "body_only",
//                             "difficulty": "intermediate",
//                             "instructions": "Begin by lying on your back on the ground. Your legs should be straight and your arms at your side. This will be your starting position. To perform the movement, tuck the knees toward your chest by flexing the hips and knees. Following this, extend your legs directly above you so that they are perpendicular to the ground. Rotate and elevate your pelvis to raise your glutes from the floor. After a brief pause, return to the starting position.",
//                             "reps" : 10,
//                             "sets": 4
//                         },
//                         {
//                             "name": "Suspended ab fall-out",
//                             "type": "strength",
//                             "muscle": "abdominals",
//                             "equipment": "other",
//                             "difficulty": "intermediate",
//                             "instructions": "Adjust the straps so the handles are at an appropriate height, below waist level. Begin standing and grasping the handles. Lean into the straps, moving to an incline push-up position. This will be your starting position. Keeping your arms straight, lean further into the suspension straps, bringing your body closer to the ground, allowing your shoulders to extend, raising your arms up and over your head. Maintain a neutral spine and keep the rest of your body straight, your shoulders being the only joints allowed to move. Pause during the peak contraction, and then return to the starting position.",
//                             "reps" : 10,
//                             "sets": 4
//                         },
//                         {
//                             "name": "Dumbbell V-Sit Cross Jab",
//                             "type": "strength",
//                             "muscle": "abdominals",
//                             "equipment": "dumbbell",
//                             "difficulty": "intermediate",
//                             "instructions": "Begin seated on your butt with your knees bent and feet on the ground. Lean your upper body back to form a 45-degree angle with the floor. Bring your feet off the ground so that your body resembles a \"V\" shape. Grasp a dumbbell in each hand and hold tight to your chest with palms facing each other. This will be your starting position. While keeping your core tight and maintaining your body's \"V\" position, quickly extend your left arm straight out (similar to a jab) and then bring it back to the starting position while simultaneously punching out with the right arm. Your torso and legs may slightly rotate side to side opposite of your hands throughout the movementâ€”this is okay. A punch with each hand counts as one total repetition. Repeat for recommended number of repetitions.",
//                             "reps" : 10,
//                             "sets": 4
//                         },
//                         {
//                             "name": "Standing cable low-to-high twist",
//                             "type": "strength",
//                             "muscle": "abdominals",
//                             "equipment": "cable",
//                             "difficulty": "intermediate",
//                             "instructions": "Connect a standard handle on a tower, and move the cable to the lowest pulley position. With your side to the cable, grab the handle with one hand and step away from the tower. You should be approximately armâ€™s length away from the pulley, with the tension of the weight on the cable. Your outstretched arm should be aligned with the cable. With your feet positioned shoulder width apart, squat down and grab the handle with both hands. Your arms should still be fully extended. In one motion, pull the handle up and across your body until your arms are in a fully-extended position above your head. Keep your back straight and your arms close to your body as you pivot your back foot and straighten your legs to get a full range of motion. Retract your arms and then your body. Return to the neutral position in a slow and controlled manner. Repeat to failure. Then, reposition and repeat the same series of movements on the opposite side.  Tip: You will twist your entire body with this exercise, but focus on getting maximal torso rotation and a strong clinch at the end of the movement. To ensure a good mind-muscle connection, keep your abs tense at all times.",
//                             "reps" : 10,
//                             "sets": 4
//                         },
//                         {
//                             "name": "Dumbbell spell caster",
//                             "type": "strength",
//                             "muscle": "abdominals",
//                             "equipment": "dumbbell",
//                             "difficulty": "beginner",
//                             "instructions": "Hold a dumbbell in each hand with a pronated grip. Your feet should be wide with your hips and knees extended. This will be your starting position. Begin the movement by pulling both of the dumbbells to one side next to your hip, rotating your torso. Keeping your arms straight and the dumbbells parallel to the ground, rotate your torso to swing the weights to your opposite side. Continue alternating, rotating from one side to the other until the set is complete.",
//                             "reps" : 10,
//                             "sets": 4
//                         },
//                         {
//                             "name": "Decline reverse crunch",
//                             "type": "strength",
//                             "muscle": "abdominals",
//                             "equipment": "other",
//                             "difficulty": "intermediate",
//                             "instructions": "Lie on your back on a decline bench and hold on to the top of the bench with both hands. Don't let your body slip down from this position. Hold your legs parallel to the floor using your abs to hold them there while keeping your knees and feet together. Tip: Your legs should be fully extended with a slight bend on the knee. This will be your starting position. While exhaling, move your legs towards the torso as you roll your pelvis backwards and you raise your hips off the bench. At the end of this movement your knees will be touching your chest. Hold the contraction for a second and move your legs back to the starting position while inhaling. Repeat for the recommended amount of repetitions.  Variations: You can do the movement on a flat surface and as you get more advanced you can use ankle weights.",
//                             "reps" : 10,
//                             "sets": 4
//                         },
//                         {
//                             "name": "Spider crawl",
//                             "type": "strength",
//                             "muscle": "abdominals",
//                             "equipment": "body_only",
//                             "difficulty": "intermediate",
//                             "instructions": "Begin in a prone position on the floor. Support your weight on your hands and toes, with your feet together and your body straight. Your arms should be bent to 90 degrees. This will be your starting position. Initiate the movement by raising one foot off of the ground. Externally rotate the leg and bring the knee toward your elbow, as far forward as possible. Return this leg to the starting position and repeat on the opposite side.",
//                             "reps" : 10,
//                             "sets": 4
//                         },
//                         {
//                             "name": "Cocoons",
//                             "type": "strength",
//                             "muscle": "abdominals",
//                             "equipment": "body_only",
//                             "difficulty": "intermediate",
//                             "instructions": "Begin by lying on your back on the ground. Your legs should be straight and your arms extended behind your head. This will be your starting position. To perform the movement, tuck the knees toward your chest, rotating your pelvis to lift your glutes from the floor. As you do so, flex the spine, bringing your arms back over your head to perform a simultaneous crunch motion. After a brief pause, return to the starting position.",
//                             "reps" : 10,
//                             "sets": 4
//                         }
//                     ],
//                     "HABILITADO": true,
//                     "FECHA_CREACION": "2023-06-04T00:00:00.000Z",
//                     "FECHA_MODIFICACION": "2023-06-04T00:00:00.000Z",
//                     "USUARIO_CREACION": "Fer",
//                     "USUARIO_MODIFICACION": "Fer",
//                     "DURACION": 15,
//                     "DIFICULTAD": 3,
//                     "IMAGEN": "",
//                     "NIVEL": "principiante"
//                 }
//             }
//     }
    console.log({route});
    console.log({navigation});
  return (
    <View style={styles.container}>
            <UserBadge />
    <View>
        <Text style={styles.rutina_nombre}>
            {route.params.rutina.NOMBRE}
        </Text>
        <Text style={styles.rutina_duracion}>
            <Image source={require('../assets/clock.png')} style={[styles.icon, {width: 20, height: 20}]} />
            {route.params.rutina.DURACION}
        </Text>
    </View>
    <ScrollView style={styles.scrollView}>
        {route.params.rutina.EJERCICIOS.map((ejercicio, index) => {
            return(
                <CardEjercicio ejercicio={ejercicio} index={index} key={index}/>
            )
        })}
    </ScrollView>
        
        
    </View>
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
    }
})

export default Rutina