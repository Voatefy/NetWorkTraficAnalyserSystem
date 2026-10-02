import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, RefreshControl, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getBlacklist, bloquerIP, debloquerIP } from '../services/api';

// CORRECTIF : validation format IPv4
const validerIP = (ip) => {
  const regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  if (!regex.test(ip)) return false;
  return ip.split('.').every(octet => parseInt(octet, 10) <= 255);
};

export default function BlacklistScreen() {
  const [ips, setIps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [raison, setRaison] = useState('');
  const [erreurIP, setErreurIP] = useState('');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);

  const charger = useCallback(async () => {
    try {
      setErreur(null);
      const res = await getBlacklist();
      // CORRECTIF : tri par date décroissante
      const triees = [...res.data].sort(
        (a, b) => new Date(b.date_blocage) - new Date(a.date_blocage)
      );
      setIps(triees);
    } catch (e) {
      console.error('Erreur chargement blacklist:', e);
      setErreur('Impossible de charger la blacklist');
    }
  }, []);

  // useFocusEffect : recharge à chaque accès à l'écran
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  };

  // CORRECTIF : validation IP en temps réel
  const handleChangeIP = (val) => {
    setNewIP(val);
    if (val.length > 0 && !validerIP(val)) {
      setErreurIP('Format invalide (ex: 192.168.1.99)');
    } else {
      setErreurIP('');
    }
  };

  const handleFermerModal = () => {
    setModal(false);
    setNewIP('');
    setRaison('');
    setErreurIP('');
  };

  const handleBloquer = async () => {
    // CORRECTIF : validation avant envoi
    if (!newIP || !raison) {
      Alert.alert('Erreur', 'Remplis tous les champs');
      return;
    }
    if (!validerIP(newIP)) {
      setErreurIP('Adresse IP invalide');
      return;
    }

    setLoading(true);
    try {
      await bloquerIP(newIP.trim(), raison.trim());
      handleFermerModal();
      charger();
    } catch (e) {
      const detail = e.response?.data?.detail;
      if (detail === 'IP déjà bloquée') {
        Alert.alert('Erreur', 'Cette IP est déjà dans la blacklist');
      } else {
        Alert.alert('Erreur', 'Erreur serveur, réessaie');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDebloquer = (ip) => {
    Alert.alert('Confirmer', `Débloquer ${ip} ?`, [
      { text: 'Annuler' },
      {
        text: 'Débloquer',
        style: 'destructive',
        onPress: async () => {
          try {
            await debloquerIP(ip);
            charger();
          } catch (e) {
            Alert.alert('Erreur', 'Impossible de débloquer cette IP');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.ip}>{item.ip}</Text>
        <Text style={styles.raison}>{item.raison}</Text>
        <Text style={styles.date}>{item.date_blocage.substring(0, 19)}</Text>
      </View>
      <TouchableOpacity style={styles.debloquerBtn} onPress={() => handleDebloquer(item.ip)}>
        <Text style={styles.debloquerText}>Débloquer</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>

      <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
        <Text style={styles.addBtnText}>+ Bloquer une IP</Text>
      </TouchableOpacity>

      {/* Bandeau erreur */}
      {erreur && (
        <View style={styles.erreurBandeau}>
          <Text style={styles.erreurTexte}>⚠ {erreur}</Text>
        </View>
      )}

      {/* Compteur */}
      <Text style={styles.compteur}>{ips.length} IP{ips.length !== 1 ? 's' : ''} bloquée{ips.length !== 1 ? 's' : ''}</Text>

      <FlatList
        data={ips}
        keyExtractor={item => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>Aucune IP bloquée</Text>}
      />

      {/* Modal bloquer IP */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={handleFermerModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Bloquer une IP</Text>

            <TextInput
              style={[styles.input, erreurIP ? styles.inputErreur : null]}
              placeholder="Adresse IP (ex: 192.168.1.99)"
              value={newIP}
              onChangeText={handleChangeIP}
              keyboardType="numeric"
              autoCapitalize="none"
            />
            {/* CORRECTIF : message d'erreur format IP */}
            {erreurIP ? <Text style={styles.texteErreur}>{erreurIP}</Text> : null}

            <TextInput
              style={styles.input}
              placeholder="Raison du blocage"
              value={raison}
              onChangeText={setRaison}
              maxLength={200}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#aaa' }]}
                onPress={handleFermerModal}
                disabled={loading}
              >
                <Text style={styles.modalBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: loading ? '#e88' : '#C0392B' }
                ]}
                onPress={handleBloquer}
                disabled={loading || !!erreurIP}
              >
                <Text style={styles.modalBtnText}>
                  {loading ? 'Envoi...' : 'Bloquer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  addBtn: {
    backgroundColor: '#C0392B', margin: 16, borderRadius: 10,
    padding: 14, alignItems: 'center'
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  erreurBandeau: {
    backgroundColor: '#FDECEA', borderLeftWidth: 4, borderLeftColor: '#C0392B',
    marginHorizontal: 16, marginBottom: 8, borderRadius: 8, padding: 10,
  },
  erreurTexte: { color: '#C0392B', fontSize: 13 },
  compteur: { color: '#aaa', fontSize: 12, marginLeft: 16, marginBottom: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginHorizontal: 16, marginBottom: 10, flexDirection: 'row',
    alignItems: 'center', elevation: 2
  },
  ip: { fontWeight: 'bold', color: '#C0392B', fontSize: 16 },
  raison: { color: '#555', fontSize: 13, marginTop: 2 },
  date: { color: '#aaa', fontSize: 11, marginTop: 4 },
  debloquerBtn: { backgroundColor: '#E8F5E9', borderRadius: 8, padding: 10 },
  debloquerText: { color: '#1E7D34', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', padding: 24
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A3C5E', marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 12, marginBottom: 4, fontSize: 15,
  },
  inputErreur: { borderColor: '#C0392B' },
  texteErreur: { color: '#C0392B', fontSize: 12, marginBottom: 10, marginLeft: 4 },
  modalBtn: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: 'bold' },
});