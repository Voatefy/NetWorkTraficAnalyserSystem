import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = 'http://192.168.43.112:8000';

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
});

// Interceptor requête — ajoute le token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor réponse — gère le token expiré
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const username = await AsyncStorage.getItem('username');
        const password = await AsyncStorage.getItem('password');
        if (username && password) {
          const res = await axios.post(
            `${BACKEND_URL}/auth/login`,
            `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          );
          const newToken = res.data.access_token;
          await AsyncStorage.setItem('token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (e) {
        await AsyncStorage.removeItem('token');
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  const res = await api.post(
    '/auth/login',
    `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  await AsyncStorage.setItem('token', res.data.access_token);
  // Sauvegarde les credentials pour le refresh automatique
  await AsyncStorage.setItem('username', username);
  await AsyncStorage.setItem('password', password);
  return res.data;
};

export const logout = async () => {
  await AsyncStorage.multiRemove(['token', 'username', 'password']);
};

export const getLogs = () => api.get('/logs/?limit=1000');
// export const getAlertes = () => api.get('/alertes/');
export const getAlertes = () => api.get('/alertes/?limit=1000');
export const getAlertesNonResolues = () => api.get('/alertes/non-resolues');
export const resoudreAlerte = (id) => api.put(`/alertes/${id}/resoudre`);
export const getBlacklist = () => api.get('/blacklist/');
export const bloquerIP = (ip, raison) => api.post('/blacklist/', { ip, raison });
export const debloquerIP = (ip) => api.delete(`/blacklist/${ip}`);
export const getRapportPDF = () => api.get('/exports/rapport/pdf', {
  responseType: 'blob'
});