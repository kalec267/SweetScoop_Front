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
          <!-- src/views/OrderComplete.vue 의 menu-list 내부 수정 -->
          <div class="menu-list">
            <div v-for="(item, index) in receipt.items" :key="index" class="menu-item-row">
              <!-- 💡 메뉴명/수량과 가격이 한 줄로 나란히 출력되도록 배치 -->
              <div class="menu-item-header">
                <span class="item-main-name">{{ item.menuName }} x {{ item.quantity }}</span>
                <span class="item-price">{{ (item.price * item.quantity).toLocaleString() }}원</span>
              </div>
              
              <!-- 맛 선택 정보 (아이스크림류 등 flavors가 존재하는 경우만 출력) -->
              <div v-if="item.flavors" class="item-options-text">
                - 맛: {{ item.flavors }}
              </div>

              <!-- 옵션 정보 (옵션이 존재하는 경우만 출력) -->
              <div v-if="item.options" class="item-options-text">
                - 옵션: {{ item.options }}
              </div>
            </div>

            <p
              v-if="receiptItems.length === 0"
              class="empty-items"
            >
              주문 상품 정보가 없습니다.
            </p>
          </div>
        </div>
        
        <!-- 이하 기존 결제 정보들 유지 -->
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
const countdown = ref(60); 
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
.complete-container { max-width: 450px; margin: 50px auto; padding: 20px; text-align: center; font-family: 'Pretendard', sans-serif; }
.receipt-card { background: white; padding: 40px 30px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); margin-bottom: 20px; }
.success-icon { font-size: 60px; margin-bottom: 10px; }
h1 { font-size: 24px; margin-bottom: 10px; color: #1a1a1a; }
.guide-text { color: #666; font-size: 14px; margin-bottom: 30px; }
.waiting-box { background: #f0f7ff; color: #3182f6; padding: 20px; border-radius: 20px; margin-bottom: 30px; }
.waiting-box p { font-size: 14px; margin: 0; font-weight: 600; }
.waiting-box .number { font-size: 64px; font-weight: 800; margin-top: 5px; line-height: 1; }
.info-container { border-top: 1px dashed #e2e8f0; padding-top: 20px; }
.info-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
.label { color: #718096; }
.value { color: #2d3748; font-weight: 600; }
.amount { color: #3182f6; font-size: 16px; }
.timer { color: #a0aec0; font-size: 14px; font-weight: bold; }
/* 스타일 추가 또는 수정 */
.menu-list { margin: 15px 0; border-bottom: 1px dashed #e5e7eb; padding-bottom: 10px; text-align: left; }
.menu-item-row { margin-bottom: 12px; }

/* 💡 메뉴 헤더 한 줄 정렬 스타일 */
.menu-item-header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
}

.item-main-name { font-weight: 600; color: #2d3748; font-size: 14px; }
.item-price { font-weight: 600; color: #2d3748; font-size: 14px; }
.item-options-text { font-size: 12px; color: #718096; margin-top: 3px; padding-left: 4px; }
.home-button {border-radius: 22px; color: #D90072; background-color: #FFE3f1; font-size: 13px; border-style: none; font-weight: 800; padding: 9px 15px;}
</style>
