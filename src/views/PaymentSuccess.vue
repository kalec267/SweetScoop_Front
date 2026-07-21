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

<script setup="setup">
    import {onMounted, ref} from "vue";
    import {useRoute, useRouter} from "vue-router";
    import api from "../api/axios";

    const route = useRoute();
    const router = useRouter();

    const processingMessage = ref("잠시만 기다려주시면 영수증 발행이 완료됩니다.");
    const isProcessing = ref(true);
    const errorMessage = ref("");

    const confirmPayment = async () => {
        // 1. 데이터 가져오기
        const savedPaymentData = sessionStorage.getItem("paymentData");
        if (!savedPaymentData) 
            throw new Error("결제 정보를 찾을 수 없습니다.");
        
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

        if (
            confirmResponse.data
                ?.success === false
        ) 
            throw new Error("결제 승인 실패");
        
        // 3. 포인트 적립 (필요 시)
        const member = paymentData.orderData
            ?.member;
        if (
            member
                ?.isMember === true && member.memberId
        ) {
            await api.post("/api/order/members/reward", {
                memberId: member.memberId,
                orderId: realOrderId,
                paymentAmount: amount
            });
        }

        const receipt = {
            orderId: confirmResponse.data.receipt
                ?.orderId || realOrderId,
            receiptNo: confirmResponse.data.receipt
                ?.receiptNo || "N/A",
            waitingNo: confirmResponse.data.receipt
                ?.waitingNo || "N/A",
            orderTime: confirmResponse.data.receipt
                ?.orderTime || new Date().toLocaleString(),

            items: (paymentData.orderData.items || []).map(item => {
                let displayName = '';
                let flavorText = '';
                let optionsText = '';

                // 1. 상품명 및 사이즈 설정
                if (item.productType === 'ICE_CREAM') {
                    displayName = item.sizeName || item.name || '아이스크림';
                } else {
                    const productName = item.name || item.menuName || '상품';
                    const sizePrefix = item.sizeName
                        ? `(${item.sizeName}) `
                        : '';
                    displayName = `${sizePrefix}${productName}`;
                }

                // 2. 💡 아이스크림류일 때만 맛 선택 정보 추출
                if (item.productType === 'ICE_CREAM' && item.menus && Array.isArray(item.menus) && item.menus.length > 0) {
                    const flavorNames = item
                        .menus
                        .map(m => m.name || m)
                        .filter(Boolean);
                    if (flavorNames.length > 0) {
                        flavorText = flavorNames.join(', ');
                    }
                }

                // 3. 옵션 데이터 추출 (예: 샷 추가, 시럽 추가 등)
                if (item.options) {
                    if (Array.isArray(item.options)) {
                        optionsText = item
                            .options
                            .map(opt => (
                                typeof opt === 'object' && opt !== null
                                    ? (opt.name || opt.label || '')
                                    : opt
                            ))
                            .filter(Boolean)
                            .join(', ');
                    } else if (typeof item.options === 'object') {
                        optionsText = item.options.name || item.options.label || '';
                    } else {
                        optionsText = String(item.options);
                    }
                }

                return {
                    menuName: displayName, flavors: flavorText, // 아이스크림에만 맛 정보가 담기고 모찌/커피는 빈 값 처리
                    options: optionsText,
                    price: Number(item.unitPrice || item.price || 0),
                    quantity: Number(item.quantity || 1)
                };
            }),

            paymentMethod: paymentData.paymentMethod,
            cardCompany: confirmResponse.data.receipt
                ?.cardCompany || "신용카드",
            totalPrice: confirmResponse.data.receipt
                ?.totalPrice || amount
        };

        // 5. 세션 클리어 및 장바구니 데이터 강제 초기화
        sessionStorage.removeItem("paymentData");
        sessionStorage.removeItem("orderData");

        // 프로젝트에서 사용될 수 있는 모든 장바구니 키 후보군 일괄 삭제
        const cartKeys = [
            "cart",
            "cartItems",
            "shoppingCart",
            "basket",
            "cartList",
            "cart_items",
            "orderItems"
        ];
        cartKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        // 💡 Pinia 또는 전역 상태/컴포넌트에서 장바구니 변경을 감지하도록 이벤트 전송
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('cart-cleared'));

        router.replace({
            name: "OrderComplete",
            query: {
                data: JSON.stringify(receipt)
            }
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

<style scoped="scoped">
    .loading-container {
        text-align: center;
        margin-top: 120px;
        font-family: sans-serif;
    }
    .spinner {
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3182f6;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    .error-msg {
        color: #ff3333;
        margin-top: 10px;
        font-weight: bold;
    }
    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>