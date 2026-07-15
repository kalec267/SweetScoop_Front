<script setup="setup">
    import {computed, onMounted, ref} from "vue";
    import {useRouter} from "vue-router";
    import api from "../api/axios";

    const router = useRouter();

    const orderData = ref({
        orderType: "",
        customerId: null,
        branchId: null,
        kioskId: null,
        iceCream: null,
        mochi: [],
        coffee: []
    });

    const paymentMethod = ref(null);
    const paying = ref(false);

    const orderTypeName = computed(() => {
        return orderData.value.orderType === "STORE"
            ? "매장"
            : "포장";
    });

    const mochiTotalPrice = computed(() => {
        return orderData
            .value
            .mochi
            .reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    });

    const coffeeTotalPrice = computed(() => {
        return orderData
            .value
            .coffee
            .reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    });

    const totalPrice = computed(() => {
        const iceCreamPrice = Number(
            orderData.value.iceCream
                ?.totalPrice
        ) || 0;

        return (iceCreamPrice + mochiTotalPrice.value + coffeeTotalPrice.value);
    });

    const orderName = computed(() => {
        const names = [];

        if (orderData.value.iceCream) {
            names.push(orderData.value.iceCream.sizeName || "아이스크림");
        }

        if (
            orderData.value.mochi
                ?.length > 0
        ) {
            names.push(`아이스모찌 ${orderData.value.mochi.length}개`);
        }

        if (
            orderData.value.coffee
                ?.length > 0
        ) {
            names.push(`커피 ${orderData.value.coffee.length}개`);
        }

        return names.length > 0
            ? names.join(", ")
            : "SweetScoop 주문";
    });

    const hasIceCream = computed(() => {
        return Boolean(orderData.value.iceCream);
    });

    const hasMochi = computed(() => {
        return orderData.value.mochi.length > 0;
    });

    const hasCoffee = computed(() => {
        return orderData.value.coffee.length > 0;
    });

    const loadOrderData = () => {
        const savedOrder = sessionStorage.getItem("orderData");

        if (!savedOrder) {
            alert("저장된 주문 정보가 없습니다.");
            router.push("/");
            return;
        }

        try {
            orderData.value = JSON.parse(savedOrder);

            console.log("결제 화면 주문 JSON:", orderData.value);
        } catch (error) {
            console.error("주문 JSON 파싱 실패:", error);

            sessionStorage.removeItem("orderData");

            alert("주문 정보를 불러오지 못했습니다.");

            router.push("/");
        }
    };

    const goBack = () => {
        router.back();
    };

    const goHome = () => {
        sessionStorage.removeItem("orderData");
        router.push("/");
    };

    const selectPaymentMethod = (method) => {
        paymentMethod.value = method;
    };

    const createOrderRequest = () => {
        const items = [];

        /*
     * 아이스크림 ORDERITEM
     */
        if (orderData.value.iceCream) {
            items.push({
                cupId: orderData.value.iceCream.cupId,
                sizeId: orderData.value.iceCream.sizeId,
                quantity: 1,
                totalPrice: Number(orderData.value.iceCream.totalPrice) || 0,

                menus: orderData
                    .value
                    .iceCream
                    .flavors
                    .map(flavor => ({menuId: flavor.menuId})),

                options: []
            });
        }

        return {
            customerId: orderData.value.customerId ?? 1,

            branchId: orderData.value.branchId ?? 1,

            kioskId: orderData.value.kioskId ?? 1,

            orderType: orderData.value.orderType,

            language: "KO",

            status: "PAYMENT_COMPLETE",

            createdAt: new Date()
                .toISOString()
                .slice(0, 19),

            waitingNo: null,
            receiptNo: `R${Date.now()}`,
            totalPrice: totalPrice.value,
            couponUsed: false,
            items,
            payment: {
                paymentMethod: paymentMethod.value,
                amount: totalPrice.value
            }
        };
    };

    const pay = async () => {
    if (paying.value) {
        return;
    }

    if (!paymentMethod.value) {
        alert("결제 수단을 선택해주세요.");
        return;
    }

    if (totalPrice.value <= 0) {
        alert("결제 금액을 확인해주세요.");
        return;
    }

    if (typeof window.TossPayments !== "function") {
        alert("결제 모듈을 불러오지 못했습니다.");
        return;
    }

    paying.value = true;

    try {
        const orderRequest = {
            ...createOrderRequest(),
            status: "PAYMENT_PENDING"
        };

        const orderResponse = await api.post(
            "/api/order",
            orderRequest
        );

        const realOrderId =
            orderResponse.data.orderId;

        if (!realOrderId) {
            throw new Error(
                "생성된 주문번호를 받지 못했습니다."
            );
        }

        const tossOrderId =
            `SWEETSCOOP-${realOrderId}-${Date.now()}`;

        const paymentData = {
            orderData: orderData.value,
            orderRequest,
            realOrderId,
            tossOrderId,
            paymentMethod: paymentMethod.value,
            amount: totalPrice.value,
            status: "READY"
        };

        sessionStorage.setItem(
            "paymentData",
            JSON.stringify(paymentData)
        );

        const tossPayments = window.TossPayments(
            "test_ck_GjLJoQ1aVZp0Bbwb0yl58w6KYe2R"
        );

        await tossPayments.requestPayment(
            paymentMethod.value,
            {
                amount: totalPrice.value,
                orderId: tossOrderId,
                orderName: orderName.value,

                successUrl:
                    `${window.location.origin}` +
                    `/payment/success?realOrderId=${realOrderId}`,

                failUrl:
                    `${window.location.origin}/payment`
            }
        );
    } catch (error) {
        console.error("결제 준비 실패:", error);

        alert(
            error.response?.data?.message ||
            error.message ||
            "결제 준비 중 오류가 발생했습니다."
        );
    } finally {
        paying.value = false;
    }
};

    onMounted(loadOrderData);
</script>

<template>
    <main class="payment-page">
        <header class="top-header">
            <button type="button" class="logo-button" @click="goHome">
                <img src="/images/home/logo.png" alt="SweetScoop"/>
            </button>

            <h1>주문 확인</h1>

            <button type="button" class="back-button" @click="goBack">
                이전
            </button>
        </header>

        <section class="order-type-box">
            <span>주문 방식</span>

            <strong>
                {{ orderTypeName }}
            </strong>
        </section>

        <!-- 아이스크림 -->
        <section v-if="hasIceCream" class="order-section">
            <div class="section-header">
                <h2>아이스크림</h2>

                <strong>
                    {{
                        Number(
                            orderData.iceCream.totalPrice
                        ).toLocaleString()
                    }}원
                </strong>
            </div>

            <div class="info-list">
                <div class="info-row">
                    <span>사이즈</span>

                    <strong>
                        {{ orderData.iceCream.sizeName }}
                    </strong>
                </div>

                <div class="info-row">
                    <span>제공 형태</span>

                    <strong>
                        {{ orderData.iceCream.cupName }}

                        <em
                            v-if="
                                Number(
                                    orderData.iceCream
                                        .additionalPrice
                                ) > 0
                            ">
                            +{{
                                Number(
                                    orderData.iceCream
                                        .additionalPrice
                                ).toLocaleString()
                            }}원
                        </em>
                    </strong>
                </div>
            </div>

            <div class="product-list">
                <article
                    v-for="flavor in orderData.iceCream.flavors"
                    :key="flavor.menuId"
                    class="product-card">

                    <img :src="flavor.menuImg" :alt="flavor.name"/>

                    <div class="product-info">

                        <h4>{{ flavor.name }}</h4>

                    </div>

                </article>
            </div>
        </section>

        <!-- 아이스모찌 -->
        <section v-if="hasMochi" class="order-section">
            <div class="section-header">
                <h2>아이스모찌</h2>

                <strong>
                    {{ mochiTotalPrice.toLocaleString() }}원
                </strong>
            </div>

            <div class="product-list">
                <article
                    v-for="item in orderData.mochi"
                    :key="item.menuId"
                    class="product-card">
                    <img :src="item.menuImg" :alt="item.name"/>

                    <p>
                        {{ item.name }}
                    </p>

                </article>
            </div>
        </section>

        <!-- 커피 -->
        <section v-if="hasCoffee" class="order-section">
            <div class="section-header">
                <h2>커피</h2>

                <strong>
                    {{ coffeeTotalPrice.toLocaleString() }}원
                </strong>
            </div>

            <div class="product-list">
                <article
                    v-for="item in orderData.coffee"
                    :key="item.menuId"
                    class="product-card">
                    <img :src="item.menuImg" :alt="item.name"/>

                    <p>
                        {{ item.name }}
                    </p>
                </article>
            </div>
        </section>

        <section class="method-section">
            <h3>결제 수단</h3>

            <div class="method-buttons">
                <button
                    type="button"
                    class="method-button card"
                    :class="{
                selected: paymentMethod === '카드'
            }"
                    :disabled="paying"
                    @click="selectPaymentMethod('카드')">
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
                    :class="{
                selected: paymentMethod === '간편결제'
            }"
                    :disabled="paying"
                    @click="selectPaymentMethod('간편결제')">
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

        <!-- JSON 확인 -->
        <details class="json-box">
            <summary>
                저장된 주문 JSON 보기
            </summary>

            <pre>{{ JSON.stringify(orderData, null, 2) }}</pre>
        </details>

        <!-- 하단 결제 영역 -->
        <footer class="payment-footer">
            <div class="total-row">
                <span>총 결제 금액</span>

                <strong>
                    {{ totalPrice.toLocaleString() }}원
                </strong>
            </div>

            <button
                type="button"
                class="payment-button"
                :disabled="paying || !paymentMethod"
                @click="pay">
                {{
        paying
            ? "결제창 실행 중..."
            : paymentMethod
                ? `${paymentMethod}로 결제하기`
                : "결제 수단을 선택해주세요"
    }}
            </button>
        </footer>
    </main>
</template>

<style scoped="scoped">
    :global(body) {
        margin: 0;
        background: #f3f3f3;
        font-family: "Malgun Gothic", "Segoe UI", sans-serif;
    }

    * {
        box-sizing: border-box;
    }

    button {
        font-family: inherit;
    }

    .payment-page {
        width: 100%;
        min-height: 100vh;
        margin: 0 auto;
        padding: 0 16px 145px;
        background: #fff;
    }

    /* 상단 */

    .top-header {
        height: 64px;
        display: grid;
        grid-template-columns: 56px 1fr 56px;
        align-items: center;
    }

    .logo-button {
        width: 44px;
        height: 44px;
        padding: 0;
        border: 0;
        background: transparent;
        cursor: pointer;
    }

    .logo-button img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .top-header h1 {
        margin: 0;
        text-align: center;
        color: #222;
        font-size: 18px;
    }

    .back-button {
        padding: 8px 10px;
        border: 0;
        border-radius: 18px;
        background: #ffe7f3;
        color: #d90072;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
    }

    /* 주문 방식 */

    .order-type-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 12px 0 18px;
        padding: 16px;
        border-radius: 15px;
        background: #fff3f9;
        font-size: 14px;
    }

    .order-type-box strong {
        color: #ff1493;
        font-size: 16px;
    }

    /* 공통 주문 영역 */

    .order-section {
        margin-bottom: 16px;
        padding: 17px;
        border: 1px solid #ededed;
        border-radius: 17px;
        background: #fff;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
    }

    .section-header h2 {
        margin: 0;
        font-size: 17px;
    }

    .section-header strong {
        color: #ff1493;
        font-size: 15px;
    }

    .info-list {
        margin-bottom: 13px;
    }

    .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        color: #666;
        font-size: 13px;
    }

    .info-row strong {
        color: #333;
    }

    .info-row em {
        margin-left: 5px;
        color: #ff1493;
        font-style: normal;
    }

    /* 선택 상품 */

    .product-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .product-card {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 12px;
        border: 1px solid #eee;
        border-radius: 15px;
        background: #fafafa;
    }

    .product-card img {
        width: 70px;
        height: 70px;
        object-fit: contain;
        flex-shrink: 0;
    }

    .product-card p {
        min-height: 30px;
        margin: 5px 0 2px;
        color: #444;
        font-size: 11px;
        line-height: 1.35;
    }

    .product-card span {
        color: #ff1493;
        font-size: 11px;
        font-weight: 700;
    }

    /* 결제 수단 */

    .payment-method-section {
        margin-bottom: 16px;
    }

    .payment-method-section h2 {
        margin: 0 0 12px;
        font-size: 17px;
    }

    .payment-method-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    .payment-method-list button {
        height: 68px;
        border: 2px solid #ececec;
        border-radius: 15px;
        background: #fff;
        color: #444;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
    }

    .payment-method-list button.selected {
        border-color: #ff1493;
        background: #fff2f8;
        color: #ff1493;
    }

    .method-icon {
        margin-right: 7px;
        font-size: 22px;
    }

    /* JSON */

    .json-box {
        margin-bottom: 20px;
        padding: 13px;
        border-radius: 13px;
        background: #f8f8f8;
        text-align: left;
    }

    .json-box summary {
        color: #777;
        font-size: 12px;
        cursor: pointer;
    }

    .json-box pre {
        max-height: 260px;
        margin: 12px 0 0;
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-all;
        color: #444;
        font-size: 10px;
        line-height: 1.5;
    }

    /* 하단 결제 */

    .payment-footer {
        width: 100%;
        position: fixed;
        left: 50%;
        bottom: 0;
        transform: translateX(-50%);
        padding: 15px 16px 18px;
        border-top: 1px solid #eeeeee;
        background: rgba(255, 255, 255, 0.98);
    }

    .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 11px;
        font-size: 14px;
    }

    .total-row strong {
        color: #ff1493;
        font-size: 22px;
    }

    .payment-button {
        width: 100%;
        padding: 17px;
        border: 0;
        border-radius: 30px;
        background: #ff1493;
        color: #fff;
        font-size: 18px;
        font-weight: 800;
        cursor: pointer;
    }

    .payment-button:disabled {
        background: #cccccc;
        cursor: not-allowed;
    }

    .product-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .product-info h4 {
        margin: 0;
        font-size: 17px;
        color: #222;
    }

    .product-info span {
        margin-top: 6px;
        color: #ff1493;
        font-weight: bold;
        font-size: 14px;
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
        transition: transform 0.2s, border-color 0.2s, background 0.2s;
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

    .method-button.selected {
        border-color: #ff1493;
        background: #fff2f8;
        box-shadow: 0 6px 18px rgba(255, 20, 147, 0.14);
    }

    .method-button.card.selected .method-name {
        color: #ff1493;
    }

    .method-button.toss.selected {
        border-color: #3182f6;
        background: #f2f7ff;
    }

    .payment-button:disabled {
        background: #cccccc;
        box-shadow: none;
        cursor: not-allowed;
    }
</style>