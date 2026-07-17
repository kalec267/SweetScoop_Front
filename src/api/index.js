import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://192.168.137.173:8888/',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Spring Security CORS 연동용
});

// 🚀 [1] 백엔드로 "보내는 요청(Request)" 콘솔 출력 인터셉터
instance.interceptors.request.use(
  (config) => {
    console.groupCollapsed(
      `%c[API Request] %c${config.method.toUpperCase()} %c${config.url}`,
      'color: #6f42c1; font-weight: bold;', // 보라색 구분 타이틀
      'color: #059669; font-weight: bold;', // HTTP 메서드 색상
      'color: #1e293b;'                     // URL 색상
    );
    if (config.data) {
      console.log('보내는 데이터(Payload):', config.data);
    } else {
      console.log('보내는 데이터: 없음 (GET/DELETE)');
    }
    console.groupEnd();
    return config;
  },
  (error) => {
    console.error('[Request Error]', error);
    return Promise.reject(error);
  }
);

// 🚀 [2] 백엔드에서 "받은 응답(Response)" 콘솔 출력 인터셉터
instance.interceptors.response.use(
  (response) => {
    console.groupCollapsed(
      `%c[API Response] %cSUCCESS %c${response.config.method.toUpperCase()} %c${response.config.url}`,
      'color: #059669; font-weight: bold;', // 초록색 구분 타이틀
      'color: #10b981; font-weight: bold;', // SUCCESS 태그
      'color: #4b5563;', 
      'color: #1e293b;'
    );
    console.log('HTTP 상태 코드:', response.status);
    console.log('받은 결과 데이터(Body):', response.data);
    console.groupEnd();
    return response;
  },
  (error) => {
    console.groupCollapsed(
      `%c[API Response] %cFAIL %c${error.config?.method.toUpperCase()} %c${error.config?.url}`,
      'color: #dc2626; font-weight: bold;', // 빨간색 실패 타이틀
      'color: #ef4444; font-weight: bold;', // FAIL 태그
      'color: #4b5563;',
      'color: #1e293b;'
    );
    console.log('HTTP 에러 정보:', error.response ? error.response.status : '네트워크 에러');
    console.log('에러 메시지:', error.response?.data || error.message);
    console.groupEnd();
    return Promise.reject(error);
  }
);

export default instance;