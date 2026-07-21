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

260717

-printer.js 프린트 직접 연동 후 출력 코드로 변경 
-영수증 문자열 추가 및 백엔드 주소 연결 (http://localhost:8888/api/printer/print)


260721

-firebase.js 추가 이후 BranchDashboard.vue, PaymentSuccess.vue, OrderComplete.vue에 관련 firebase내용 추가

-그리고 영수증의 상세한 출력을 위해 printer.js, Payment.vue, PaymentSuccess.vue, OrderComplete.vue에 관련 내용 추가 및 웨이팅 번호 순차 추가
추가된 형식)
--- 주문 상세 ---
파인트 x 1 = 9,800원
└ 맛: 민트 초콜릿 칩, 아몬드 봉봉, 그린티
아이스 모찌 소금우유 x 1 = 3,500원
((L)) 아포가토 라떼 x 1 = 7,000원
└ 옵션: 샷 추가, 바닐라 시럽 추가, 카라멜 시럽 추가

-BranchDashboard.vue에서 실시간 주문내역 칸 추가 및 버튼 추가[제조완료(완료시 주문내역삭제), 영수증 확인] 또한 상세보기를 통한 상세메뉴 확인가능
