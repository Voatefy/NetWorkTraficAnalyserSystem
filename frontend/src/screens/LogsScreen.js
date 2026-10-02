import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TextInput, TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLogs } from '../services/api';

const PROTOCOLES = ['Tous', 'TCP', 'UDP', 'ICMP'];

export default function LogsScreen() {
  const [logs, setLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [filtreProtocole, setFiltreProtocole] = useState('Tous');
  const [erreur, setErreur] = useState(null);

  const charger = useCallback(async () => {
    try {
      setErreur(null);
      const res = await getLogs();
      // CORRECTIF : tri par date décroissante (plus récent en premier)
      const tries = [...res.data].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setLogs(tries);
    } catch (e) {
      console.error('Erreur chargement logs:', e);
      setErreur('Impossible de charger les logs');
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

  // CORRECTIF : filtrage local par IP et protocole
  const logsFiltres = useMemo(() => {
    return logs.filter(log => {
      const matchRecherche =
        recherche.trim() === '' ||
        log.ip_source.includes(recherche.trim()) ||
        log.ip_destination.includes(recherche.trim());

      const matchProtocole =
        filtreProtocole === 'Tous' ||
        log.protocole === filtreProtocole;

      return matchRecherche && matchProtocole;
    });
  }, [logs, recherche, filtreProtocole]);

  const couleurProtocole = (p) => {
    if (p === 'TCP') return '#2E75B6';
    if (p === 'UDP') return '#1E7D34';
    return '#E67E22';
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={[styles.badge, { backgroundColor: couleurProtocole(item.protocole) }]}>
          <Text style={styles.badgeText}>{item.protocole}</Text>
        </View>
        <Text style={styles.date}>{item.timestamp.substring(0, 19)}</Text>
      </View>
      <Text style={styles.ips}>{item.ip_source} → {item.ip_destination}</Text>
      <Text style={styles.ports}>Port {item.port_source} → {item.port_destination}</Text>
      {item.flags ? <Text style={styles.flags}>Flags: {item.flags}</Text> : null}
      <Text style={styles.taille}>{item.taille_paquet} octets</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F4F8' }}>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une IP..."
          value={recherche}
          onChangeText={setRecherche}
          autoCapitalize="none"
          keyboardType="numeric"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filtres protocole */}
      <View style={styles.filtreRow}>
        {PROTOCOLES.map(p => (
          <TouchableOpacity
            key={p}
            style={[
              styles.filtreBtn,
              filtreProtocole === p && styles.filtreBtnActif
            ]}
            onPress={() => setFiltreProtocole(p)}
          >
            <Text style={[
              styles.filtreBtnText,
              filtreProtocole === p && styles.filtreBtnTextActif
            ]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
        {/* Compteur résultats */}
        <Text style={styles.compteur}>{logsFiltres.length} résultat{logsFiltres.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Bandeau erreur */}
      {erreur && (
        <View style={styles.erreurBandeau}>
          <Text style={styles.erreurTexte}>⚠ {erreur}</Text>
        </View>
      )}

      <FlatList
        data={logsFiltres}
        keyExtractor={item => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {logs.length === 0 ? 'Aucun log' : 'Aucun résultat pour ce filtre'}
          </Text>
        }
        // CORRECTIF : optimisations performance FlatList
        removeClippedSubviews={true}
        maxToRenderPerBatch={20}
        windowSize={10}
        initialNumToRender={15}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#F0F4F8', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: '#1A3C5E',
  },
  filtreRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
    gap: 8,
  },
  filtreBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#ddd',
    backgroundColor: '#F0F4F8',
  },
  filtreBtnActif: {
    backgroundColor: '#1A3C5E', borderColor: '#1A3C5E',
  },
  filtreBtnText: { fontSize: 13, color: '#555', fontWeight: '500' },
  filtreBtnTextActif: { color: '#fff' },
  compteur: { marginLeft: 'auto', fontSize: 12, color: '#aaa' },
  erreurBandeau: {
    backgroundColor: '#FDECEA', borderLeftWidth: 4, borderLeftColor: '#C0392B',
    margin: 12, borderRadius: 8, padding: 10,
  },
  erreurTexte: { color: '#C0392B', fontSize: 13 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    margin: 10, elevation: 2
  },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  date: { color: '#aaa', fontSize: 11 },
  ips: { fontWeight: 'bold', color: '#1A3C5E', fontSize: 15, marginTop: 8 },
  ports: { color: '#555', fontSize: 13, marginTop: 2 },
  flags: { color: '#E67E22', fontSize: 12, marginTop: 2 },
  taille: { color: '#aaa', fontSize: 11, marginTop: 4 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
});