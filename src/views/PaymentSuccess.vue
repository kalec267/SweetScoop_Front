<template>
  <div class="loading-container">
    <div class="spinner"></div>
    <h2>토스페이먼츠 결제 승인 요청 중...</h2>
    <p>잠시만 기다려주시면 영수증 발행이 완료됩니다.</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  // URL 파라미터에서 값을 안전하게 가져오기
  const paymentKey = route.query.paymentKey;
  const tossOrderId = route.query.tossOrderId;
  const amount = route.query.amount;
  const realOrderId = route.query.realOrderId; // 여기서 정의됨

  // 디버깅용 로그 (F12 콘솔에서 확인 가능)
  console.log("전달받은 데이터:", { paymentKey, tossOrderId, amount, realOrderId });

  // realOrderId가 비어있는지 체크
  if (!realOrderId) {
    alert("결제 정보를 찾을 수 없습니다.");
    router.push('/');
    return;
  }

  try {
    const response = await axios.post('http://localhost:8888/api/payments/toss-confirm', {
      orderId: realOrderId,       // 이제 String으로 보냅니다
      tossOrderId: tossOrderId,
      paymentKey: paymentKey,
      amount: parseInt(amount),
      method: paymentKey ? '신용카드' : '간편결제'
    });

    if (response.data.success) {
      router.push({
        name: 'OrderComplete',
        state: { receipt: response.data.receipt }
      });
    } else {
      alert('결제 승인 실패: ' + response.data.message);
      router.push('/');
    }
  } catch (err) {
    console.error(err);
    alert('백엔드 연동 중 에러가 발생했습니다.');
    router.push('/');
  }
});
</script>

<style scoped>
.loading-container { text-align: center; margin-top: 120px; font-family: sans-serif; }
.spinner { border: 5px solid #f3f3f3; border-top: 5px solid #3182f6; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>