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

const processingMessage = ref(
    "잠시만 기다려주시면 영수증 발행이 완료됩니다."
);

const isProcessing = ref(true);
const errorMessage = ref("");

const confirmPayment = async () => {
    // 1. 세션에 저장된 결제 데이터 가져오기
    const savedPaymentData =
        sessionStorage.getItem("paymentData");

    if (!savedPaymentData) {
        throw new Error("결제 정보를 찾을 수 없습니다.");
    }

    const paymentData =
        JSON.parse(savedPaymentData);

    const paymentKey =
        String(route.query.paymentKey || "");

    const tossOrderId =
        String(route.query.orderId || "");

    const amount =
        Number(route.query.amount || 0);

    const realOrderId =
        Number(paymentData.realOrderId);

    /*
     * 회원 정보
     *
     * paymentData의 구조에 따라
     * paymentData.phoneNumber 또는
     * paymentData.orderData.member.phoneNumber를 사용한다.
     */
    const member =
        paymentData.orderData?.member;

    const phoneNumber =
        paymentData.phoneNumber
        ?? member?.phoneNumber
        ?? null;

    /*
     * 쿠폰 ID
     *
     * 기존 저장 구조가 다를 가능성을 고려해
     * couponId와 selectedCouponId를 모두 확인한다.
     */
    const couponId =
        paymentData.couponId
        ?? paymentData.selectedCouponId
        ?? null;

    /*
     * 사용 포인트
     *
     * 기존 저장 구조가 다를 가능성을 고려해
     * pointUsed와 usedPoint를 모두 확인한다.
     */
    const pointUsed =
        Number(
            paymentData.pointUsed
            ?? paymentData.usedPoint
            ?? 0
        );

    // 필수값 검증
    if (!paymentKey) {
        throw new Error(
            "Toss paymentKey가 없습니다."
        );
    }

    if (!tossOrderId) {
        throw new Error(
            "Toss 주문번호가 없습니다."
        );
    }

    if (
        !Number.isInteger(realOrderId)
        || realOrderId <= 0
    ) {
        throw new Error(
            "DB 주문번호가 올바르지 않습니다."
        );
    }

    if (
        !Number.isInteger(amount)
        || amount <= 0
    ) {
        throw new Error(
            "결제 금액이 올바르지 않습니다."
        );
    }

    /*
     * 2. 서버 결제 승인 요청 데이터
     *
     * 백엔드에서 할인 금액을 재계산할 수 있도록
     * phoneNumber, couponId, pointUsed를 함께 전달한다.
     */
    const confirmRequest = {
        orderId: realOrderId,
        tossOrderId,
        paymentKey,
        amount,
        method: paymentData.paymentMethod,

        phoneNumber,
        couponId,
        pointUsed
    };

    console.log(
        "결제 승인 요청 데이터:",
        confirmRequest
    );

    // 3. 서버 결제 승인 API 호출
    const confirmResponse =
        await api.post(
            "/api/payments/toss-confirm",
            confirmRequest
        );

    if (
        confirmResponse.data?.success === false
    ) {
        throw new Error(
            confirmResponse.data?.message
            || "결제 승인 실패"
        );
    }

    /*
     * 기존의 별도 포인트 적립 API 호출은 제거한다.
     *
     * PaymentService에서 결제 승인 후
     * 포인트 차감, 적립, 주문 횟수 증가를
     * 이미 처리하고 있다.
     */

    // 4. 영수증 데이터 생성
    const receipt = {
        orderId:
            confirmResponse.data.receipt?.orderId
            || realOrderId,

        receiptNo:
            confirmResponse.data.receipt?.receiptNo
            || "N/A",

        waitingNo:
            confirmResponse.data.receipt?.waitingNo
            || "N/A",

        orderTime:
            confirmResponse.data.receipt?.orderTime
            || new Date().toLocaleString(),

        items:
            (
                paymentData.orderData?.items
                || []
            ).map(item => {
                let displayName = "";
                let flavorText = "";
                let optionsText = "";

                // 상품명 및 사이즈
                if (
                    item.productType
                    === "ICE_CREAM"
                ) {
                    displayName =
                        item.sizeName
                        || item.name
                        || "아이스크림";
                } else {
                    const productName =
                        item.name
                        || item.menuName
                        || "상품";

                    const sizePrefix =
                        item.sizeName
                            ? `(${item.sizeName}) `
                            : "";

                    displayName =
                        `${sizePrefix}${productName}`;
                }

                // 아이스크림 맛 정보
                if (
                    item.productType
                        === "ICE_CREAM"
                    && Array.isArray(item.menus)
                    && item.menus.length > 0
                ) {
                    const flavorNames =
                        item.menus
                            .map(menu =>
                                menu?.name || menu
                            )
                            .filter(Boolean);

                    if (flavorNames.length > 0) {
                        flavorText =
                            flavorNames.join(", ");
                    }
                }

                // 옵션 정보
                if (item.options) {
                    if (
                        Array.isArray(item.options)
                    ) {
                        optionsText =
                            item.options
                                .map(option => {
                                    if (
                                        typeof option
                                            === "object"
                                        && option !== null
                                    ) {
                                        return (
                                            option.name
                                            || option.label
                                            || ""
                                        );
                                    }

                                    return option;
                                })
                                .filter(Boolean)
                                .join(", ");
                    } else if (
                        typeof item.options
                        === "object"
                    ) {
                        optionsText =
                            item.options.name
                            || item.options.label
                            || "";
                    } else {
                        optionsText =
                            String(item.options);
                    }
                }

                return {
                    menuName: displayName,
                    flavors: flavorText,
                    options: optionsText,

                    price: Number(
                        item.unitPrice
                        || item.price
                        || 0
                    ),

                    quantity: Number(
                        item.quantity
                        || 1
                    )
                };
            }),

        paymentMethod:
            paymentData.paymentMethod,

        cardCompany:
            confirmResponse.data.receipt?.cardCompany
            || "신용카드",

        totalPrice:
            confirmResponse.data.receipt?.totalPrice
            || amount
    };

    // 5. 결제 완료 후 세션 제거
    sessionStorage.removeItem("paymentData");
    sessionStorage.removeItem("orderData");

    // 장바구니 관련 저장값 제거
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

    // 장바구니 초기화 이벤트 전달
    window.dispatchEvent(
        new Event("storage")
    );

    window.dispatchEvent(
        new CustomEvent("cart-cleared")
    );

    // 6. 결제 완료 페이지 이동
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
        console.error(
            "결제 승인 실패 디버깅:",
            {
                status:
                    error.response?.status,

                response:
                    error.response?.data,

                request:
                    error.config?.data,

                message:
                    error.message
            }
        );

        isProcessing.value = false;

        const serverMessage =
            error.response?.data?.message
            ?? error.response?.data?.error
            ?? (
                typeof error.response?.data
                    === "string"
                    ? error.response.data
                    : null
            );

        errorMessage.value =
            serverMessage
            || error.message
            || "알 수 없는 오류가 발생했습니다.";

        alert(
            `백엔드 연동 중 에러가 발생했습니다: ${
                errorMessage.value
            }`
        );

        router.push("/");
    }
});
</script>

<style scoped>
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