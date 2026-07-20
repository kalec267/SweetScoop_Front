```vue
<!-- src/views/OrderComplete.vue -->
<template>
  <div
    v-if="receipt"
    class="complete-container"
  >
    <div class="receipt-card">
      <div class="success-icon">
        🎉
      </div>

      <h1>결제 완료</h1>

      <p class="guide-text">
        나오는 영수증과 신용카드를 꼭 챙겨가세요!
      </p>

      <!-- 대기 번호 -->
      <div class="waiting-box">
        <p>고객 호출 대기 번호</p>

        <div class="number">
          {{ receipt.waitingNo ?? "-" }}
        </div>
      </div>

      <div class="info-container">
        <!-- 주문 상품 -->
        <div class="detail-section">
          <h2 class="section-title">
            주문 상품
          </h2>

          <div class="menu-list">
            <div
              v-for="(item, index) in receiptItems"
              :key="createItemKey(item, index)"
              class="menu-row"
            >
              <div class="menu-info">
                <span class="menu-name">
                  {{ item.menuName || "상품" }}
                </span>

                <span class="menu-quantity">
                  × {{ Number(item.quantity || 1) }}
                </span>
              </div>

              <span class="menu-price">
                {{ getItemTotalPrice(item).toLocaleString() }}원
              </span>
            </div>

            <p
              v-if="receiptItems.length === 0"
              class="empty-items"
            >
              주문 상품 정보가 없습니다.
            </p>
          </div>
        </div>

        <!-- 결제 정보 -->
        <div class="info-row">
          <span class="label">
            결제 수단
          </span>

          <span class="value">
            {{ paymentMethodText }}
          </span>
        </div>

        <div class="info-row">
          <span class="label">
            영수증 번호
          </span>

          <span class="value">
            {{ receipt.receiptNo || "-" }}
          </span>
        </div>

        <div class="info-row">
          <span class="label">
            주문 금액
          </span>

          <span class="value">
            {{ originalAmount.toLocaleString() }}원
          </span>
        </div>

        <!-- 쿠폰을 사용한 경우 -->
        <div
          v-if="couponDiscount > 0"
          class="info-row discount-row"
        >
          <span class="label">
            쿠폰 할인
          </span>

          <span class="value discount">
            -{{ couponDiscount.toLocaleString() }}원
          </span>
        </div>

        <!-- 포인트를 사용한 경우 -->
        <div
          v-if="pointUsed > 0"
          class="info-row discount-row"
        >
          <span class="label">
            포인트 사용
          </span>

          <span class="value discount">
            -{{ pointUsed.toLocaleString() }}P
          </span>
        </div>

        <!-- 전체 할인 -->
        <div
          v-if="totalDiscount > 0"
          class="info-row"
        >
          <span class="label">
            총 할인 금액
          </span>

          <span class="value discount">
            -{{ totalDiscount.toLocaleString() }}원
          </span>
        </div>

        <!-- 실제 결제 금액 -->
        <div class="info-row final-payment-row">
          <span class="label">
            최종 결제 금액
          </span>

          <span class="value amount">
            {{ finalAmount.toLocaleString() }}원
          </span>
        </div>

        <!-- 적립 포인트 -->
        <div
          v-if="pointEarned > 0"
          class="info-row point-earned-row"
        >
          <span class="label">
            적립 포인트
          </span>

          <span class="value point-earned">
            +{{ pointEarned.toLocaleString() }}P
          </span>
        </div>

        <div class="info-row">
          <span class="label">
            승인 일시
          </span>

          <span class="value">
            {{ receipt.orderTime || "-" }}
          </span>
        </div>
      </div>
    </div>

    <p class="timer">
      ⏳ {{ countdown }}초 후 메뉴 메인 화면으로 복귀합니다.
    </p>

    <button
      type="button"
      class="home-button"
      @click="goHome"
    >
      확인
    </button>
  </div>

  <div
    v-else
    class="complete-container"
  >
    <p>영수증 정보를 불러오는 중입니다.</p>
  </div>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";

import {
  useRoute,
  useRouter,
} from "vue-router";

import { PrinterService } from "@/utils/printer";

const router = useRouter();
const route = useRoute();

const receipt = ref(null);
const countdown = ref(120);

let timerId = null;

/**
 * 안전하게 숫자로 변환
 */
const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

/**
 * 주문 상품 배열
 */
const receiptItems = computed(() => {
  return Array.isArray(receipt.value?.items)
    ? receipt.value.items
    : [];
});

/**
 * 할인 전 주문 금액
 */
const originalAmount = computed(() => {
  return toNumber(
    receipt.value?.originalAmount
    ?? receipt.value?.totalPrice
  );
});

/**
 * 쿠폰 할인 금액
 */
const couponDiscount = computed(() => {
  return toNumber(
    receipt.value?.couponDiscount
  );
});

/**
 * 사용 포인트
 */
const pointUsed = computed(() => {
  return toNumber(
    receipt.value?.pointUsed
  );
});

/**
 * 전체 할인 금액
 */
const totalDiscount = computed(() => {
  const savedTotalDiscount =
    receipt.value?.totalDiscount;

  if (savedTotalDiscount != null) {
    return toNumber(savedTotalDiscount);
  }

  return couponDiscount.value
    + pointUsed.value;
});

/**
 * 실제 결제 금액
 */
const finalAmount = computed(() => {
  const savedFinalAmount =
    receipt.value?.finalAmount;

  if (savedFinalAmount != null) {
    return toNumber(savedFinalAmount);
  }

  /*
   * 기존 응답과의 호환
   */
  const savedTotalPrice =
    receipt.value?.totalPrice;

  if (savedTotalPrice != null) {
    return toNumber(savedTotalPrice);
  }

  return Math.max(
    0,
    originalAmount.value
      - totalDiscount.value
  );
});

/**
 * 적립 포인트
 */
const pointEarned = computed(() => {
  return toNumber(
    receipt.value?.pointEarned
  );
});

/**
 * 결제 수단 표시
 */
const paymentMethodText = computed(() => {
  const method =
    receipt.value?.paymentMethod
    || "카드";

  const company =
    receipt.value?.cardCompany;

  if (
    !company
    || company === "결제사 정보 없음"
  ) {
    return method;
  }

  return `${method} (${company})`;
});

/**
 * 상품별 최종 금액 계산
 *
 * Mapper에서 totalPrice를 반환하면 그대로 사용하고,
 * 없을 때만 price × quantity 계산
 */
const getItemTotalPrice = (item) => {
  if (item?.totalPrice != null) {
    return toNumber(item.totalPrice);
  }

  const price =
    toNumber(item?.price);

  const quantity =
    toNumber(item?.quantity || 1);

  return price * quantity;
};

/**
 * v-for key 생성
 */
const createItemKey = (item, index) => {
  return [
    item?.orderItemId,
    item?.menuId,
    index,
  ].join("-");
};

/**
 * 영수증 데이터 불러오기
 */
const loadReceipt = () => {
  /*
   * 우선순위:
   * 1. 라우터 query
   * 2. sessionStorage
   */
  const routeData =
    route.query.data;

  const sessionData =
    sessionStorage.getItem(
      "receiptData"
    );

  const rawData =
    routeData || sessionData;

  if (!rawData) {
    throw new Error(
      "영수증 정보를 찾을 수 없습니다."
    );
  }

  const parsedData =
    typeof rawData === "string"
      ? JSON.parse(rawData)
      : rawData;

  if (!parsedData) {
    throw new Error(
      "영수증 데이터가 올바르지 않습니다."
    );
  }

  parsedData.items =
    Array.isArray(parsedData.items)
      ? parsedData.items
      : [];

  receipt.value =
    parsedData;
};

/**
 * 자동 이동 타이머 시작
 */
const startCountdown = () => {
  timerId = window.setInterval(() => {
    countdown.value -= 1;

    if (countdown.value <= 0) {
      clearTimer();
      goHome();
    }
  }, 1000);
};

/**
 * 타이머 제거
 */
const clearTimer = () => {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }
};

/**
 * 주문 정보 초기화 후 홈 이동
 */
const goHome = () => {
  clearTimer();

  sessionStorage.removeItem("receiptData");
  sessionStorage.removeItem("paymentData");
  sessionStorage.removeItem("orderData");
  sessionStorage.removeItem("cartData");

  router.replace("/");
};

onMounted(() => {
  try {
    loadReceipt();

    /*
     * 데이터가 준비된 이후 출력
     */
    if (receipt.value) {
      try {
        PrinterService.printReceipt(
          receipt.value
        );
      } catch (printError) {
        /*
         * 프린터 실패가 완료 화면까지 막지 않도록 분리
         */
        console.error(
          "영수증 출력 실패:",
          printError
        );
      }
    }

    startCountdown();

  } catch (error) {
    console.error(
      "영수증 데이터 처리 실패:",
      error
    );

    window.alert(
      error.message
      || "영수증 정보를 불러오지 못했습니다."
    );

    router.replace("/");
  }
});

onBeforeUnmount(() => {
  clearTimer();
});
</script>

<style scoped>
:global(body) {
  margin: 0;
  background: #f7f8fa;
}

* {
  box-sizing: border-box;
}

.complete-container {
  width: 100%;
  max-width: 500px;
  margin: 50px auto;
  padding: 20px;

  text-align: center;
  font-family:
    "Pretendard",
    "Malgun Gothic",
    sans-serif;
}

.receipt-card {
  margin-bottom: 20px;
  padding: 40px 30px;

  border-radius: 24px;
  background: #ffffff;

  box-shadow:
    0 10px 30px
    rgba(0, 0, 0, 0.08);
}

.success-icon {
  margin-bottom: 10px;

  font-size: 60px;
}

h1 {
  margin: 0 0 10px;

  color: #1a1a1a;
  font-size: 24px;
}

.guide-text {
  margin-bottom: 30px;

  color: #666666;
  font-size: 14px;
}

.waiting-box {
  margin-bottom: 30px;
  padding: 20px;

  border-radius: 20px;
  background: #f0f7ff;

  color: #3182f6;
}

.waiting-box p {
  margin: 0;

  font-size: 14px;
  font-weight: 600;
}

.waiting-box .number {
  margin-top: 5px;

  font-size: 64px;
  font-weight: 800;
  line-height: 1;
}

.info-container {
  padding-top: 20px;

  border-top: 1px dashed #e2e8f0;
}

.section-title {
  margin: 0 0 12px;

  color: #2d3748;
  font-size: 16px;
  text-align: left;
}

.menu-list {
  margin: 0 0 18px;
  padding-bottom: 12px;

  border-bottom: 1px dashed #e5e7eb;
}

.menu-row {
  margin-bottom: 10px;

  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  color: #555555;
  font-size: 14px;
}

.menu-info {
  min-width: 0;

  display: flex;
  gap: 5px;

  text-align: left;
}

.menu-name {
  word-break: keep-all;
}

.menu-quantity {
  color: #718096;
  white-space: nowrap;
}

.menu-price {
  font-weight: 600;
  white-space: nowrap;
}

.empty-items {
  color: #a0aec0;
  font-size: 13px;
}

.info-row {
  margin-bottom: 12px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;

  font-size: 14px;
}

.label {
  color: #718096;
  text-align: left;
}

.value {
  color: #2d3748;
  font-weight: 600;
  text-align: right;
}

.discount {
  color: #e53e76;
}

.final-payment-row {
  margin-top: 15px;
  padding-top: 15px;

  border-top: 1px solid #edf2f7;
}

.amount {
  color: #3182f6;
  font-size: 18px;
  font-weight: 800;
}

.point-earned-row {
  padding: 10px 12px;

  border-radius: 10px;
  background: #f0fff4;
}

.point-earned {
  color: #239653;
}

.timer {
  color: #a0aec0;
  font-size: 14px;
  font-weight: bold;
}

.home-button {
  width: 100%;
  padding: 15px;

  border: 0;
  border-radius: 13px;
  background: #3182f6;

  color: #ffffff;
  font-size: 15px;
  font-weight: 700;

  cursor: pointer;
}
</style>
```
