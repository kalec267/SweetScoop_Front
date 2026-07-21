<!-- 결제 페이지 -->
<script setup="setup">
    import {computed, onMounted, ref} from "vue";
    import {useRouter} from "vue-router";
    import api from "../api/axios";

    const router = useRouter();
    const showPhoneModal = ref(false);
    const phoneNumber = ref("");
    const memberInfo = ref(null);
    const memberMessage = ref("");
    const checkingMember = ref(false);

    const orderData = ref({
        orderType: "",
        customerId: null,
        branchId: null,
        kioskId: null,
        items: [],
        member: null
    });

    const paymentMethod = ref(null);
    const paying = ref(false);
    const cartItems = ref([]);
    const usingCart = computed(() => cartItems.value.length > 0);

    const orderTypeName = computed(() => {
        return orderData.value.orderType === "STORE"
            ? "매장"
            : "포장";
    });

    const totalPrice = computed(() => {
        return cartItems.value.reduce(
            (sum, item) => {
                const quantity = Number(item.quantity) || 1;
                const unitPrice =
                    Number(item.unitPrice ?? item.totalPrice) || 0;

                return sum + unitPrice * quantity;
            },
            0
        );
    });

    const orderName = computed(() => {
        if (cartItems.value.length === 0) {
            return "SweetScoop 주문";
        }

        const firstName =
            cartItems.value[0]?.name ||
            "SweetScoop 상품";

        const extraCount = cartItems.value.length - 1;

        return extraCount > 0
            ? `${firstName} 외 ${extraCount}건`
            : firstName;
    });

    const iceCreamItems = computed(() =>
        cartItems.value.filter(
            item => item.productType === "ICE_CREAM"
        )
    );

    const mochiItems = computed(() =>
        cartItems.value.filter(
            item => item.productType === "MOCHI"
        )
    );

    const coffeeItems = computed(() =>
        cartItems.value.filter(
            item => item.productType === "COFFEE"
        )
    );

    const hasIceCream = computed(() =>
        iceCreamItems.value.length > 0
    );

    const hasMochi = computed(() =>
        mochiItems.value.length > 0
    );

    const hasCoffee = computed(() =>
        coffeeItems.value.length > 0
    );

    const normalizePhoneNumber = (value) => {
        return String(value)
            .replace(/[^0-9]/g, "")
            .slice(0, 11);
    };

    const handlePhoneInput = (event) => {
        phoneNumber.value = normalizePhoneNumber(event.target.value);
    };

    const normalizeCartItem = (item) => {
        const options = Array.isArray(item.options)
            ? item.options
            : [];

        const optionPrice = options.reduce(
            (sum, option) =>
                sum + (Number(option.price) || 0),
            0
        );

        const basePrice =
            Number(item.basePrice ?? item.price) || 0;

        const sizePrice =
            Number(
                item.sizeAdditionalPrice ??
                item.sizePrice
            ) || 0;

        const savedUnitPrice =
            Number(item.unitPrice) || 0;

        const legacyTotalPrice =
            Number(item.totalPrice) || 0;

        const calculatedPrice =
            basePrice + sizePrice + optionPrice;

        /*
         * totalPrice가 이미 수량까지 곱해진 값일 수 있으므로
         * unitPrice가 있으면 unitPrice를 우선한다.
         */
        const unitPrice =
            savedUnitPrice > 0
                ? savedUnitPrice
                : calculatedPrice > 0
                    ? calculatedPrice
                    : legacyTotalPrice;

        return {
            ...item,
            quantity: Number(item.quantity) || 1,
            menus: Array.isArray(item.menus)
                ? item.menus
                : [],
            options,
            unitPrice,
            totalPrice: unitPrice
        };
    };

    const loadOrderData = () => {
        const savedOrder =
            sessionStorage.getItem("orderData");

        const savedCart =
            sessionStorage.getItem("cartData");

        try {
            if (savedOrder) {
                const parsedOrder =
                    JSON.parse(savedOrder);

                orderData.value = {
                    orderType:
                        parsedOrder.orderType ||
                        "TAKEOUT",
                    customerId:
                        parsedOrder.customerId ?? null,
                    branchId:
                        parsedOrder.branchId ?? 1,
                    kioskId:
                        parsedOrder.kioskId ?? 1,
                    items:
                        Array.isArray(parsedOrder.items)
                            ? parsedOrder.items
                            : [],
                    member:
                        parsedOrder.member ?? null
                };

                cartItems.value =
                    orderData.value.items.map(
                        normalizeCartItem
                    );
            }

            /*
             * 예전 버전에서 orderData.items가 없고
             * cartData에만 상품이 저장된 경우를 보정한다.
             */
            if (
                cartItems.value.length === 0 &&
                savedCart
            ) {
                const parsedCart =
                    JSON.parse(savedCart);

                cartItems.value =
                    Array.isArray(parsedCart.items)
                        ? parsedCart.items.map(
                            normalizeCartItem
                        )
                        : [];

                orderData.value = {
                    ...orderData.value,
                    orderType:
                        parsedCart.orderType ||
                        orderData.value.orderType ||
                        "TAKEOUT",
                    customerId:
                        parsedCart.customerId ??
                        orderData.value.customerId,
                    branchId:
                        parsedCart.branchId ??
                        orderData.value.branchId ??
                        1,
                    kioskId:
                        parsedCart.kioskId ??
                        orderData.value.kioskId ??
                        1,
                    items: cartItems.value
                };

                sessionStorage.setItem(
                    "orderData",
                    JSON.stringify(orderData.value)
                );
            }

            if (cartItems.value.length === 0) {
                alert("장바구니에 저장된 상품이 없습니다.");
                router.push("/");
                return;
            }

            console.log(
                "결제 화면 통합 주문 데이터:",
                orderData.value
            );
        } catch (error) {
            console.error(
                "주문 데이터 불러오기 실패:",
                error
            );

            sessionStorage.removeItem("orderData");
            sessionStorage.removeItem("cartData");
            router.push("/");
        }
    };

    const goBack = () => {
        router.back();
    };

    const goHome = () => {
        sessionStorage.removeItem("orderData");
        sessionStorage.removeItem("cartData");
        router.push("/");
    };

    const selectPaymentMethod = (method) => {
        paymentMethod.value = method;
    };

    const createOrderRequest = () => {
        const items = cartItems.value.map(item => {
            const quantity = Number(item.quantity) || 1;
            const unitPrice = Number(item.unitPrice ?? item.totalPrice) || 0;

            // 💡 1. 사이즈 이름과 맛(menus) 정보를 조합하여 통일된 이름 형식 생성
            const sizeName = item.sizeName || '';
            let flavorNames = [];
            if (Array.isArray(item.menus) && item.menus.length > 0) {
                // menus가 객체 배열인 경우와 숫자(ID)인 경우를 모두 안전하게 처리
                flavorNames = item.menus.map(m => m.name || m).filter(x => typeof x === 'string');
            }

            let displayName = item.name || '상품';
            if (sizeName) {
                displayName = sizeName;
            }
            if (flavorNames.length > 0) {
                displayName += ` (${flavorNames.join(', ')})`;
            }

            return {
                /* 모찌/커피는 컵 또는 아이스크림 사이즈가 없을 수 있으므로 null 허용 */
                cupId: item.cupId != null ? Number(item.cupId) : null,
                sizeId: item.sizeId != null ? Number(item.sizeId) : null,
                quantity,
                totalPrice: unitPrice * quantity,
                // 💡 백엔드 전송용 name 또는 itemName 필드가 있다면 displayName 함께 전달
                name: displayName,
                itemName: displayName,
                menus: (item.menus || [])
                    .map(menu => Number(menu.menuId ?? menu.id))
                    .filter(Number.isFinite)
                    .map(menuId => ({ menuId })),
                options: (item.options || [])
                    .map(option => Number(option.menuOptionId ?? option.id))
                    .filter(Number.isFinite)
                    .map(menuOptionId => ({ menuOptionId }))
            };
        });
        
        if (!usingCart.value && orderData.value.iceCream) {
            items.push({
                cupId: Number(orderData.value.iceCream.cupId),
                sizeId: Number(orderData.value.iceCream.sizeId),
                quantity: 1,
                totalPrice: Number(orderData.value.iceCream.totalPrice) || 0,
                menus: (orderData.value.iceCream.flavors || []).map(flavor => ({
                    menuId: Number(flavor.menuId)
                })),
                options: []
            });
        }

        return {
            customerId: orderData.value.customerId ?? 2,
            branchId: orderData.value.branchId ?? 1,
            kioskId: orderData.value.kioskId ?? 1,
            orderType: orderData.value.orderType || "TAKEOUT",
            language: "KO",
            status: "PAYMENT_PENDING",
            createdAt: new Date().toISOString().slice(0, 19),
            waitingNo: null,
            receiptNo: `R${Date.now()}`,
            totalPrice: totalPrice.value,
            couponUsed: false,
            items,
            /* PaymentRequestDTO 필드명은 paymentMethod가 아니라 method */
            payment: {
                method: paymentMethod.value,
                amount: totalPrice.value,
                cardCompany: "TOSS",
                paymentStatus: "READY"
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
            orderData.value.items = cartItems.value;
            sessionStorage.setItem(
                "orderData",
                JSON.stringify(orderData.value)
            );

            const orderRequest = {
                ...createOrderRequest(),
                status: "PAYMENT_PENDING"
            };

            const orderResponse = await api.post("/api/order", orderRequest);

            const realOrderId = Number(orderResponse.data.orderId);

            if (!realOrderId) {
                throw new Error("생성된 주문번호를 받지 못했습니다.");
            }

            const tossOrderId = `SWEETSCOOP-${realOrderId}-${Date.now()}`;

            const paymentData = {
                orderData: { ...orderData.value, cartItems: cartItems.value },
                orderRequest,
                realOrderId,
                tossOrderId,
                method: paymentMethod.value,
                amount: totalPrice.value,
                status: "READY"
            };

            sessionStorage.setItem("paymentData", JSON.stringify(paymentData));

            const tossPayments = window.TossPayments(
                "test_ck_GjLJoQ1aVZp0Bbwb0yl58w6KYe2R"
            );

            await tossPayments.requestPayment(paymentMethod.value, {
                amount: totalPrice.value,
                orderId: tossOrderId,
                orderName: orderName.value,

                successUrl: `${window.location.origin}` +
                        `/payment/success?realOrderId=${realOrderId}`,

                failUrl: `${window.location.origin}/payment`
            });
        } catch (error) {
            console.error("결제 준비 실패:", error);
            console.error("백엔드 응답:", error.response?.data);
            console.error("전송한 주문 JSON:", createOrderRequest());

            alert(
                error.response
                    ?.data
                        ?.message || error.message || "결제 준비 중 오류가 발생했습니다."
            );
        } finally {
            paying.value = false;
        }
    };

    const openPhoneModal = () => {
        if (!paymentMethod.value) {
            alert("결제 수단을 선택해주세요.");
            return;
        }

        phoneNumber.value = "";
        showPhoneModal.value = true;
        memberMessage.value = "";
        memberInfo.value = null;
    };
    const checkInMember = async () => {
        const normalizedPhone = normalizePhoneNumber(phoneNumber.value);

        if (normalizedPhone.length !== 11) {
            memberMessage.value = "전화번호 11자리를 입력해주세요.";
            return;
        }

        checkingMember.value = true;
        memberMessage.value = "";

        try {
            const memberCustomerId = 1;

            const response = await api.post("/api/order/members/check-in", null, {
                params: {
                    customerId: memberCustomerId,
                    phoneNumber: normalizedPhone
                }
            });

            memberInfo.value = response.data;

            memberMessage.value = `회원 확인 완료 · 결제 후 ${
            Math
                .floor(totalPrice.value * 0.05)
                .toLocaleString()}P 적립 예정`;

        } catch (error) {
            console.error("회원 확인 또는 가입 실패:", error);

            memberMessage.value = error.response
                ?.data
                    ?.message || "회원 처리 중 오류가 발생했습니다.";
        } finally {
            checkingMember.value = false;
        }
    };

    const continueAsMember = async () => {
        if (!memberInfo.value) {
            alert("전화번호 확인을 먼저 진행해주세요.");
            return;
        }

        const memberCustomerId = 1;

        orderData.value = {
            ...orderData.value,

            customerId: memberCustomerId,
            items: cartItems.value,

            member: {
                isMember: true,
                memberId: memberInfo.value.id,
                customerId: memberCustomerId,
                phoneNumber: memberInfo.value.phoneNumber,
                currentPoint: Number(memberInfo.value.point) || 0,
                expectedPoint: Math.floor(totalPrice.value * 0.05)
            }
        };

        sessionStorage.setItem("orderData", JSON.stringify(orderData.value));

        showPhoneModal.value = false;

        await pay();
    };

    const continueAsGuest = async () => {
        const guestCustomerId = 2;

        orderData.value = {
            ...orderData.value,

            customerId: guestCustomerId,
            items: cartItems.value,

            member: {
                isMember: false,
                memberId: null,
                customerId: guestCustomerId,
                phoneNumber: null,
                currentPoint: 0,
                expectedPoint: 0
            }
        };

        sessionStorage.setItem("orderData", JSON.stringify(orderData.value));

        showPhoneModal.value = false;

        await pay();
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

        <section v-if="usingCart" class="order-section">
            <div class="section-header">
                <h2>장바구니 상품</h2>
                <strong>{{ totalPrice.toLocaleString() }}원</strong>
            </div>
            <div class="cart-payment-list">
                <article v-for="item in cartItems" :key="item.cartItemId" class="cart-payment-item">
                    <img v-if="item.menuImg || item.menus?.[0]?.menuImg" :src="item.menuImg || item.menus[0].menuImg" :alt="item.name"/>
                    <div>
                        <h4>{{ item.name }}</h4>
                        <p v-if="item.sizeName">{{ item.sizeName }}</p>
                        <p v-if="item.menus?.length > 1">{{ item.menus.map(menu => menu.name).join(', ') }}</p>
                        <p v-if="item.options?.length">{{ item.options.map(option => option.name).join(', ') }}</p>
                    </div>
                    <span>{{ item.quantity }}개</span>
                    <strong>{{ (Number(item.unitPrice ?? item.totalPrice ?? 0) * Number(item.quantity || 1)).toLocaleString() }}원</strong>
                </article>
            </div>
        </section>

        <!-- 아이스크림 -->
        <section v-if="!usingCart && hasIceCream" class="order-section">
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
        <section v-if="!usingCart && hasMochi" class="order-section">
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
        <section v-if="!usingCart && hasCoffee" class="order-section">
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
                @click="openPhoneModal">
                {{
        paying
            ? "결제창 실행 중..."
            : paymentMethod
                ? `${paymentMethod}로 결제하기`
                : "결제 수단을 선택해주세요"
    }}
            </button>
        </footer>

        <div
            v-if="showPhoneModal"
            class="phone-modal-overlay"
            @click.self="showPhoneModal = false">
            <section class="phone-modal">
                <button type="button" class="modal-close" @click="showPhoneModal = false">
                    ×
                </button>

                <div class="phone-icon">📱</div>

                <h2>포인트 적립</h2>

                <p class="modal-description">
                    전화번호를 입력하면 기존 회원을 확인하고, 등록되지 않은 번호라면 자동으로 회원가입됩니다. 결제 완료 후 결제 금액의
                    <strong>5%</strong>가 적립됩니다.
                </p>

                <input
                    :value="phoneNumber"
                    type="tel"
                    inputmode="numeric"
                    maxlength="11"
                    placeholder="01012345678"
                    class="phone-input"
                    @input="handlePhoneInput"
                    @keyup.enter="checkInMember"/>

                <button
                    type="button"
                    class="member-check-button"
                    :disabled="checkingMember"
                    @click="checkInMember">
                    {{
                checkingMember
                    ? "회원 확인 중..."
                    : "회원 확인 및 자동 가입"
            }}
                </button>

                <p v-if="memberMessage" class="member-message" :class="{ success: memberInfo }">
                    {{ memberMessage }}
                </p>

                <div v-if="memberInfo" class="member-result">
                    <div>
                        <span>회원 번호</span>

                        <strong>
                            {{ memberInfo.id }}
                        </strong>
                    </div>

                    <div>
                        <span>현재 포인트</span>

                        <strong>
                            {{
                        Number(
                            memberInfo.point || 0
                        ).toLocaleString()
                    }}P
                        </strong>
                    </div>

                    <div>
                        <span>결제 후 적립 예정</span>

                        <strong class="earned-point">
                            +{{
                        Math.floor(
                            totalPrice * 0.05
                        ).toLocaleString()
                    }}P
                        </strong>
                    </div>
                </div>

                <button
                    v-if="memberInfo"
                    type="button"
                    class="member-continue-button"
                    :disabled="paying"
                    @click="continueAsMember">
                    회원으로 결제하기
                </button>

                <button
                    type="button"
                    class="skip-button"
                    :disabled="paying"
                    @click="continueAsGuest">
                    건너뛰기 · 비회원으로 결제
                </button>
            </section>
        </div>
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

    .phone-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 200;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        background: rgba(0, 0, 0, 0.45);
    }

    .phone-modal {
        width: min(100%, 420px);
        max-height: 90vh;
        position: relative;
        padding: 30px 24px 22px;
        overflow-y: auto;
        border-radius: 24px;
        background: #ffffff;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
    }

    .modal-close {
        width: 34px;
        height: 34px;
        position: absolute;
        top: 13px;
        right: 13px;
        border: 0;
        border-radius: 50%;
        background: #f5f5f5;
        color: #777777;
        font-size: 21px;
        cursor: pointer;
    }

    .phone-icon {
        font-size: 42px;
    }

    .phone-modal h2 {
        margin: 11px 0 7px;
        color: #222222;
        font-size: 21px;
    }

    .modal-description {
        margin: 0 0 20px;
        color: #777777;
        font-size: 12px;
        line-height: 1.65;
    }

    .modal-description strong {
        color: #ff1493;
    }

    .phone-input {
        width: 100%;
        height: 54px;
        padding: 0 15px;
        border: 2px solid #eeeeee;
        border-radius: 14px;
        outline: none;
        font-size: 18px;
        text-align: center;
        letter-spacing: 1px;
    }

    .phone-input:focus {
        border-color: #ff1493;
    }

    .member-check-button,
    .member-continue-button,
    .skip-button {
        width: 100%;
        height: 50px;
        margin-top: 11px;
        border-radius: 25px;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
    }

    .member-check-button {
        border: 0;
        background: #ff1493;
        color: #ffffff;
    }

    .member-check-button:disabled,
    .member-continue-button:disabled,
    .skip-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .member-message {
        margin: 13px 0 0;
        color: #f04452;
        font-size: 12px;
    }

    .member-message.success {
        color: #ff1493;
    }

    .member-result {
        margin-top: 15px;
        padding: 14px;
        border-radius: 14px;
        background: #fff3f9;
    }

    .member-result > div {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 9px;
        color: #666666;
        font-size: 12px;
    }

    .member-result > div:last-child {
        margin-bottom: 0;
    }

    .member-result strong {
        color: #333333;
    }

    .member-result .earned-point {
        color: #ff1493;
    }

    .member-continue-button {
        border: 0;
        background: #ff1493;
        color: #ffffff;
    }

    .skip-button {
        border: 1px solid #dddddd;
        background: #ffffff;
        color: #666666;
    }
</style>
<style scoped>
.cart-payment-list { display: grid; gap: 10px; }
.cart-payment-item { display: grid; grid-template-columns: 58px 1fr auto auto; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #eee; }
.cart-payment-item img { width: 56px; height: 56px; object-fit: contain; }
.cart-payment-item h4 { margin: 0 0 4px; }
.cart-payment-item p { margin: 2px 0; color: #888; font-size: 11px; }
.cart-payment-item > span { color: #666; }
.cart-payment-item > strong { color: #ff1493; white-space: nowrap; }
</style>
