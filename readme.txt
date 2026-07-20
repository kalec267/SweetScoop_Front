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
Menu.vue안에서 MenuCard를 여러번 사용
=====================================================================================

20260717

printer.js 프린트 직접 연동 후 출력 코드로 변경 
영수증 문자열 추가 및 백엔드 주소 연결 (http://localhost:8888/api/printer/print)
