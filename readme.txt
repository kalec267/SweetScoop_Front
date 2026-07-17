=====================================================================================
- VIte.config에서 프록시 설정
server: {
    host: "0.0.0.0",
    port: 5173,

    proxy: {
      "/api": {
        target: "http://192.168.137.173:8888",
        changeOrigin: true,
      },
    },
  },


- src/api/index.js의 baseURL 설정
const instance = axios.create({
  baseURL: 'http://192.168.137.173:8888/',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Spring Security CORS 연동용
});


src/api/axios.js 파일의 baseURL:"" 설정
const api = axios.create({
    baseURL:"",
    headers:{
        "Content-Type":"application/json"
    }
});

=====================================================================================