<template>
  <div class="loading-container">
    <div v-if="isProcessing">
      <div class="spinner"></div>
      <h2>토스페이먼츠 결제 승인 요청 중...</h2>
      <p>{{ processingMessage }}</p>
    </div>
    <div v-else class="error-container">
      <h2>결제 처리 중 에러가 발생했습니다.</h2>
      <p class="error-msg">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../api/axios"; // 프로젝트 내 API 경로

const route = useRoute();
const router = useRouter();

const processingMessage = ref("잠시만 기다려주시면 영수증 발행이 완료됩니다.");
const isProcessing = ref(true);
const errorMessage = ref("");

const confirmPayment = async () => {
    // 1. 데이터 가져오기
    const savedPaymentData = sessionStorage.getItem("paymentData");
    if (!savedPaymentData) throw new Error("결제 정보를 찾을 수 없습니다.");
    
    const paymentData = JSON.parse(savedPaymentData);
    const paymentKey = String(route.query.paymentKey || "");
    const tossOrderId = String(route.query.orderId || "");
    const amount = Number(route.query.amount || 0);
    const realOrderId = Number(paymentData.realOrderId);

    // 2. 서버 결제 승인 API 호출
    const confirmResponse = await api.post("/api/payments/toss-confirm", {
        orderId: realOrderId,
        tossOrderId,
        paymentKey,
        amount,
        method: paymentData.paymentMethod
    });
    
    console.log("서버에서 온 응답 데이터(confirmResponse.data):", confirmResponse.data);
    console.log("주문 정보 데이터(paymentData):", paymentData);
    console.log("아이템이 담겨있을 곳 추적:", paymentData.orderData);

    if (confirmResponse.data?.success === false) throw new Error("결제 승인 실패");

    // 3. 포인트 적립 (필요 시)
    const member = paymentData.orderData?.member;
    if (member?.isMember === true && member.memberId) {
        await api.post("/api/order/members/reward", {
            memberId: member.memberId,
            orderId: realOrderId,
            paymentAmount: amount
        });
    }

    // 4. receipt 객체 생성
    const receipt = {
        orderId: confirmResponse.data.receipt?.orderId || realOrderId,
        receiptNo: confirmResponse.data.receipt?.receiptNo || "N/A",
        waitingNo: confirmResponse.data.receipt?.waitingNo || "N/A",
        orderTime: confirmResponse.data.receipt?.orderTime || new Date().toLocaleString(),
        
        // 메뉴 정보 매핑
        items: [
            ...(paymentData.orderData.iceCream ? [{
                menuName: `${paymentData.orderData.iceCream.sizeName} (${
                    (paymentData.orderData.iceCream.flavors || [])
                        .map(f => f.name)
                        .join(', ')
                })`,
                price: paymentData.orderData.iceCream.totalPrice || 0,
                quantity: 1
            }] : []),
            ...(paymentData.orderData.coffee?.length > 0 ? paymentData.orderData.coffee.map(c => ({
                menuName: c.name || '커피',
                price: c.price || 0,
                quantity: c.qty || 1
            })) : []),
            ...(paymentData.orderData.mochi?.length > 0 ? paymentData.orderData.mochi.map(m => ({
                menuName: m.name || '모찌',
                price: m.price || 0,
                quantity: m.qty || 1
            })) : [])
        ],
        
        paymentMethod: paymentData.paymentMethod,
        cardCompany: confirmResponse.data.receipt?.cardCompany || "신용카드",
        totalPrice: confirmResponse.data.receipt?.totalPrice || amount
    };

    // 5. 세션 클리어 및 페이지 이동
    sessionStorage.removeItem("paymentData");
    sessionStorage.removeItem("orderData");

    router.replace({
        name: "OrderComplete",
        query: { data: JSON.stringify(receipt) }
    });
};

onMounted(async () => {
  try {
      await confirmPayment();
  } catch (error) {
      console.error("결제 승인 실패 디버깅:", error);
      isProcessing.value = false;
      errorMessage.value = error.message || "알 수 없는 오류가 발생했습니다.";
      
      alert(`백엔드 연동 중 에러가 발생했습니다: ${errorMessage.value}`);
      router.push('/');
  }
});
</script>

<style scoped>
.loading-container { text-align: center; margin-top: 120px; font-family: sans-serif; }
.spinner { border: 5px solid #f3f3f3; border-top: 5px solid #3182f6; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
.error-msg { color: #ff3333; margin-top: 10px; font-weight: bold; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>