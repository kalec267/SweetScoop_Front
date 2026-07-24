- 메뉴 관리 페이지[본사] 카테고리 별로 분류
    MenuManagement.vue 수정



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


=====================================================================================

260722

-메뉴관리 가격수정 [MenuManagement.vue,api/Menu.js]-
-대시보드 카테고리에 따른 분류 [Dashboard.vue]-


260723

-Header.vue 
부분 종모양 실시간 주문 알림 및 빨강 실시간이펙트 구현완료 (누를시 삭제됨)
실시간 주문이 들어올 경우 종모양 알림에 새로운 알림이 오면서 알림소리가 나옴(소리는 띵동으로 구현)

-printer.js 부분에서 28번째 줄 영수증에 출력되는 주문번호가 orderId가 아닌 waitingNo로 출력 되도록 변경 //각 위치에 주석처리 완료
 1. receiptContent += `주문번호 : ${receiptData.orderId || 'N/A'}\n`;   ->    receiptContent += `주문번호 : ${receiptData.waitingNo || 'N/A'}\n`; 
 2. orderNo: receiptData.orderId, ->  orderNo: receiptData.waitingNo, 

 -BranchDashboard.vue
 00시 스케쥴러 테스트 버튼 및 코드 구현
 단일 메뉴 구매시 ,로 인해 맛 옵션이 나오지않던 오류 수정
 실시간 주문 내역 메뉴에 제조완료, 주문취소 기능 추가
 제조완료를 누를시 firebase에서 문서 자동 삭제
 주문취소를 누를시 firebase와 DB에서 데이터 자동 삭제

260724

-sidebar.vue, index.js(router), OrderHistory.vue
실시간 키오스크 주문내역 페이지 연결

-BranchDashboard.vue
제조완료시 상태를 제조완료로 변경하고 현황에서는 안보이게 처리

-OrderHistory.vue
주문대기 상태일떄만 주문취소 버튼 뜨고 완료시에는 안보이게 처리

