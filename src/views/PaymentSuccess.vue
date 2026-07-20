<!-- src/views/PaymentSuccess.vue -->
<template>
    <div class="loading-container">
        <div v-if="isProcessing">
            <div class="spinner"></div>
            <h2>토스페이먼츠 결제 승인 요청 중...</h2>
            <p>{{ processingMessage }}</p>
        </div>

        <div v-else class="error-container">
            <h2>결제 처리 중 오류가 발생했습니다.</h2>
            <p class="error-msg">{{ errorMessage }}</p>

            <button type="button" @click="goHome">
                처음으로
            </button>
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

    const createFallbackItems = paymentData => {
        const sourceItems = paymentData.orderData
            ?.cartItems || paymentData.orderData
                ?.items || [];

        return sourceItems.map((item, index) => ({
            orderItemId: item.cartItemId || index,
            menuName: item.name || item.menus?.map(menu => menu.name).join(", ") || "상품",
            price: Number(item.unitPrice ?? item.totalPrice ?? 0),
            totalPrice: Number(item.unitPrice ?? item.totalPrice ?? 0) * Number(
                item.quantity || 1
            ),
            quantity: Number(item.quantity || 1)
        }));
    };

    const confirmPayment = async () => {
        const savedPaymentData = sessionStorage.getItem("paymentData");

        if (!savedPaymentData) {
            throw new Error("결제 정보를 찾을 수 없습니다.");
        }

        const paymentData = JSON.parse(savedPaymentData);

        const paymentKey = String(route.query.paymentKey || "");
        const tossOrderId = String(route.query.orderId || "");
        const amount = Number(route.query.amount || 0);
        const realOrderId = Number(paymentData.realOrderId);

        if (!paymentKey || !tossOrderId || amount <= 0 || !realOrderId) {
            throw new Error("결제 승인 정보가 올바르지 않습니다.");
        }

        /*
   * 포인트 차감·적립과 쿠폰 사용 처리는
   * PaymentService에서 하나의 트랜잭션으로 처리한다.
   * 별도의 reward API를 다시 호출하면 중복 적립될 수 있으므로 호출하지 않는다.
   */
        const confirmResponse = await api.post("/api/payments/toss-confirm", {
            orderId: String(realOrderId),
            tossOrderId,
            paymentKey,
            amount,
            method: paymentData.paymentMethod,
            phoneNumber: paymentData.phoneNumber || null,
            couponId: paymentData.couponId ?? null,
            pointUsed: Number(paymentData.pointUsed || 0)
        });

        if (
            confirmResponse.data
                ?.success !== true
        ) {
            throw new Error(
                confirmResponse.data
                    ?.message || "결제 승인에 실패했습니다."
            );
        }

        const serverReceipt = confirmResponse.data.receipt || {};

        const serverItems = Array.isArray(serverReceipt.items)
            ? serverReceipt.items
            : [];

        const receipt = {
            orderId: serverReceipt.orderId || realOrderId,
            receiptNo: serverReceipt.receiptNo || "N/A",
            waitingNo: serverReceipt.waitingNo || "N/A",
            orderTime: serverReceipt.orderTime || new Date().toLocaleString(),

            items: serverItems.length > 0
                ? serverItems
                : createFallbackItems(paymentData),

            paymentMethod: serverReceipt.paymentMethod || paymentData.paymentMethod,

            cardCompany: serverReceipt.cardCompany || "신용카드",

            originalAmount: Number(
                serverReceipt.originalAmount ?? paymentData.originalAmount ?? amount
            ),

            couponDiscount: Number(
                serverReceipt.couponDiscount ?? paymentData.couponDiscount ?? 0
            ),

            pointUsed: Number(serverReceipt.pointUsed ?? paymentData.pointUsed ?? 0),

            totalDiscount: Number(
                serverReceipt.totalDiscount ?? paymentData.totalDiscount ?? 0
            ),

            finalAmount: Number(
                serverReceipt.finalAmount ?? paymentData.finalAmount ?? amount
            ),

            pointEarned: Number(serverReceipt.pointEarned || 0),

            /*
     * 기존 OrderComplete.vue가 totalPrice를 사용해도
     * 실제 결제 금액이 표시되도록 호환 필드를 유지한다.
     */
            totalPrice: Number(
                serverReceipt.finalAmount ?? paymentData.finalAmount ?? amount
            )
        };

        sessionStorage.setItem("receiptData", JSON.stringify(receipt));

        sessionStorage.removeItem("paymentData");
        sessionStorage.removeItem("orderData");
        sessionStorage.removeItem("cartData");

        router.replace({
            name: "OrderComplete",
            query: {
                data: JSON.stringify(receipt)
            }
        });
    };

    const goHome = () => {
        sessionStorage.removeItem("paymentData");
        router.replace("/");
    };

    onMounted(async () => {
        try {
            await confirmPayment();
        } catch (error) {
            console.error("결제 승인 실패:", error);
            isProcessing.value = false;

            errorMessage.value = error.response
                ?.data
                    ?.message || error.message || "알 수 없는 오류가 발생했습니다.";
        }
    });
</script>

<style scoped="scoped">
    .loading-container {
        margin-top: 120px;
        text-align: center;
        font-family: sans-serif;
    }

    .spinner {
        width: 50px;
        height: 50px;
        margin: 0 auto 20px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3182f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .error-container button {
        padding: 11px 18px;
        border: 0;
        border-radius: 9px;
        background: #ff1493;
        color: #fff;
        cursor: pointer;
    }

    .error-msg {
        margin-top: 10px;
        color: #ff3333;
        font-weight: bold;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }

        to {
            transform: rotate(360deg);
        }
    }
</style>