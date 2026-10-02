import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLogs, getAlertes, getBlacklist, getAlertesNonResolues, logout } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({ logs: 0, alertes: 0, blacklist: 0, nonResolues: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [dernieresAlertes, setDernieresAlertes] = useState([]);
  const [erreur, setErreur] = useState(null);

  const chargerDonnees = useCallback(async () => {
    try {
      setErreur(null);

      // CORRECTIF : appels séparés pour avoir les vrais comptes
      // getLogs et getAlertes sont limités, on utilise des routes dédiées si dispo
      // Pour les stats de count, on prend le total retourné (limité à 1000)
      const [logsRes, alertesRes, blacklistRes, nonResoluesRes] = await Promise.all([
        getLogs(),
        getAlertes(),
        getBlacklist(),
        getAlertesNonResolues(),
      ]);

      setStats({
        logs: logsRes.data.length,         // affiché comme "≥ N" si limite atteinte
        alertes: alertesRes.data.length,
        blacklist: blacklistRes.data.length,
        nonResolues: nonResoluesRes.data.length,
      });

      // Dernières alertes : on trie par date desc et on prend les 3 premières
      const triees = [...alertesRes.data].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setDernieresAlertes(triees.slice(0, 3));
    } catch (e) {
      console.error('Erreur chargement dashboard:', e);
      setErreur('Impossible de contacter le serveur');
    }
  }, []);

  // useFocusEffect : se déclenche à chaque fois qu'on arrive sur l'écran
  useFocusEffect(
    useCallback(() => {
      chargerDonnees();
      // Refresh automatique toutes les 10s, stoppé quand on quitte l'écran
      const interval = setInterval(chargerDonnees, 10000);
      return () => clearInterval(interval);
    }, [chargerDonnees])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await chargerDonnees();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const couleurAlerte = (type) => {
    if (type === 'DDOS') return '#C0392B';
    if (type === 'PORT_SCAN') return '#E67E22';
    return '#E74C3C';
  };

  // CORRECTIF : affiche "1000+" si la limite est atteinte
  const afficherCount = (count, limite = 1000) => {
    if (count >= limite) return `${limite}+`;
    return String(count);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📡 Dashboard</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Bandeau d'erreur */}
      {erreur && (
        <View style={styles.erreurBandeau}>
          <Text style={styles.erreurTexte}>⚠ {erreur}</Text>
        </View>
      )}

      {/* Cartes stats */}
      <View style={styles.grid}>
        <View style={[styles.card, { backgroundColor: '#2E75B6' }]}>
          <Text style={styles.cardNum}>{afficherCount(stats.logs)}</Text>
          <Text style={styles.cardLabel}>Logs capturés</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#C0392B' }]}>
          <Text style={styles.cardNum}>{afficherCount(stats.nonResolues)}</Text>
          <Text style={styles.cardLabel}>Alertes actives</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#1E7D34' }]}>
          <Text style={styles.cardNum}>{afficherCount(stats.alertes)}</Text>
          <Text style={styles.cardLabel}>Total alertes</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#E67E22' }]}>
          <Text style={styles.cardNum}>{afficherCount(stats.blacklist)}</Text>
          <Text style={styles.cardLabel}>IPs bloquées</Text>
        </View>
      </View>

      {/* Dernières alertes */}
      <Text style={styles.sectionTitle}>⚠ Dernières alertes</Text>
      {dernieresAlertes.length === 0
        ? <Text style={styles.empty}>Aucune alerte</Text>
        : dernieresAlertes.map(a => (
          <View key={a.id} style={styles.alerteCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={[styles.alerteBadge, { backgroundColor: couleurAlerte(a.type_alerte) }]}>
                <Text style={styles.alerteType}>{a.type_alerte}</Text>
              </View>
              {/* CORRECTIF : badge occurrences */}
              {a.occurrences > 1 && (
                <View style={styles.occurrencesBadge}>
                  <Text style={styles.occurrencesText}>×{a.occurrences}</Text>
                </View>
              )}
            </View>
            <Text style={styles.alerteIP}>{a.ip_source}</Text>
            <Text style={styles.alerteDesc}>{a.description}</Text>
            <Text style={styles.alerteDate}>
              Première : {a.date.substring(0, 19)}
            </Text>
            {a.occurrences > 1 && (
              <Text style={styles.alerteDerniereDate}>
                Dernière : {a.derniere_occurrence.substring(0, 19)}
              </Text>
            )}
          </View>
        ))
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    backgroundColor: '#1A3C5E', padding: 20, paddingTop: 50,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  logout: { color: '#aaa', fontSize: 14 },
  erreurBandeau: {
    backgroundColor: '#FDECEA', borderLeftWidth: 4, borderLeftColor: '#C0392B',
    margin: 16, borderRadius: 8, padding: 12,
  },
  erreurTexte: { color: '#C0392B', fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  card: {
    width: '46%', borderRadius: 14, padding: 18,
    alignItems: 'center', margin: 2
  },
  cardNum: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  cardLabel: { color: '#fff', fontSize: 13, marginTop: 4, opacity: 0.9 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A3C5E', margin: 16 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 20 },
  alerteCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginHorizontal: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  alerteBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  alerteType: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  alerteIP: { fontWeight: 'bold', color: '#1A3C5E', fontSize: 15 },
  alerteDesc: { color: '#555', fontSize: 13, marginTop: 4 },
  alerteDate: { color: '#aaa', fontSize: 11, marginTop: 6 },
  alerteDerniereDate: { color: '#E67E22', fontSize: 11, marginTop: 2 },
  occurrencesBadge: {
    backgroundColor: '#1A3C5E', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  occurrencesText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});