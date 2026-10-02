import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getAlertes, resoudreAlerte } from "../services/api";

export default function AlertesScreen() {
  const [alertes, setAlertes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [alerteSelectionnee, setAlerteSelectionnee] = useState(null);

  const charger = useCallback(async () => {
    try {
      const res = await getAlertes();
      setAlertes(res.data.reverse());
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await charger();
    setRefreshing(false);
  };

  const handleResoudre = async (id) => {
    Alert.alert("Confirmer", "Marquer cette alerte comme résolue ?", [
      { text: "Annuler" },
      {
        text: "Résoudre",
        onPress: async () => {
          await resoudreAlerte(id);
          setAlerteSelectionnee(null);
          charger();
        },
      },
    ]);
  };

  const couleur = (type) => {
    if (type === "DDOS") return "#C0392B";
    if (type === "PORT_SCAN") return "#E67E22";
    return "#E74C3C";
  };

  const niveauRisque = (type) => {
    if (type === "DDOS") return { label: "CRITIQUE", color: "#C0392B" };
    if (type === "PORT_SCAN") return { label: "ÉLEVÉ", color: "#E67E22" };
    return { label: "MOYEN", color: "#E74C3C" };
  };

  const explicationAlerte = (type) => {
    if (type === "DDOS")
      return "Une machine envoie un volume anormal de paquets en peu de temps. Cela peut saturer le réseau et rendre les services indisponibles.";
    if (type === "PORT_SCAN")
      return "Une machine explore plusieurs ports différents en peu de temps. C'est souvent la première étape d'une attaque pour identifier les services vulnérables.";
    return "Une connexion a été détectée sur un port connu pour être utilisé par des outils malveillants (backdoor, trojan, accès distant non autorisé).";
  };

  const extraireIPDest = (description) => {
    const match = description.match(/vers (.+)$/);
    return match ? match[1] : "N/A";
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={alertes}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setAlerteSelectionnee(item)}
            activeOpacity={0.8}
          >
            <View style={[styles.card, item.resolue && styles.cardResolue]}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: couleur(item.type_alerte) },
                    ]}
                  >
                    <Text style={styles.badgeText}>{item.type_alerte}</Text>
                  </View>
                  {item.occurrences > 1 && (
                    <View style={styles.occurrencesBadge}>
                      <Text style={styles.occurrencesText}>
                        ×{item.occurrences}
                      </Text>
                    </View>
                  )}
                </View>
                {item.resolue ? (
                  <Text style={styles.resolueTag}>✓ Résolue</Text>
                ) : (
                  <Text style={styles.voirDetail}>Voir détail →</Text>
                )}
              </View>
              <Text style={styles.ip}>{item.ip_source}</Text>
              <Text style={styles.desc}>{item.description}</Text>
              <Text style={styles.date}>{item.date.substring(0, 19)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune alerte</Text>}
      />

      {/* Modal détail alerte */}
      <Modal
        visible={alerteSelectionnee !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setAlerteSelectionnee(null)}
      >
        {alerteSelectionnee && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View
                  style={[
                    styles.modalHeader,
                    {
                      backgroundColor: couleur(alerteSelectionnee.type_alerte),
                    },
                  ]}
                >
                  <Text style={styles.modalType}>
                    {alerteSelectionnee.type_alerte}
                  </Text>
                  <View style={styles.risqueBadge}>
                    <Text style={styles.risqueText}>
                      Risque :{" "}
                      {niveauRisque(alerteSelectionnee.type_alerte).label}
                    </Text>
                  </View>
                </View>

                {/* Statut */}
                <View style={styles.statutRow}>
                  <Text style={styles.statutLabel}>Statut :</Text>
                  <Text
                    style={[
                      styles.statutValue,
                      {
                        color: alerteSelectionnee.resolue
                          ? "#1E7D34"
                          : "#C0392B",
                      },
                    ]}
                  >
                    {alerteSelectionnee.resolue ? "✓ Résolue" : "⚠ Non résolue"}
                  </Text>
                </View>

                {/* Détails réseau */}
                <Text style={styles.sectionTitre}>📡 Informations réseau</Text>
                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>ID alerte</Text>
                    <Text style={styles.infoValue}>
                      #{alerteSelectionnee.id}
                    </Text>
                  </View>
                  <View style={styles.separateur} />
                  {/* <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>IP source</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: "#C0392B", fontWeight: "bold" },
                      ]}
                    >
                      {alerteSelectionnee.ip_source}
                    </Text>
                  </View>   */}

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>IP source</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: "#C0392B", fontWeight: "bold" },
                      ]}
                    >
                      {alerteSelectionnee.ip_source}
                    </Text>
                  </View>
                  <View style={styles.separateur} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>IP destination</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: "#1E7D34", fontWeight: "bold" },
                      ]}
                    >
                      {extraireIPDest(alerteSelectionnee.description)}
                    </Text>
                  </View>
                  <View style={styles.separateur} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type d'attaque</Text>
                    <Text style={styles.infoValue}>
                      {alerteSelectionnee.type_alerte}
                    </Text>
                  </View>
                  <View style={styles.separateur} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date détection</Text>
                    <Text style={styles.infoValue}>
                      {alerteSelectionnee.date.substring(0, 19)}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.sectionTitre}>📋 Description</Text>
                <View style={styles.descBox}>
                  <Text style={styles.descText}>
                    {alerteSelectionnee.description}
                  </Text>
                </View>

                {/* Explication */}
                <Text style={styles.sectionTitre}>💡 Explication</Text>
                <View style={styles.expliqBox}>
                  <Text style={styles.expliqText}>
                    {explicationAlerte(alerteSelectionnee.type_alerte)}
                  </Text>
                </View>

                {/* Boutons */}
                <View style={styles.botomsRow}>
                  <TouchableOpacity
                    style={styles.fermerBtn}
                    onPress={() => setAlerteSelectionnee(null)}
                  >
                    <Text style={styles.fermerBtnText}>Fermer</Text>
                  </TouchableOpacity>

                  {!alerteSelectionnee.resolue && (
                    <TouchableOpacity
                      style={styles.resoudreGrandBtn}
                      onPress={() => handleResoudre(alerteSelectionnee.id)}
                    >
                      <Text style={styles.resoudreGrandBtnText}>
                        ✓ Résoudre
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 10,
    elevation: 2,
  },
  cardResolue: { opacity: 0.6 },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  resolueTag: { color: "#1E7D34", fontWeight: "bold" },
  voirDetail: { color: "#2E75B6", fontWeight: "bold", fontSize: 13 },
  ip: { fontWeight: "bold", color: "#1A3C5E", fontSize: 16, marginTop: 8 },
  desc: { color: "#555", fontSize: 13, marginTop: 4 },
  date: { color: "#aaa", fontSize: 11, marginTop: 6 },
  occurrencesBadge: {
    backgroundColor: "#1A3C5E",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  occurrencesText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  empty: { textAlign: "center", color: "#aaa", marginTop: 40, fontSize: 16 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: "center",
    gap: 8,
  },
  modalType: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  risqueBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  risqueText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  statutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statutLabel: { color: "#888", fontSize: 14 },
  statutValue: { fontWeight: "bold", fontSize: 14 },
  sectionTitre: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1A3C5E",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  infoLabel: { color: "#888", fontSize: 14 },
  infoValue: { color: "#1A3C5E", fontSize: 14 },
  separateur: { height: 1, backgroundColor: "#EEEEEE", marginHorizontal: 14 },
  descBox: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 14,
  },
  descText: { color: "#333", fontSize: 14, lineHeight: 22 },
  expliqBox: {
    backgroundColor: "#EBF5FB",
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#2E75B6",
  },
  expliqText: { color: "#2E75B6", fontSize: 14, lineHeight: 22 },
  botomsRow: {
    flexDirection: "row",
    gap: 12,
    margin: 16,
    marginTop: 20,
  },
  fermerBtn: {
    flex: 1,
    backgroundColor: "#F0F4F8",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  fermerBtnText: { color: "#555", fontWeight: "bold", fontSize: 16 },
  resoudreGrandBtn: {
    flex: 1,
    backgroundColor: "#1E7D34",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  resoudreGrandBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
