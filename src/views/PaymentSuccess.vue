<!-- src/views/PaymentSuccess.vue -->
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
  import api from "../api/axios";
  
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
  
      // 4. receipt 객체 생성 (맛/옵션 데이터 디버깅 및 통합 매핑)
    const receipt = {
        orderId: confirmResponse.data.receipt?.orderId || realOrderId,
        receiptNo: confirmResponse.data.receipt?.receiptNo || "N/A",
        waitingNo: confirmResponse.data.receipt?.waitingNo || "N/A",
        orderTime: confirmResponse.data.receipt?.orderTime || new Date().toLocaleString(),
        
        items: (paymentData.orderData.items || []).map(item => {
            // 💡 F12 개발자 도구 콘솔에서 각 상품의 키 구조를 눈으로 확인할 수 있습니다.
            console.log("🔍 [디버깅] 현재 아이템 전체 구조:", item);

            const baseName = item.menuName || item.name || '상품';
            
            // 사이즈 정제
            let rawSize = item.sizeName || item.size || '';
            const size = rawSize.toString().replace(/[()]/g, '').trim();

            // 맛/옵션 데이터가 존재할 수 있는 모든 키 이름 확장 탐색
            const options = item.flavors || 
                            item.flavorList || 
                            item.selectedFlavors || 
                            item.options || 
                            item.flavor || 
                            item.tastes || 
                            item.iceCream?.flavors || 
                            item.selectedFlavorList;

            let extraInfo = [];
            
            if (size && size !== baseName) {
                extraInfo.push(size);
            }

            if (options && Array.isArray(options) && options.length > 0) {
                const optionNames = options.map(o => {
                    if (typeof o === 'string') return o;
                    return o.name || o.flavorName || o.title || o.tasteName || '';
                }).filter(Boolean).join(', ');

                if (optionNames) {
                    extraInfo.push(optionNames);
                }
            }

            let displayName = baseName;
            if (extraInfo.length > 0) {
                displayName = `${baseName} (${extraInfo.join(', ')})`;
            }

            return {
                menuName: displayName,
                price: item.price || item.menuPrice || item.amount || item.totalPrice || 0,
                quantity: item.quantity || item.qty || 1
            };
        }),
        
        paymentMethod: paymentData.paymentMethod,
        cardCompany: confirmResponse.data.receipt?.cardCompany || "신용카드",
        totalPrice: confirmResponse.data.receipt?.totalPrice || amount
    };
  
      // 5. 세션 클리어 및 장바구니 초기화
      sessionStorage.removeItem("paymentData");
      sessionStorage.removeItem("orderData");
      
      localStorage.removeItem("cart");
      localStorage.removeItem("cartItems");
      localStorage.removeItem("shoppingCart");
      sessionStorage.removeItem("cart");
      sessionStorage.removeItem("cartItems");
  
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