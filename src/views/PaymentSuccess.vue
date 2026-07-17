<template>
    <main class="payment-success-page">
        <section class="loading-box">
            <div class="spinner" aria-hidden="true"></div>

            <h1>결제를 확인하고 있습니다</h1>

            <p>
                결제 승인과 영수증 정보를 처리하고 있습니다.<br />
                잠시만 기다려 주세요.
            </p>
        </section>
    </main>
</template>

<script setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";

const route = useRoute();
const router = useRouter();

const API_URL = "/api/payments/toss-confirm";

const readPaymentData = () => {
    const saved = sessionStorage.getItem("paymentData");

    if (!saved) {
        throw new Error("저장된 결제 정보가 없습니다.");
    }

    try {
        return JSON.parse(saved);
    } catch (error) {
        throw new Error("저장된 결제 정보를 읽지 못했습니다.");
    }
};

const confirmPayment = async () => {
    /*
     * 토스가 successUrl에 자동으로 전달하는 Query Parameter
     */
    const paymentKey = route.query.paymentKey;
    const tossOrderId = route.query.orderId;
    const amount = Number(route.query.amount);

    const paymentData = readPaymentData();

    /*
     * MySQL ORDERS 테이블의 실제 PK입니다.
     * 프로젝트에서 사용하는 저장 필드명 차이를 함께 지원합니다.
     */
    const realOrderId =
        paymentData.realOrderId ??
        paymentData.dbOrderId ??
        paymentData.orderDbId ??
        paymentData.orderId;

    if (!realOrderId) {
        throw new Error("DB에 생성된 실제 주문 번호가 없습니다.");
    }

    if (!paymentKey) {
        throw new Error("토스 결제키가 없습니다.");
    }

    if (!tossOrderId) {
        throw new Error("토스 주문번호가 없습니다.");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("결제 금액이 올바르지 않습니다.");
    }

    const requestData = {
        /*
         * ORDERS 테이블 PK
         */
        orderId: String(realOrderId),

        /*
         * 토스 결제창에서 사용한 고유 주문번호
         */
        tossOrderId: String(tossOrderId),

        paymentKey: String(paymentKey),
        amount,

        /*
         * PaymentService가 토스 승인 응답의 method로 다시 설정하지만
         * 요청 단계에서도 기본값을 전달합니다.
         */
        method:
            paymentData.method ||
            paymentData.paymentMethod ||
            "카드",

        cardCompany:
            paymentData.cardCompany ||
            null,

        couponId:
            paymentData.couponId ??
            null
    };

    console.log("토스 결제 승인 요청:", requestData);

    const response = await axios.post(
        API_URL,
        requestData
    );

    if (!response.data?.success) {
        throw new Error(
            response.data?.message ||
            "결제 승인에 실패했습니다."
        );
    }

    const receipt = response.data.receipt;

    if (!receipt) {
        throw new Error(
            "백엔드에서 영수증 데이터를 반환하지 않았습니다."
        );
    }

    /*
     * history.state는 새로고침하면 상황에 따라 사라질 수 있으므로
     * sessionStorage에도 영수증을 함께 저장합니다.
     */
    sessionStorage.setItem(
        "receiptData",
        JSON.stringify(receipt)
    );

    await router.replace({
        name: "OrderComplete",
        state: {
            receipt
        }
    });
};

onMounted(async () => {
    try {
        await confirmPayment();
    } catch (error) {
        console.error(
            "결제 승인 처리 실패:",
            error.response?.data || error
        );

        alert(
            error.response?.data?.message ||
            error.message ||
            "결제 처리를 완료하지 못했습니다."
        );

        await router.replace("/payment");
    }
});
</script>

<style scoped>
*,
*::before,
*::after {
    box-sizing: border-box;
}

.payment-success-page {
    width: 100%;
    min-height: 100vh;
    padding: 24px;

    display: flex;
    align-items: center;
    justify-content: center;

    background: #fff7fb;
    font-family:
        "Pretendard",
        "Malgun Gothic",
        "Segoe UI",
        sans-serif;
}

.loading-box {
    width: min(100%, 420px);
    padding: 48px 30px;

    text-align: center;

    border-radius: 24px;
    background: #ffffff;
    box-shadow: 0 12px 36px rgba(57, 0, 35, 0.08);
}

.loading-box h1 {
    margin: 22px 0 10px;

    color: #390023;
    font-size: 26px;
    line-height: 1.3;
}

.loading-box p {
    margin: 0;

    color: #777777;
    font-size: 15px;
    line-height: 1.7;
}

.spinner {
    width: 58px;
    height: 58px;
    margin: 0 auto;

    border: 6px solid #ffe0ef;
    border-top-color: #ff1493;
    border-radius: 50%;

    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
