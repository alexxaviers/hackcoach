import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = (process.env.API_URL) || 'http://localhost:4000';

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if(token && config.headers) config.headers['Authorization'] = `Bearer ${token}`;
  const uid = await SecureStore.getItemAsync('userId');
  if(uid && config.headers) config.headers['x-user-id'] = uid;
  return config;
});

export default client;
