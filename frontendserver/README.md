이벤트 관리 페이지 Promotion.vue를 추가했습니다.
css는 본사 맛(메뉴) 관리 페이지에 맞게 했습니다.
index.js에 Promotion.vue가 연결되게 했습니다.
Promotion.vue에는 등록, 수정, 삭제, 상세보기가 있고
등록을 누르면 이벤트명, 이벤트내용, 시작일, 종료일, 시작시간, 종료시간, 이미지를 등록 할 수 있습니다. 

이미지같은 경우는 image/event폴더에서 이미지를
Promotion.vue에서 경로에 맞게 import하고 imagelist에 imagecode를 생성해서
db에서 imagecode에 맞는 이미지를 화면에 보여줍니다.
그래서 Promotion테이블에 imageCode컬럼을 추가했습니다.

수정은 수정버튼을 눌러 값을 바꾸면 수정되어 promotion테이블에 변경된 값이 반영됩니다. 삭제버튼을 누르면 삭제되어 테이블에 반영됩니다.

전체적인 흐름은 vue에서 값을 입력하면 값이 sts로 보내져 sts가 promotion테이블에 불러온 값을 insert합니다. 그리고 다시 db에 저장되어 있는 값을 sts의 http://localhost:8888/promotion가 조회하여 vue에게 전달되어
화면에 promotion테이블에 입력된 값이 나오는 것 입니다.



