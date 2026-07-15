<!-- 결제 성공 시 출력되는 페이지 -->

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../api/axios";

const route = useRoute();
const router = useRouter();

const processingMessage = ref(
    "토스페이먼츠 결제 승인 요청 중..."
);

const isProcessing = ref(true);
const errorMessage = ref("");

/*
 * 결제 승인 처리
 */
const confirmPayment = async () => {

    /*
     * 토스가 성공 URL에 전달하는 값
     *
     * paymentKey
     * orderId
     * amount
     */
    const paymentKey = String(
        route.query.paymentKey || ""
    );

    const tossOrderId = String(
        route.query.orderId || ""
    );

    const amount = Number(
        route.query.amount || 0
    );

    /*
     * Payment.vue의 successUrl에 추가한
     * 실제 ORDERS.id
     */
    const queryRealOrderId = Number(
        route.query.realOrderId || 0
    );

    console.log("토스 성공 파라미터:", {
        paymentKey,
        tossOrderId,
        amount,
        queryRealOrderId
    });

    /*
     * Payment.vue에서 저장한 결제 준비 정보
     */
    const savedPaymentData =
        sessionStorage.getItem("paymentData");

    if (!savedPaymentData) {
        throw new Error(
            "저장된 결제 정보를 찾을 수 없습니다."
        );
    }

    let paymentData;

    try {
        paymentData = JSON.parse(savedPaymentData);
    } catch (error) {
        console.error(
            "paymentData JSON 변환 실패:",
            error
        );

        throw new Error(
            "저장된 결제 정보가 올바르지 않습니다."
        );
    }

    /*
     * sessionStorage에 저장된 실제 주문번호를 우선 사용
     */
    const realOrderId = Number(
        paymentData.realOrderId ||
        queryRealOrderId ||
        0
    );

    if (!paymentKey) {
        throw new Error(
            "결제 키가 전달되지 않았습니다."
        );
    }

    if (!tossOrderId) {
        throw new Error(
            "토스 주문번호가 전달되지 않았습니다."
        );
    }

    if (amount <= 0) {
        throw new Error(
            "결제 금액이 올바르지 않습니다."
        );
    }

    if (!realOrderId) {
        throw new Error(
            "실제 주문번호를 찾을 수 없습니다."
        );
    }

    /*
     * 토스 주문번호 검증
     */
    if (
        String(paymentData.tossOrderId) !==
        tossOrderId
    ) {
        throw new Error(
            "결제 주문번호가 일치하지 않습니다."
        );
    }

    /*
     * 금액 검증
     */
    if (
        Number(paymentData.amount) !==
        amount
    ) {
        throw new Error(
            "결제 요청 금액과 승인 금액이 일치하지 않습니다."
        );
    }

    processingMessage.value =
        "결제 승인 정보를 확인하고 있습니다.";

    /*
     * 백엔드에서:
     *
     * 1. ORDERS 조회
     * 2. 주문 금액 검증
     * 3. 토스 승인 API 호출
     * 4. PAYMENT 저장
     * 5. ORDERS.status 변경
     */
    const confirmResponse = await api.post(
        "/api/payments/toss-confirm",
        {
            orderId: realOrderId,
            tossOrderId,
            paymentKey,
            amount,
            method: paymentData.paymentMethod
        }
    );

    console.log(
        "토스 결제 승인 응답:",
        confirmResponse.data
    );

    if (
    confirmResponse.data?.success === false
) {
    throw new Error(
        confirmResponse.data.message ||
        "결제 승인이 실패했습니다."
    );
}

/*
 * 회원 주문이면 결제 성공 후 5% 포인트 적립
 */
const member =
    paymentData.orderData?.member;

let rewardResult = null;

if (
    member?.isMember === true &&
    member.memberId
) {
    processingMessage.value =
        "회원 포인트를 적립하고 있습니다.";

    const rewardResponse = await api.post(
        "/api/order/members/reward",
        {
            memberId: member.memberId,
            orderId: realOrderId,
            paymentAmount: amount
        }
    );

    rewardResult = rewardResponse.data;

    console.log(
        "회원 포인트 적립 결과:",
        rewardResult
    );
}

processingMessage.value =
    "영수증을 발행하고 있습니다.";

    /*
     * 주문 완료 화면에서 사용할 데이터
     */
    const receiptData = {
    orderId: realOrderId,

    receiptNo:
        confirmResponse.data?.receiptNo ||
        paymentData.orderRequest?.receiptNo ||
        null,

    orderType:
        paymentData.orderData?.orderType,

    amount,

    paymentMethod:
        paymentData.paymentMethod,

    paymentKey,
    tossOrderId,

    approvedAt:
        confirmResponse.data?.approvedAt ||
        new Date().toISOString(),

    receipt:
        confirmResponse.data?.receipt ||
        null,

    orderData:
        paymentData.orderData,

    member: member || null,

    pointReward: rewardResult
        ? {
            memberId: rewardResult.id,
            totalPoint:
                Number(rewardResult.point) || 0,

            earnedPoint:
                Math.floor(amount * 0.05)
        }
        : null
};

    sessionStorage.setItem(
        "receiptData",
        JSON.stringify(receiptData)
    );

    /*
     * 성공한 결제 준비 정보 제거
     */
    sessionStorage.removeItem("paymentData");
    sessionStorage.removeItem("orderData");

    processingMessage.value =
        "주문 처리가 완료되었습니다.";

    router.replace({
        name: "OrderComplete"
    });
};

onMounted(async () => {
    try {
        await confirmPayment();
    } catch (error) {
        console.error(
            "결제 승인 처리 실패:",
            error
        );

        isProcessing.value = false;

        errorMessage.value =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "결제 처리 중 오류가 발생했습니다.";
    }
});

const goHome = () => {
    sessionStorage.removeItem("paymentData");
    sessionStorage.removeItem("orderData");

    router.replace("/");
};

const retry = () => {
    router.replace("/payment");
};
</script>

<template>
    <main class="payment-success-page">
        <section
            v-if="isProcessing"
            class="loading-container"
        >
            <div class="spinner"></div>

            <h2>{{ processingMessage }}</h2>

            <p>
                잠시만 기다려주시면 영수증 발행이 완료됩니다.
            </p>
        </section>

        <section
            v-else
            class="error-container"
        >
            <div class="error-icon">!</div>

            <h2>결제 처리를 완료하지 못했습니다</h2>

            <p>{{ errorMessage }}</p>

            <div class="button-group">
                <button
                    type="button"
                    class="retry-button"
                    @click="retry"
                >
                    결제 화면으로
                </button>

                <button
                    type="button"
                    class="home-button"
                    @click="goHome"
                >
                    처음으로
                </button>
            </div>
        </section>
    </main>
</template>

<style scoped>
:global(body) {
    margin: 0;
    background: #f3f3f3;
    font-family:
        "Malgun Gothic",
        "Segoe UI",
        sans-serif;
}

* {
    box-sizing: border-box;
}

.payment-success-page {
    width: min(100%, 540px);
    min-height: 100vh;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 30px;
    background: #ffffff;
}

.loading-container,
.error-container {
    width: 100%;
    text-align: center;
}

.spinner {
    width: 56px;
    height: 56px;
    margin: 0 auto 25px;
    border: 6px solid #ffe3f1;
    border-top-color: #ff1493;
    border-radius: 50%;
    animation: spin 0.85s linear infinite;
}

.loading-container h2,
.error-container h2 {
    margin: 0 0 12px;
    color: #222222;
    font-size: 21px;
}

.loading-container p,
.error-container p {
    margin: 0;
    color: #888888;
    font-size: 13px;
    line-height: 1.6;
}

.error-icon {
    width: 60px;
    height: 60px;
    margin: 0 auto 22px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: #fff0f3;
    color: #f04452;
    font-size: 30px;
    font-weight: 900;
}

.button-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 28px;
}

.button-group button {
    height: 52px;
    border-radius: 26px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
}

.retry-button {
    border: 0;
    background: #ff1493;
    color: #ffffff;
}

.home-button {
    border: 1px solid #dddddd;
    background: #ffffff;
    color: #555555;
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