SweetScoopFront
│
├─ src
│
├─ components
│   ├─ MenuList.vue        // 메뉴 화면
│   ├─ Cart.vue            // 장바구니
│   ├─ OptionModal.vue     // 옵션 선택
│
├─ views
│   ├─ Kiosk.vue           // 키오스크 메인
│
├─ api
│   └─ axios.js            // Spring Boot 연결
│
└─ router
    └─ index.js
    
=====================================================================================
Menu.vue (메뉴 페이지): 페이지 전체를 관리하는 부모 테이블
- Spring Boot에서 메뉴 조회
- 메뉴 목록 저장
- MenuCard를 여러 개 생성
- 카테고리 관리
- 장바구니와 연결

MenuCard.vue (메뉴 한 개): 메뉴 1개를 그리는 컴포넌트

Menu.vue안에서 MenuCard를 여러번 사용
=====================================================================================