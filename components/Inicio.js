import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ImageBackground, Image } from 'react-native';
import UserBadge from './UserBadge';
import UserContext from '../context/UserContext';
import RutinasContext from '../context/RutinasContext';
import RecordsContext from '../context/RecordsContext';
import { URL_API } from '../config';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../styles/theme';

const Inicio = ({ navigation }) => {
  const { user } = useContext(UserContext);
  const { rutinas, setRutinas } = useContext(RutinasContext);
  const { records, setRecords } = useContext(RecordsContext);

  const getRutinas = async () => {
    try {
      const respuesta = await fetch(`${URL_API}/rutinas`);
      const json = await respuesta.json();
      setRutinas(json.result_rutinas);
    } catch (error) {
      console.error('error ', error);
    }
  }
  
  const getRecords = async () => {
    try {
      const respuesta = await fetch(`${URL_API}/records/list`, {
        method: 'POST',
        body: JSON.stringify({ dni: user.DNI }),
      })
      const json = await respuesta.json();
      setRecords(json.result_records);
    } catch (error) {
      console.error('error ', error);
    }
  }

  useEffect(() => {
    getRutinas();
    getRecords();
  }, []);

  const menuItems = [
    {
      id: 'rutinas',
      title: 'RUTINAS',
      image: require('../assets/bg-rutinas.jpg'),
      navigate: 'Rutinas'
    },
    {
      id: 'records',
      title: 'RECORDS',
      image: require('../assets/stonks.jpg'),
      navigate: 'Records'
    }
  ];

  return (
    <View style={styles.container}>
      <UserBadge onProfilePress={() => navigation.navigate('Profile')} />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Inicio</Text>
        <Text style={styles.headerSubtitle}>
          Bienvenido a LimeFit, {user.NAME}
        </Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item) => (
          <TouchableOpacity 
            key={item.id}
            style={styles.menuCard} 
            onPress={() => navigation.navigate(item.navigate)}
            activeOpacity={0.8}
          >
            <ImageBackground 
              source={item.image} 
              style={styles.cardBackground}
              imageStyle={styles.cardBackgroundImage}
            >
              <View style={styles.cardOverlay}>
                <Text style={styles.cardTitle}>
                  {item.title} <Text style={styles.arrow}>→</Text>
                </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{rutinas.length}</Text>
            <Text style={styles.statLabel}>Rutinas</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{records?.length || 0}</Text>
            <Text style={styles.statLabel}>Records</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  headerTitle: {
    ...FONTS.title,
    color: COLORS.text,
  },
  headerSubtitle: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: SPACING.m,
    paddingBottom: SPACING.xxl,
  },
  menuCard: {
    height: 130,
    marginBottom: SPACING.l,
    borderRadius: BORDER_RADIUS.l,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'center',
  },
  cardBackgroundImage: {
    borderRadius: BORDER_RADIUS.l,
  },
  cardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.l,
  },
  cardTitle: {
    ...FONTS.h1,
    color: '#adfa1d',
    fontWeight: 'bold',
    fontSize: 28,
  },
  arrow: {
    fontWeight: 'normal',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.m,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#adfa1d',
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.l,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statValue: {
    ...FONTS.h2,
    color: '#333333',
    fontWeight: 'bold',
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...FONTS.body,
    color: '#555555',
    fontWeight: 'bold',
  }
});

export default Inicio;