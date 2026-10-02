import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView
} from 'react-native';
import { login } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

//   const handleLogin = async () => {
//     if (!username || !password) {
//       Alert.alert('Erreur', 'Remplis tous les champs');
//       return;
//     }
//     setLoading(true);
//     try {
//       await login(username, password);
//       navigation.replace('Main');
//     } catch (e) {
//       Alert.alert('Erreur', 'Username ou mot de passe incorrect');
//     } finally {
//       setLoading(false);
//     }
//   };


const handleLogin = async () => {
  if (!username || !password) {
    Alert.alert('Erreur', 'Remplis tous les champs');
    return;
  }
  setLoading(true);
  try {
    await login(username, password);
    navigation.replace('Main');
  } catch (e) {
    console.log('Erreur complète:', JSON.stringify(e.response?.data));
    console.log('Status:', e.response?.status);
    console.log('Username saisi:', username);
    console.log('Password saisi:', password);
    Alert.alert('Erreur', JSON.stringify(e.response?.data) || 'Erreur inconnue');
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.card}>
        <Text style={styles.title}>🔐 Logs Réseau</Text>
        <Text style={styles.subtitle}>Système de surveillance</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Se connecter</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A3C5E', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A3C5E', textAlign: 'center' },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 28, marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 14, marginBottom: 16, fontSize: 16
  },
  button: {
    backgroundColor: '#2E75B6', borderRadius: 10,
    padding: 16, alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});