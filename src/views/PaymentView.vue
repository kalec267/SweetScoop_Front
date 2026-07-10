<template>
  <div class="payment-container">
    <h2>결제 수단을 선택해 주세요</h2>
    <div class="summary">
      <p>실제 내부 주문번호: {{ orderInfo.orderId }}번</p>
      <p>결제 금액: <strong>{{ orderInfo.amount.toLocaleString() }}</strong> 원</p>
    </div>
    <div class="method-buttons">
      <button class="btn-card" @click="triggerTossSDK('카드')">💳 <br>신용카드 / 삼성페이</button>
      <button class="btn-toss" @click="triggerTossSDK('간편결제')">🔵 <br>토스페이 / 간편결제</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const orderInfo = ref({ orderId: 1, amount: 15500 }); // 백업용 하드코딩 기본값 매핑

onMounted(() => {
  if (history.state && history.state.orderId) {
    orderInfo.value.orderId = history.state.orderId;
    orderInfo.value.amount = history.state.amount;
  }
});

const triggerTossSDK = (methodType) => {
  // 토스페이먼츠 공용 테스트 클라이언트 키 객체 구동
  const tossPayments = window.TossPayments('test_ck_GjLJoQ1aVZp0Bbwb0yl58w6KYe2R');
  
  // 토스 정책 상 동일 orderId 재사용 차단을 위한 고유 난수 스트링 조합
  const tossUniqueString = 'SWEET-SCOOP-' + orderInfo.value.orderId + '-' + new Date().getTime();

  tossPayments.requestPayment(methodType, {
    amount: orderInfo.value.amount,
    orderId: tossUniqueString,
    orderName: '달콤강남점 아이스크림 키오스크 결제',
    successUrl: window.location.origin + '/payment/success?realOrderId=' + orderInfo.value.orderId + '&tossOrderId=' + tossUniqueString,
    failUrl: window.location.origin + '/'
  }).catch((err) => { // 💡 -> 를 => 로 변경
  alert('결제창 구동 오류: ' + err.message);
  }); 
};
</script>

<style scoped>
.payment-container { max-width: 500px; margin: 80px auto; text-align: center; font-family: sans-serif; }
.summary { background: #f9fafb; padding: 25px; border-radius: 16px; margin-bottom: 30px; font-size: 18px; }
.method-buttons { display: flex; gap: 20px; }
.btn-card, .btn-toss { flex: 1; padding: 30px 10px; font-size: 18px; border-radius: 16px; border: 1px solid #e5e8eb; background: white; font-weight: bold; cursor: pointer; }
.btn-card:hover { background: #f2f3f5; }
.btn-toss { color: #3182f6; }
.btn-toss:hover { background: #e8f3ff; }
</style>