<!-- Payment.vue 페이지에서 총 금액과 결제 수단을 결정하기 때문에 필요 없는 페이지 -->
<!--
<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const loading = ref(true);
const requesting = ref(false);

const orderData = ref({
    orderType: "",
    customerId: null,
    branchId: null,
    kioskId: null,
    iceCream: null,
    mochi: [],
    coffee: []
});

/*
 * 아이스모찌 총액
 */
const mochiTotalPrice = computed(() => {
    return (orderData.value.mochi || []).reduce(
        (sum, item) => sum + (Number(item.price) || 0),
        0
    );
});

/*
 * 커피 총액
 */
const coffeeTotalPrice = computed(() => {
    return (orderData.value.coffee || []).reduce(
        (sum, item) => sum + (Number(item.price) || 0),
        0
    );
});

/*
 * 전체 결제 금액
 */
const totalPrice = computed(() => {
    const iceCreamPrice =
        Number(orderData.value.iceCream?.totalPrice) || 0;

    return (
        iceCreamPrice +
        mochiTotalPrice.value +
        coffeeTotalPrice.value
    );
});

/*
 * 주문 방식 한글 표시
 */
const orderTypeName = computed(() => {
    return orderData.value.orderType === "STORE"
        ? "매장"
        : "포장";
});

/*
 * 주문명 생성
 */
const orderName = computed(() => {
    const names = [];

    if (orderData.value.iceCream) {
        names.push(
            orderData.value.iceCream.sizeName || "아이스크림"
        );
    }

    if (orderData.value.mochi?.length > 0) {
        names.push(`아이스모찌 ${orderData.value.mochi.length}개`);
    }

    if (orderData.value.coffee?.length > 0) {
        names.push(`커피 ${orderData.value.coffee.length}개`);
    }

    return names.length > 0
        ? names.join(", ")
        : "SweetScoop 키오스크 주문";
});

/*
 * sessionStorage에서 주문 JSON 조회
 */
const loadOrderData = () => {
    const savedOrder = sessionStorage.getItem("orderData");

    if (!savedOrder) {
        alert("결제할 주문 정보가 없습니다.");
        router.replace("/");
        return;
    }

    try {
        orderData.value = JSON.parse(savedOrder);

        console.log(
            "PaymentView 주문 JSON:",
            orderData.value
        );

        if (totalPrice.value <= 0) {
            alert("결제 금액을 확인해주세요.");
            router.replace("/payment");
            return;
        }

        loading.value = false;
    } catch (error) {
        console.error("주문 JSON 변환 실패:", error);

        alert("주문 정보를 읽을 수 없습니다.");
        sessionStorage.removeItem("orderData");

        router.replace("/");
    }
};

/*
 * 토스 결제창 실행
 */
const triggerTossSDK = async (methodType) => {
    if (requesting.value) {
        return;
    }

    if (totalPrice.value <= 0) {
        alert("결제 금액을 확인해주세요.");
        return;
    }

    if (typeof window.TossPayments !== "function") {
        alert(
            "결제 모듈을 불러오지 못했습니다. 페이지를 새로고침해주세요."
        );
        return;
    }

    requesting.value = true;

    /*
     * 결제 전에는 ORDERS.id가 아직 없으므로
     * 토스 결제 요청용 고유 번호를 생성
     */
    const tossOrderId =
        `SWEETSCOOP-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase()}`;

    /*
     * 결제 성공 화면에서 주문 데이터를 찾기 위해
     * 토스 주문번호를 JSON에 함께 저장
     */
    const paymentDraft = {
        ...orderData.value,

        payment: {
            tossOrderId,
            methodType,
            amount: totalPrice.value,
            status: "READY"
        }
    };

    sessionStorage.setItem(
        "orderData",
        JSON.stringify(paymentDraft)
    );

    try {
        const tossPayments = window.TossPayments(
            "test_ck_GjLJoQ1aVZp0Bbwb0yl58w6KYe2R"
        );

        await tossPayments.requestPayment(methodType, {
            amount: totalPrice.value,
            orderId: tossOrderId,
            orderName: orderName.value,

            successUrl:
                `${window.location.origin}` +
                `/payment/success`,

            failUrl:
                `${window.location.origin}` +
                `/payment/view`
        });
    } catch (error) {
        console.error("결제창 실행 실패:", error);

        /*
         * 사용자가 결제창을 직접 닫은 경우에도
         * 오류 객체가 반환될 수 있음
         */
        if (error?.code !== "USER_CANCEL") {
            alert(
                `결제창 구동 오류: ${
                    error?.message || "알 수 없는 오류"
                }`
            );
        }
    } finally {
        requesting.value = false;
    }
};

const goBack = () => {
    router.push("/payment");
};

onMounted(loadOrderData);
</script>

<template>
    <main class="payment-view">
        <header class="top-header">
            <img
                src="/images/home/logo.png"
                alt="SweetScoop"
                class="logo"
            />

            <h1>결제 수단 선택</h1>

            <button
                type="button"
                class="back-button"
                @click="goBack"
            >
                이전
            </button>
        </header>

        <section v-if="loading" class="loading-box">
            결제 정보를 불러오는 중입니다.
        </section>

        <template v-else>
            <section class="title-section">
                <span class="step">PAYMENT</span>

                <h2>결제 수단을 선택해주세요</h2>

                <p>
                    결제 수단을 선택하면 결제창이 실행됩니다.
                </p>
            </section>
-->

            <!-- 주문 요약 -->
            <section class="order-summary">
                <div class="summary-row">
                    <span>주문 방식</span>

                    <strong>{{ orderTypeName }}</strong>
                </div>

                <div class="summary-row">
                    <span>주문 상품</span>

                    <strong class="order-name">
                        {{ orderName }}
                    </strong>
                </div>

                <div
                    v-if="orderData.iceCream"
                    class="summary-row"
                >
                    <span>사이즈</span>

                    <strong>
                        {{ orderData.iceCream.sizeName }}
                    </strong>
                </div>

                <div
                    v-if="orderData.iceCream"
                    class="summary-row"
                >
                    <span>제공 형태</span>

                    <strong>
                        {{ orderData.iceCream.cupName }}
                    </strong>
                </div>
            </section>

            <!-- 결제 금액 -->
            <section class="price-box">
                <span>총 결제 금액</span>

                <strong>
                    {{ totalPrice.toLocaleString() }}원
                </strong>
            </section>

            <!-- 결제 수단 -->
            <section class="method-section">
                <h3>결제 수단</h3>

                <div class="method-buttons">
                    <button
                        type="button"
                        class="method-button card"
                        :disabled="requesting"
                        @click="triggerTossSDK('카드')"
                    >
                        <span class="method-icon">💳</span>

                        <span class="method-name">
                            신용카드
                        </span>

                        <small>
                            신용카드 · 삼성페이
                        </small>
                    </button>

                    <button
                        type="button"
                        class="method-button toss"
                        :disabled="requesting"
                        @click="triggerTossSDK('간편결제')"
                    >
                        <span class="toss-icon">TOSS</span>

                        <span class="method-name">
                            간편결제
                        </span>

                        <small>
                            토스페이 · 간편결제
                        </small>
                    </button>
                </div>
            </section>

            <p class="payment-guide">
                결제 완료 후 주문 정보가 서버에 저장됩니다.
            </p>
        </template>

        <div v-if="requesting" class="request-overlay">
            <div class="request-box">
                <div class="spinner"></div>

                <p>결제창을 실행하고 있습니다.</p>
            </div>
        </div>
    </main>
</template>

<style scoped>
:global(body) {
    margin: 0;
    background: #eeeeee;
    font-family:
        "Malgun Gothic",
        "Segoe UI",
        sans-serif;
}

* {
    box-sizing: border-box;
}

button {
    font-family: inherit;
}

.payment-view {
    width: 100%;
    min-height: 100vh;
    margin: 0 auto;
    padding: 0 18px 40px;
    background: #ffffff;
}

.top-header {
    height: 66px;
    display: grid;
    grid-template-columns: 55px 1fr 55px;
    align-items: center;
}

.logo {
    width: 44px;
    height: 44px;
    object-fit: contain;
}

.top-header h1 {
    margin: 0;
    text-align: center;
    color: #222222;
    font-size: 17px;
}

.back-button {
    padding: 8px 9px;
    border: 0;
    border-radius: 18px;
    background: #ffe8f3;
    color: #d90072;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
}

.title-section {
    padding: 30px 0 26px;
    text-align: center;
}

.step {
    color: #ff1493;
    font-size: 11px;
    font-weight: 800;
}

.title-section h2 {
    margin: 8px 0;
    color: #222222;
    font-size: 24px;
}

.title-section p {
    margin: 0;
    color: #999999;
    font-size: 12px;
}

.order-summary {
    margin-bottom: 15px;
    padding: 18px;
    border: 1px solid #eeeeee;
    border-radius: 18px;
    background: #ffffff;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 12px;
    color: #777777;
    font-size: 13px;
}

.summary-row:last-child {
    margin-bottom: 0;
}

.summary-row strong {
    color: #333333;
    text-align: right;
}

.order-name {
    max-width: 270px;
    line-height: 1.5;
}

.price-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    padding: 20px;
    border-radius: 18px;
    background: #fff3f9;
    font-size: 14px;
}

.price-box strong {
    color: #ff1493;
    font-size: 23px;
}

.method-section h3 {
    margin: 0 0 13px;
    color: #222222;
    font-size: 16px;
}

.method-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.method-button {
    min-height: 170px;
    padding: 20px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2px solid #eeeeee;
    border-radius: 20px;
    background: #ffffff;
    cursor: pointer;
    transition:
        transform 0.2s,
        border-color 0.2s,
        background 0.2s;
}

.method-button:hover {
    transform: translateY(-4px);
    border-color: #ff8fc8;
    background: #fff8fc;
}

.method-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.method-icon {
    margin-bottom: 15px;
    font-size: 42px;
}

.toss-icon {
    width: 66px;
    height: 66px;
    margin-bottom: 15px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: #3182f6;
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
}

.method-name {
    color: #222222;
    font-size: 15px;
    font-weight: 800;
}

.method-button small {
    margin-top: 7px;
    color: #999999;
    font-size: 10px;
}

.method-button.toss .method-name {
    color: #3182f6;
}

.payment-guide {
    margin: 25px 0 0;
    text-align: center;
    color: #aaaaaa;
    font-size: 11px;
}

.loading-box {
    padding: 180px 0;
    text-align: center;
    color: #999999;
    font-size: 13px;
}

.request-overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.32);
}

.request-box {
    width: 230px;
    padding: 28px;
    border-radius: 20px;
    background: #ffffff;
    text-align: center;
}

.request-box p {
    margin: 15px 0 0;
    color: #555555;
    font-size: 13px;
}

.spinner {
    width: 38px;
    height: 38px;
    margin: 0 auto;
    border: 4px solid #ffe1ef;
    border-top-color: #ff1493;
    border-radius: 50%;
    animation: rotate 0.8s linear infinite;
}

@keyframes rotate {
    to {
        transform: rotate(360deg);
    }
}

@media (max-width: 420px) {
    .method-buttons {
        grid-template-columns: 1fr;
    }

    .method-button {
        min-height: 130px;
    }
}
</style>
-->