import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8888/api/admin',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Spring Security CORS 연동용
});

export default api;