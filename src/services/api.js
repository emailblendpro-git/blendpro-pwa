import axios from 'axios';

// Detectar se está em desenvolvimento ou produção
const baseURL = window.location.hostname === 'localhost'
  ? 'http://localhost:3000/v1'
  : 'https://blendpro-api.onrender.com/v1';

const api = axios.create({
  baseURL: baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;