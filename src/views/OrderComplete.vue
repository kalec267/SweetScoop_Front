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
          <div class="menu-list">
            <div v-for="(item, index) in receipt.items" :key="index" class="row">
              <span>{{ item.menuName }} × {{ item.quantity }}</span>
              <span>{{ (item.price * item.quantity).toLocaleString() }}원</span>
            </div>
          </div>

        </div>
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
import { useRouter } from 'vue-router';
import { PrinterService } from '@/utils/printer';

const router = useRouter();
const receipt = ref(null);
const countdown = ref(7); 
let timerId = null;

onMounted(() => {
  if (history.state && history.state.receipt) {
    receipt.value = history.state.receipt;
    PrinterService.printReceipt(receipt.value);

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
/* 전체 컨테이너 */
.complete-container { 
  max-width: 450px; 
  margin: 50px auto; 
  padding: 20px;
  text-align: center; 
  font-family: 'Pretendard', sans-serif; /* 폰트가 있다면 적용 */
}

/* 카드 디자인 */
.receipt-card {
  background: white;
  padding: 40px 30px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  margin-bottom: 20px;
}

.success-icon { font-size: 60px; margin-bottom: 10px; }
h1 { font-size: 24px; margin-bottom: 10px; color: #1a1a1a; }
.guide-text { color: #666; font-size: 14px; margin-bottom: 30px; }

/* 대기번호 박스 */
.waiting-box { 
  background: #f0f7ff; 
  color: #3182f6; 
  padding: 20px; 
  border-radius: 20px; 
  margin-bottom: 30px; 
}
.waiting-box p { font-size: 14px; margin: 0; font-weight: 600; }
.waiting-box .number { font-size: 64px; font-weight: 800; margin-top: 5px; line-height: 1; }

/* 상세 정보 행 */
.info-container {
  border-top: 1px dashed #e2e8f0;
  padding-top: 20px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}
.label { color: #718096; }
.value { color: #2d3748; font-weight: 600; }
.amount { color: #3182f6; font-size: 16px; }

/* 타이머 */
.timer { color: #a0aec0; font-size: 14px; font-weight: bold; }

.menu-list {
  margin: 15px 0;
  border-bottom: 1px dashed #e5e7eb;
  padding-bottom: 10px;
}
.menu-list .row {
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
}
</style>