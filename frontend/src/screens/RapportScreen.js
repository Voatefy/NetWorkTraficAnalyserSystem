import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = 'http://192.168.0.106:8000';

export default function RapportScreen() {
  const [loading, setLoading] = useState(false);

  const ouvrirPDF = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const url = `${BACKEND_URL}/exports/rapport/pdf?token=${token}`;
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de télécharger le rapport');
    } finally {
      setLoading(false);
    }
  };

  const ouvrirCSVLogs = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await Linking.openURL(`${BACKEND_URL}/exports/logs/csv?token=${token}`);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le fichier');
    }
  };

  const ouvrirCSVAlertes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await Linking.openURL(`${BACKEND_URL}/exports/alertes/csv?token=${token}`);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le fichier');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Rapports</Text>
        <Text style={styles.headerSub}>Exporte les données du système</Text>
      </View>

      <View style={styles.content}>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Text style={styles.icon}>📄</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Rapport complet PDF</Text>
            <Text style={styles.cardDesc}>
              Résumé, alertes détectées et IPs bloquées
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#C0392B' }]}
            onPress={ouvrirPDF}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.btnText}>PDF</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Text style={styles.icon}>📋</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Export Logs CSV</Text>
            <Text style={styles.cardDesc}>
              Historique complet du trafic réseau
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#2E75B6' }]}
            onPress={ouvrirCSVLogs}
          >
            <Text style={styles.btnText}>CSV</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Text style={styles.icon}>⚠️</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Export Alertes CSV</Text>
            <Text style={styles.cardDesc}>
              Liste de toutes les alertes générées
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#E67E22' }]}
            onPress={ouvrirCSVAlertes}
          >
            <Text style={styles.btnText}>CSV</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ Les fichiers s'ouvrent dans le navigateur de votre téléphone.
            Vous pouvez ensuite les télécharger ou les partager.
          </Text>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    backgroundColor: '#1A3C5E', padding: 20, paddingTop: 50,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerSub: { color: '#aaa', fontSize: 14, marginTop: 4 },
  content: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    elevation: 2, gap: 12,
  },
  cardIcon: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#F0F4F8', alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardTitle: { fontWeight: 'bold', color: '#1A3C5E', fontSize: 15 },
  cardDesc: { color: '#888', fontSize: 12, marginTop: 2 },
  btn: {
    borderRadius: 8, paddingHorizontal: 16,
    paddingVertical: 10, alignItems: 'center', minWidth: 56,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  infoBox: {
    backgroundColor: '#EBF5FB', borderRadius: 12,
    padding: 14, marginTop: 8,
    borderLeftWidth: 4, borderLeftColor: '#2E75B6',
  },
  infoText: { color: '#2E75B6', fontSize: 13, lineHeight: 20 },
});