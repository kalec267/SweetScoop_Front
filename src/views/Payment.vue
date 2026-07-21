<!-- src/views/Payment.vue -->
<script setup="setup">
    import {computed, onMounted, ref, watch} from "vue";
    import {useRouter} from "vue-router";
    import api from "../api/axios";

    const router = useRouter();

    const POINT_UNIT = 500;

    const orderData = ref({
        orderType: "",
        customerId: null,
        branchId: 1,
        kioskId: 1,
        items: [],
        member: null
    });

    const cartItems = ref([]);
    const paymentMethod = ref(null);
    const paying = ref(false);

    /* 회원 혜택 모달 */
    const showPhoneModal = ref(false);
    const phoneNumber = ref("");
    const memberInfo = ref(null);
    const memberMessage = ref("");
    const checkingMember = ref(false);
    const calculating = ref(false);

    /* 할인 선택 */
    const coupons = ref([]);
    const selectedCouponId = ref(null);
    const pointUsed = ref(0);
    const couponDiscount = ref(0);
    const pointDiscount = ref(0);
    const totalDiscount = ref(0);
    const finalAmount = ref(0);

    const usingCart = computed(() => cartItems.value.length > 0);

    const orderTypeName = computed(
        () => orderData.value.orderType === "STORE"
            ? "매장"
            : "포장"
    );

    const totalPrice = computed(() => cartItems.value.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 1;
        const unitPrice = Number(item.unitPrice ?? item.totalPrice) || 0;
        return sum + unitPrice * quantity;
    }, 0));

    const orderName = computed(() => {
        if (cartItems.value.length === 0) 
            return "SweetScoop 주문";
        
        const firstName = cartItems.value[0]
            ?.name || "SweetScoop 상품";
        const extraCount = cartItems.value.length - 1;

        return extraCount > 0
            ? `${firstName} 외 ${extraCount}건`
            : firstName;
    });

    const availablePoint = computed(() => Number(
        memberInfo.value
            ?.point || 0
    ));

    const maximumPointByBalance = computed(
        () => Math.floor(availablePoint.value / POINT_UNIT) * POINT_UNIT
    );

    const remainingAfterCoupon = computed(
        () => Math.max(0, totalPrice.value - couponDiscount.value)
    );

    const maximumPointByAmount = computed(
        () => Math.floor(remainingAfterCoupon.value / POINT_UNIT) * POINT_UNIT
    );

    const maximumUsablePoint = computed(
        () => Math.min(maximumPointByBalance.value, maximumPointByAmount.value)
    );

    const selectedCoupon = computed(
        () => coupons.value.find(coupon => Number(coupon.id) === Number(selectedCouponId.value)) || null
    );

    const normalizePhoneNumber = value => String(value || "")
        .replace(
            /[^0-9]/g,
            ""
        )
        .slice(0, 11);

    const handlePhoneInput = event => {
        phoneNumber.value = normalizePhoneNumber(event.target.value);
    };

    const normalizeCartItem = item => {
        const options = Array.isArray(item.options)
            ? item.options
            : [];

        const optionPrice = options.reduce(
            (sum, option) => sum + (Number(option.price) || 0),
            0
        );

        const basePrice = Number(item.basePrice ?? item.price) || 0;
        const sizePrice = Number(item.sizeAdditionalPrice ?? item.sizePrice) || 0;
        const savedUnitPrice = Number(item.unitPrice) || 0;
        const legacyTotalPrice = Number(item.totalPrice) || 0;
        const calculatedPrice = basePrice + sizePrice + optionPrice;

        const unitPrice = savedUnitPrice > 0
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
        const savedOrder = sessionStorage.getItem("orderData");
        const savedCart = sessionStorage.getItem("cartData");

        try {
            if (savedOrder) {
                const parsedOrder = JSON.parse(savedOrder);

                orderData.value = {
                    ...orderData.value,
                    ...parsedOrder,
                    orderType: parsedOrder.orderType || "TAKEOUT",
                    branchId: parsedOrder.branchId ?? 1,
                    kioskId: parsedOrder.kioskId ?? 1,
                    items: Array.isArray(parsedOrder.items)
                        ? parsedOrder.items
                        : []
                };

                cartItems.value = orderData
                    .value
                    .items
                    .map(normalizeCartItem);
            }

            if (cartItems.value.length === 0 && savedCart) {
                const parsedCart = JSON.parse(savedCart);

                cartItems.value = Array.isArray(parsedCart.items)
                    ? parsedCart
                        .items
                        .map(normalizeCartItem)
                    : [];

                orderData.value = {
                    ...orderData.value,
                    ...parsedCart,
                    branchId: parsedCart.branchId ?? orderData.value.branchId ?? 1,
                    kioskId: parsedCart.kioskId ?? orderData.value.kioskId ?? 1,
                    items: cartItems.value
                };
            }

            if (cartItems.value.length === 0) {
                window.alert("장바구니에 저장된 상품이 없습니다.");
                router.replace("/");
                return;
            }

            finalAmount.value = totalPrice.value;
        } catch (error) {
            console.error("주문 데이터 불러오기 실패:", error);
            sessionStorage.removeItem("orderData");
            sessionStorage.removeItem("cartData");
            router.replace("/");
        }
    };

    const goBack = () => router.back();

    const goHome = () => {
        sessionStorage.removeItem("orderData");
        sessionStorage.removeItem("cartData");
        sessionStorage.removeItem("paymentData");
        router.replace("/");
    };

    const selectPaymentMethod = method => {
        paymentMethod.value = method;
    };

    const resetDiscount = () => {
        selectedCouponId.value = null;
        pointUsed.value = 0;
        couponDiscount.value = 0;
        pointDiscount.value = 0;
        totalDiscount.value = 0;
        finalAmount.value = totalPrice.value;
    };

    const resetMember = () => {
        memberInfo.value = null;
        coupons.value = [];
        memberMessage.value = "";
        resetDiscount();
    };

    const openPhoneModal = () => {
        if (!paymentMethod.value) {
            window.alert("결제 수단을 선택해주세요.");
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
        };
        
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

        phoneNumber.value = "";
        resetMember();
        showPhoneModal.value = true;
    };

    const checkMemberBenefits = async () => {
        const normalizedPhone = normalizePhoneNumber(phoneNumber.value);

        if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
            memberMessage.value = "전화번호를 정확히 입력해주세요.";
            return;
        }

        checkingMember.value = true;
        memberMessage.value = "";

        try {
            const response = await api.get("/api/payments/member-benefits", {
                params: {
                    phoneNumber: normalizedPhone
                }
            });

            const result = response.data;

            if (result.member !== true) {
                resetMember();
                memberMessage.value = "등록된 회원이 없습니다. 비회원으로 결제할 수 있습니다.";
                return;
            }

            memberInfo.value = {
                id: result.memberId,
                phoneNumber: result.phoneNumber || normalizedPhone,
                point: Number(result.point || 0)
            };

            coupons.value = Array.isArray(result.coupons)
                ? result.coupons
                : [];

            resetDiscount();

            memberMessage.value = "회원 확인이 완료되었습니다. 포인트와 쿠폰을 선택해주세요.";
        } catch (error) {
            console.error("회원 혜택 조회 실패:", error);
            resetMember();
            memberMessage.value = error.response
                ?.data
                    ?.message || "회원 정보를 조회하지 못했습니다.";
        } finally {
            checkingMember.value = false;
        }
    };

    const validatePoint = () => {
        const value = Number(pointUsed.value || 0);

        if (!Number.isInteger(value) || value < 0) {
            window.alert("사용 포인트를 올바르게 입력해주세요.");
            return false;
        }

        if (value % POINT_UNIT !== 0) {
            window.alert("포인트는 500원 단위로만 사용할 수 있습니다.");
            return false;
        }

        if (value > maximumUsablePoint.value) {
            window.alert(`최대 ${maximumUsablePoint.value.toLocaleString()}P까지 사용할 수 있습니다.`);
            return false;
        }

        return true;
    };

    const useMaximumPoint = () => {
        pointUsed.value = maximumUsablePoint.value;
    };

    const applyDiscount = async () => {
        if (!memberInfo.value) {
            window.alert("회원 조회를 먼저 진행해주세요.");
            return false;
        }

        if (!validatePoint()) 
            return false;
        
        calculating.value = true;

        try {
            const response = await api.post("/api/payments/calculate", {
                phoneNumber: memberInfo.value.phoneNumber,
                originalAmount: totalPrice.value,
                pointUsed: Number(pointUsed.value || 0),
                couponId: selectedCouponId.value === null
                    ? null
                    : Number(selectedCouponId.value)
            });

            const result = response.data;

            couponDiscount.value = Number(result.couponDiscount || 0);
            pointDiscount.value = Number(result.pointDiscount || 0);
            totalDiscount.value = Number(result.totalDiscount || 0);
            finalAmount.value = Number(result.finalAmount || totalPrice.value);
            pointUsed.value = pointDiscount.value;

            return true;
        } catch (error) {
            console.error("할인 계산 실패:", error);

            window.alert(
                error.response
                    ?.data
                        ?.message || "할인 금액을 계산하지 못했습니다."
            );

            return false;
        } finally {
            calculating.value = false;
        }
    };

    watch(selectedCouponId, () => {
        /*
   * 최대 포인트 버튼 계산을 위해 선택 쿠폰의 할인액을
   * 화면에서 임시 반영한다. 실제 결제 금액은 서버 계산 결과를 사용한다.
   */
        couponDiscount.value = Math.floor(Number(
            selectedCoupon.value
                ?.discountValue || 0
        ));

        pointDiscount.value = 0;
        totalDiscount.value = couponDiscount.value;
        finalAmount.value = Math.max(1, totalPrice.value - couponDiscount.value);

        if (pointUsed.value > maximumUsablePoint.value) {
            pointUsed.value = maximumUsablePoint.value;
        }
    });

    const createOrderRequest = () => {
        const items = cartItems
            .value
            .map(item => {
                const quantity = Number(item.quantity) || 1;
                const unitPrice = Number(item.unitPrice ?? item.totalPrice) || 0;

                return {
                    cupId: item.cupId != null
                        ? Number(item.cupId)
                        : null,
                    sizeId: item.sizeId != null
                        ? Number(item.sizeId)
                        : null,
                    quantity,
                    totalPrice: unitPrice * quantity,
                    menus: (item.menus || [])
                        .map(menu => Number(menu.menuId ?? menu.id))
                        .filter(Number.isFinite)
                        .map(menuId => ({menuId})),
                    options: (item.options || [])
                        .map(
                            option => Number(option.menuOptionId ?? option.id)
                        )
                        .filter(Number.isFinite)
                        .map(menuOptionId => ({menuOptionId}))
                };
            });

        return {
            customerId: memberInfo.value
                ? 1
                : 2,
            memberId: memberInfo.value
                ?.id ?? null,
            phoneNumber: memberInfo.value
                ?.phoneNumber ?? null,
            branchId: orderData.value.branchId ?? 1,
            kioskId: orderData.value.kioskId ?? 1,
            orderType: orderData.value.orderType || "TAKEOUT",
            language: "KO",
            status: "PAYMENT_PENDING",
            createdAt: new Date()
                .toISOString()
                .slice(0, 19),
            waitingNo: null,
            receiptNo: `R${Date.now()}`,

            /* ORDERS.total_price에는 할인 전 금액 저장 */
            totalPrice: totalPrice.value,
            originalAmount: totalPrice.value,

            couponId: selectedCouponId.value === null
                ? null
                : Number(selectedCouponId.value),
            couponUsed: selectedCouponId.value !== null,
            couponDiscount: couponDiscount.value,
            pointUsed: pointDiscount.value,
            discountAmount: totalDiscount.value,
            finalAmount: finalAmount.value,

            items,

            payment: {
                paymentMethod: paymentMethod.value,
                amount: finalAmount.value
            }
        };
    };

    const pay = async ({asMember}) => {
        if (paying.value) 
            return;
        
        if (!paymentMethod.value) {
            window.alert("결제 수단을 선택해주세요.");
            return;
        }

        if (totalPrice.value <= 0) {
            window.alert("결제 금액을 확인해주세요.");
            return;
        }

        if (typeof window.TossPayments !== "function") {
            window.alert("결제 모듈을 불러오지 못했습니다.");
            return;
        }

        paying.value = true;

        try {
            if (asMember) {
                if (!memberInfo.value) {
                    throw new Error("회원 정보를 먼저 조회해주세요.");
                }

                const calculated = await applyDiscount();
                if (!calculated) 
                    return;
                }
            else {
                resetMember();
                finalAmount.value = totalPrice.value;
            }

            if (finalAmount.value <= 0) {
                throw new Error("최종 결제 금액은 1원 이상이어야 합니다.");
            }

            orderData.value = {
                ...orderData.value,
                customerId: asMember
                    ? 1
                    : 2,
                items: cartItems.value,
                member: asMember
                    ? {
                        isMember: true,
                        memberId: memberInfo.value.id,
                        customerId: 1,
                        phoneNumber: memberInfo.value.phoneNumber,
                        currentPoint: availablePoint.value
                    }
                    : {
                        isMember: false,
                        memberId: null,
                        customerId: 2,
                        phoneNumber: null,
                        currentPoint: 0
                    }
            };

            sessionStorage.setItem("orderData", JSON.stringify(orderData.value));

            const orderRequest = createOrderRequest();
            const orderResponse = await api.post("/api/order", orderRequest);

            const realOrderId = Number(orderResponse.data.orderId);

            if (!realOrderId) {
                throw new Error("생성된 주문번호를 받지 못했습니다.");
            }

            const tossOrderId = `SWEETSCOOP-${realOrderId}-${Date.now()}`;

            const paymentData = {
                orderData: {
                    ...orderData.value,
                    cartItems: cartItems.value
                },
                orderRequest,
                realOrderId,
                tossOrderId,
                paymentMethod: paymentMethod.value,
                originalAmount: totalPrice.value,
                couponId: selectedCouponId.value === null
                    ? null
                    : Number(selectedCouponId.value),
                couponDiscount: couponDiscount.value,
                pointUsed: pointDiscount.value,
                totalDiscount: totalDiscount.value,
                finalAmount: finalAmount.value,
                phoneNumber: asMember
                    ? memberInfo.value.phoneNumber
                    : null,
                memberId: asMember
                    ? memberInfo.value.id
                    : null
            };

            sessionStorage.setItem("paymentData", JSON.stringify(paymentData));

            const tossPayments = window.TossPayments(
                "test_ck_GjLJoQ1aVZp0Bbwb0yl58w6KYe2R"
            );

            await tossPayments.requestPayment(paymentMethod.value, {
                amount: finalAmount.value,
                orderId: tossOrderId,
                orderName: orderName.value,
                successUrl: `${window.location.origin}/payment/success`,
                failUrl: `${window.location.origin}/payment`
            });
        } catch (error) {
            console.error("결제 준비 실패:", error);
            console.error(
                "백엔드 응답:",
                error.response
                    ?.data
            );

            window.alert(
                error.response
                    ?.data
                        ?.message || error.message || "결제 준비 중 오류가 발생했습니다."
            );
        } finally {
            paying.value = false;
        }
    };

    const continueAsMember = async () => {
        if (!memberInfo.value) {
            window.alert("회원 조회를 먼저 진행해주세요.");
            return;
        }

        showPhoneModal.value = false;
        await pay({asMember: true});
    };

    const continueAsGuest = async () => {
        showPhoneModal.value = false;
        await pay({asMember: false});
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
            <strong>{{ orderTypeName }}</strong>
        </section>

        <section class="order-section">
            <div class="section-header">
                <h2>장바구니 상품</h2>
                <strong>{{ totalPrice.toLocaleString() }}원</strong>
            </div>

            <div class="cart-payment-list">
                <article
                    v-for="(item, index) in cartItems"
                    :key="item.cartItemId || index"
                    class="cart-payment-item">
                    <img
                        v-if="item.menuImg || item.menus?.[0]?.menuImg"
                        :src="item.menuImg || item.menus[0].menuImg"
                        :alt="item.name"/>

                    <div class="item-info">
                        <h4>{{ item.name }}</h4>
                        <p v-if="item.sizeName">{{ item.sizeName }}</p>
                        <p v-if="item.menus?.length > 1">
                            {{ item.menus.map(menu => menu.name).join(", ") }}
                        </p>
                        <p v-if="item.options?.length">
                            {{ item.options.map(option => option.name).join(", ") }}
                        </p>
                    </div>

                    <span>{{ item.quantity }}개</span>

                    <strong>
                        {{
              (
                Number(item.unitPrice ?? item.totalPrice ?? 0)
                * Number(item.quantity || 1)
              ).toLocaleString()
            }}원
                    </strong>
                </article>
            </div>
        </section>

        <section class="payment-method-section">
            <h2>결제 수단</h2>

            <div class="payment-method-list">
                <button
                    type="button"
                    :class="{ selected: paymentMethod === '카드' }"
                    @click="selectPaymentMethod('카드')">
                    <span class="method-icon">💳</span>
                    카드 결제
                </button>

                <button
                    type="button"
                    :class="{ selected: paymentMethod === '간편결제' }"
                    @click="selectPaymentMethod('간편결제')">
                    <span class="method-icon">📱</span>
                    간편결제
                </button>
            </div>
        </section>

        <footer class="payment-footer">
            <div>
                <span>결제 예정 금액</span>
                <strong>{{ totalPrice.toLocaleString() }}원</strong>
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
                <h2>회원 혜택 조회</h2>

                <p class="modal-description">
                    전화번호로 보유 포인트와 사용 가능한 쿠폰을 조회합니다. 포인트는
                    <strong>500P 단위</strong>로 사용할 수 있습니다.
                </p>

                <div class="phone-search-row">
                    <input
                        :value="phoneNumber"
                        type="tel"
                        inputmode="numeric"
                        maxlength="11"
                        placeholder="01012345678"
                        class="phone-input"
                        @input="handlePhoneInput"
                        @keyup.enter="checkMemberBenefits"/>

                    <button
                        type="button"
                        class="member-check-button"
                        :disabled="checkingMember"
                        @click="checkMemberBenefits">
                        {{ checkingMember ? "조회 중..." : "조회" }}
                    </button>
                </div>

                <p v-if="memberMessage" class="member-message" :class="{ success: memberInfo }">
                    {{ memberMessage }}
                </p>

                <div v-if="memberInfo" class="member-result">
                    <div class="benefit-summary">
                        <span>보유 포인트</span>
                        <strong>{{ availablePoint.toLocaleString() }}P</strong>
                    </div>

                    <label class="field-label" for="coupon">
                        쿠폰 선택
                    </label>

                    <select id="coupon" v-model="selectedCouponId" class="benefit-select">
                        <option :value="null">쿠폰 사용 안 함</option>

                        <option v-for="coupon in coupons" :key="coupon.id" :value="coupon.id">
                            {{ coupon.name }}
                            -
                            {{
                Math.floor(
                  Number(coupon.discountValue || 0)
                ).toLocaleString()
              }}원
                        </option>
                    </select>

                    <p v-if="coupons.length === 0" class="empty-benefit">
                        사용 가능한 쿠폰이 없습니다.
                    </p>

                    <label class="field-label" for="pointUsed">
                        사용할 포인트
                    </label>

                    <div class="point-row">
                        <input
                            id="pointUsed"
                            v-model.number="pointUsed"
                            type="number"
                            min="0"
                            :max="maximumUsablePoint"
                            step="500"
                            class="point-input"/>

                        <button type="button" class="max-point-button" @click="useMaximumPoint">
                            최대 사용
                        </button>
                    </div>

                    <p class="point-guide">
                        최대
                        {{ maximumUsablePoint.toLocaleString() }}P 사용 가능
                    </p>

                    <button
                        type="button"
                        class="apply-discount-button"
                        :disabled="calculating"
                        @click="applyDiscount">
                        {{ calculating ? "계산 중..." : "할인 적용" }}
                    </button>

                    <div class="discount-result">
                        <div>
                            <span>주문 금액</span>
                            <strong>{{ totalPrice.toLocaleString() }}원</strong>
                        </div>
                        <div>
                            <span>쿠폰 할인</span>
                            <strong>-{{ couponDiscount.toLocaleString() }}원</strong>
                        </div>
                        <div>
                            <span>포인트 사용</span>
                            <strong>-{{ pointDiscount.toLocaleString() }}원</strong>
                        </div>
                        <div class="final-row">
                            <span>최종 결제 금액</span>
                            <strong>{{ finalAmount.toLocaleString() }}원</strong>
                        </div>
                    </div>

                    <button
                        type="button"
                        class="member-continue-button"
                        :disabled="paying || calculating"
                        @click="continueAsMember">
                        회원 혜택 적용 후 결제
                    </button>
                </div>

                <button
                    type="button"
                    class="skip-button"
                    :disabled="paying"
                    @click="continueAsGuest">
                    비회원으로 결제
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

    button,
    input,
    select {
        font-family: inherit;
    }

    .payment-page {
        width: 100%;
        min-height: 100vh;
        margin: 0 auto;
        padding: 0 16px 145px;
        background: #fff;
    }

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

    .order-section,
    .order-type-box,
    .payment-method-section {
        margin-bottom: 16px;
        padding: 17px;
        border: 1px solid #ededed;
        border-radius: 17px;
        background: #fff;
    }

    .order-type-box,
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .order-type-box strong,
    .section-header strong {
        color: #ff1493;
    }

    .section-header {
        margin-bottom: 14px;
    }

    .payment-method-section h2,
    .section-header h2 {
        margin: 0 0 12px;
        font-size: 17px;
    }

    .cart-payment-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .cart-payment-item {
        display: grid;
        grid-template-columns: 64px 1fr auto auto;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 13px;
        background: #fafafa;
    }

    .cart-payment-item img {
        width: 64px;
        height: 64px;
        object-fit: contain;
    }

    .item-info h4,
    .item-info p {
        margin: 0;
        font-size: 20px;
        font-weight: bold;
    }

    .item-info p {
        margin-top: 4px;
        color: #777;
        font-size: 12px;
        font-weight: bold;
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

    .payment-footer {
        position: fixed;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: 10;
        padding: 15px 16px;
        border-top: 1px solid #eee;
        background: #fff;
        box-shadow: 0 -5px 18px rgba(0, 0, 0, 0.06);
    }

    .payment-footer > div {
        max-width: 900px;
        margin: 0 auto 10px;
        display: flex;
        justify-content: space-between;
    }

    .payment-button {
        width: 100%;
        max-width: 900px;
        height: 54px;
        margin: 0 auto;
        display: block;
        border: 0;
        border-radius: 14px;
        background: #ff1493;
        color: #fff;
        font-size: 16px;
        font-weight: 800;
        cursor: pointer;
    }

    .phone-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 100;
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.48);
    }

    .phone-modal {
        width: 100%;
        max-width: 480px;
        max-height: 92vh;
        padding: 25px;
        position: relative;
        overflow-y: auto;
        border-radius: 22px;
        background: #fff;
    }

    .modal-close {
        position: absolute;
        top: 12px;
        right: 15px;
        border: 0;
        background: transparent;
        font-size: 28px;
        cursor: pointer;
    }

    .phone-icon {
        text-align: center;
        font-size: 38px;
    }

    .phone-modal h2 {
        margin: 10px 0;
        text-align: center;
    }

    .modal-description {
        color: #666;
        font-size: 13px;
        line-height: 1.6;
        text-align: center;
    }

    .phone-search-row,
    .point-row {
        display: flex;
        gap: 8px;
    }

    .benefit-select,
    .phone-input,
    .point-input {
        width: 100%;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 10px;
    }

    .apply-discount-button,
    .max-point-button,
    .member-check-button,
    .member-continue-button,
    .skip-button {
        border: 0;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
    }

    .max-point-button,
    .member-check-button {
        padding: 0 14px;
        white-space: nowrap;
    }

    .member-check-button {
        background: #ff1493;
        color: #fff;
    }

    .member-message {
        margin: 12px 0;
        color: #d33;
        font-size: 13px;
        text-align: center;
    }

    .member-message.success {
        color: #16873b;
    }

    .member-result {
        margin-top: 16px;
    }

    .benefit-summary,
    .discount-result > div {
        display: flex;
        justify-content: space-between;
    }

    .benefit-summary {
        padding: 13px;
        border-radius: 10px;
        background: #fff1f7;
    }

    .field-label {
        margin: 15px 0 7px;
        display: block;
        font-weight: 700;
    }

    .empty-benefit,
    .point-guide {
        margin: 6px 0;
        color: #777;
        font-size: 12px;
    }

    .apply-discount-button,
    .member-continue-button,
    .skip-button {
        width: 100%;
        margin-top: 14px;
        padding: 13px;
    }

    .apply-discount-button {
        background: #ececf4;
    }

    .member-continue-button {
        background: #ff1493;
        color: #fff;
    }

    .skip-button {
        background: transparent;
        color: #777;
        text-decoration: underline;
    }

    .discount-result {
        margin-top: 14px;
        padding: 14px;
        border-radius: 12px;
        background: #fafafa;
    }

    .discount-result > div {
        margin-bottom: 7px;
    }

    .discount-result .final-row {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #ddd;
        color: #ff1493;
    }

    button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }

    @media (min-width: 900px) {
        .payment-page {
            max-width: 900px;
        }
    }
</style>