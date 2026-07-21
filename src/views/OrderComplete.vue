<!-- src/views/OrderComplete.vue -->
<template>
  <div class="complete-container" v-if="receipt">
    <div class="receipt-card">
      <div class="success-icon">🎉</div>
      <h1>결제 완료</h1>
      <p class="guide-text">나오는 영수증과 신용카드를 꼭 챙겨가세요!</p>

      <div class="waiting-box">
        <p>고객 호출 대기 번호</p>
        <div class="number">{{ receipt.waitingNo }}</div>
      </div>

      <div class="info-container">
        <div class="detail-section">
          <!-- src/views/OrderComplete.vue 의 menu-list 내부 수정 -->
          <div class="menu-list">
            <div v-for="(item, index) in receipt.items" :key="index" class="menu-item-row">
              <!-- 💡 메뉴명/수량과 가격이 한 줄로 나란히 출력되도록 배치 -->
              <div class="menu-item-header">
                <span class="item-main-name">{{ item.menuName }} x {{ item.quantity }}</span>
                <span class="item-price">{{ (item.price * item.quantity).toLocaleString() }}원</span>
              </div>
              
              <!-- 맛 선택 정보 (아이스크림류 등 flavors가 존재하는 경우만 출력) -->
              <div v-if="item.flavors" class="item-options-text">
                - 맛: {{ item.flavors }}
              </div>

              <!-- 옵션 정보 (옵션이 존재하는 경우만 출력) -->
              <div v-if="item.options" class="item-options-text">
                - 옵션: {{ item.options }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 이하 기존 결제 정보들 유지 -->
        <div class="info-row">
          <span class="label">결제 수단</span>
          <span class="value">{{ receipt.paymentMethod }} ({{ receipt.cardCompany }})</span>
        </div>
        <div class="info-row">
          <span class="label">영수증 번호</span>
          <span class="value">{{ receipt.receiptNo }}</span>
        </div>
        <div class="info-row">
          <span class="label">총 결제 금액</span>
          <span class="value amount">{{ parseInt(receipt.totalPrice).toLocaleString() }}원</span>
        </div>
        <div class="info-row">
          <span class="label">승인 일시</span>
          <span class="value">{{ receipt.orderTime }}</span>
        </div>
      </div>
    </div>

    <p class="timer">⏳ {{ countdown }}초 후 메뉴 메인화면으로 복귀합니다.</p>
  </div>

  <div class="complete-container" v-else>
    <p>잘못된 접근 경로입니다.</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { PrinterService } from '@/utils/printer';

const router = useRouter();
const route = useRoute();
const receipt = ref(null);
const countdown = ref(60); 
let timerId = null;

onMounted(() => {
  // query로 전달받은 데이터 파싱
  if (route.query.data) {
    try {
      const parsedData = JSON.parse(route.query.data);
      // 필수 데이터 유효성 검사 추가
      if (parsedData && parsedData.items) {
        receipt.value = parsedData;
        // 데이터가 유효한 경우에만 프린트 호출
        PrinterService.printReceipt(receipt.value);
      }
    } catch (e) {
      console.error("데이터 파싱 실패", e);
      router.push('/');
    }

    timerId = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timerId);
        router.push('/');
      }
    }, 1000);
  } else {
    router.push('/');
  }
});

onBeforeUnmount(() => {
  if (timerId) clearInterval(timerId);
});
</script>

<style scoped>
.complete-container { max-width: 450px; margin: 50px auto; padding: 20px; text-align: center; font-family: 'Pretendard', sans-serif; }
.receipt-card { background: white; padding: 40px 30px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); margin-bottom: 20px; }
.success-icon { font-size: 60px; margin-bottom: 10px; }
h1 { font-size: 24px; margin-bottom: 10px; color: #1a1a1a; }
.guide-text { color: #666; font-size: 14px; margin-bottom: 30px; }
.waiting-box { background: #f0f7ff; color: #3182f6; padding: 20px; border-radius: 20px; margin-bottom: 30px; }
.waiting-box p { font-size: 14px; margin: 0; font-weight: 600; }
.waiting-box .number { font-size: 64px; font-weight: 800; margin-top: 5px; line-height: 1; }
.info-container { border-top: 1px dashed #e2e8f0; padding-top: 20px; }
.info-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
.label { color: #718096; }
.value { color: #2d3748; font-weight: 600; }
.amount { color: #3182f6; font-size: 16px; }
.timer { color: #a0aec0; font-size: 14px; font-weight: bold; }
/* 스타일 추가 또는 수정 */
.menu-list { margin: 15px 0; border-bottom: 1px dashed #e5e7eb; padding-bottom: 10px; text-align: left; }
.menu-item-row { margin-bottom: 12px; }

/* 💡 메뉴 헤더 한 줄 정렬 스타일 */
.menu-item-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
}

.item-main-name { font-weight: 600; color: #2d3748; font-size: 14px; }
.item-price { font-weight: 600; color: #2d3748; font-size: 14px; }
.item-options-text { font-size: 12px; color: #718096; margin-top: 3px; padding-left: 4px; }
</style>