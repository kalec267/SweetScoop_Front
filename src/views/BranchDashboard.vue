<template>
  <div class="branch-dashboard">
    <div class="dashboard-header">
      <div>
        <h2>분점 관리 파트너 (스윗스쿱 강남역점)</h2>
        <p class="subtitle">
          실시간 지점 원자재 재고 관리 및 본사 신청 현황
        </p>
      </div>

      <div class="header-actions">
        <button
          class="btn-test"
          @click="testResetOrders"
        >
          🧪 초기화 테스트
        </button>

        <button
          class="btn-order"
          @click="openOrderModal"
        >
          ＋ 본사 재고 신청 (발주)
        </button>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- 키오스크 제어 -->
      <div class="grid-section">
        <div class="section-title-box">
          <h3>🖥️ 매장 키오스크 가동 현황</h3>
          <span class="badge-tag blue">기기 제어</span>
        </div>

        <div class="kiosk-control-container">
          <div
            v-if="isKioskLoading"
            class="empty-state"
          >
            키오스크 정보를 불러오는 중...
          </div>

          <div
            v-else-if="kioskList.length === 0"
            class="empty-state"
          >
            등록된 키오스크 기기가 없습니다.
          </div>

          <div
            v-else
            class="kiosk-grid"
          >
            <div
              v-for="kiosk in kioskList"
              :key="kiosk.id"
              class="kiosk-card"
              :class="{
                'is-active': isKioskActive(kiosk.status)
              }"
            >
              <div class="kiosk-card-header">
                <span class="kiosk-title">
                  {{
                    kiosk.kioskName ||
                    `키오스크 #${kiosk.id}`
                  }}
                </span>

                <span
                  :class="getStatusBadgeClass(kiosk.status)"
                >
                  {{ getStatusText(kiosk.status) }}
                </span>
              </div>

              <div class="kiosk-card-body">
                <p class="kiosk-id-info">
                  기기 식별번호:
                  <strong>#{{ kiosk.id }}</strong>
                </p>
              </div>

              <div class="kiosk-card-footer">
                <span class="switch-text">
                  {{
                    isKioskActive(kiosk.status)
                      ? "운영 중 (ON)"
                      : "운영 중지 (OFF)"
                  }}
                </span>

                <label class="switch">
                  <input
                    type="checkbox"
                    :checked="isKioskActive(kiosk.status)"
                    :disabled="kiosk.isUpdating"
                    @change="toggleKioskStatus(kiosk)"
                  />

                  <span class="slider round"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 실시간 주문 -->
      <div class="grid-section">
        <div class="section-title-box">
          <h3>🔔 실시간 키오스크 주문 접수</h3>
          <span class="badge-tag green">LIVE</span>
        </div>

        <div class="order-list">
          <div
            v-if="activeRealtimeOrders.length === 0"
            class="empty-state"
          >
            들어온 실시간 주문이 없습니다. 대기 중...
          </div>

          <div
            v-for="order in activeRealtimeOrders"
            :key="order.docId || order.orderId"
            class="order-item live-order-card"
            @click="toggleOrderDetail(order.orderId)"
          >
            <div class="order-meta">
              <span class="order-id">
                주문번호: #{{ order.orderNo }}
                (웨이팅:
                <strong>{{ order.waitingNo }}</strong>번)
              </span>

              <div class="order-actions">
                <button
                  class="btn-receipt"
                  @click.stop="openReceiptModal(order)"
                >
                  영수증
                </button>

                <button
                  class="btn-complete"
                  @click.stop="completeOrder(order.orderId)"
                >
                  제조완료
                </button>

                <button
                  class="btn-cancel-order"
                  @click.stop="cancelOrder(order.orderId)"
                >
                  주문취소
                </button>

                <span class="order-status status-waiting">
                  {{ order.status }}
                </span>

                <span class="expand-icon">
                  {{ order.expanded ? "▲" : "▼" }}
                </span>
              </div>
            </div>

            <div class="order-body order-body-column">
              <div class="order-total-row">
                <span>총 결제금액</span>

                <span class="order-total-price">
                  {{
                    Number(
                      order.totalPrice || 0
                    ).toLocaleString()
                  }}원
                </span>
              </div>

              <div
                v-if="order.expanded"
                class="order-detail-box"
                @click.stop
              >
                <div class="detail-divider"></div>

                <p class="detail-title">
                  📦 세부 주문 사항
                </p>

                <div
                  v-for="(item, idx) in order.items || []"
                  :key="idx"
                  class="detail-item-row"
                >
                  <div class="detail-item-name">
                    <span
                      v-if="item.sizeName"
                      class="detail-size-name"
                    >
                      [{{ item.sizeName }}]
                    </span>

                    {{ getItemDisplayName(item) }}
                  </div>

                  <div
                    v-if="formatItemFlavors(item)"
                    class="option-tag"
                  >
                    맛: {{ formatItemFlavors(item) }}
                  </div>

                  <div
                    v-if="formatOptions(item)"
                    class="option-tag"
                  >
                    옵션: {{ formatOptions(item) }}
                  </div>

                  <div class="detail-item-bottom">
                    <span>
                      수량: {{ item.quantity || 0 }}개
                    </span>

                    <span>
                      금액:
                      {{
                        Number(
                          item.totalPrice ||
                          item.price ||
                          0
                        ).toLocaleString()
                      }}원
                    </span>
                  </div>
                </div>

                <div class="payment-method">
                  결제수단:
                  {{ order.paymentMethod || "카드결제" }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 지점 재고 -->
      <div class="grid-section">
        <div class="section-title-box">
          <h3>🍦 매장 원자재 재고 보유량</h3>
          <span class="badge-tag pink">실시간</span>
        </div>

        <div class="inventory-cards">
          <div
            v-if="branchInventory.length === 0"
            class="empty-state"
          >
            원자재 재고 정보가 없습니다.
          </div>

          <div
            v-for="item in branchInventory"
            :key="item.itemId"
            class="inv-card"
          >
            <div class="inv-info">
              <span class="inv-name">
                {{ item.itemName }}
              </span>

              <span class="inv-weight">
                {{
                  Number(
                    item.stockLevel || 0
                  ).toLocaleString()
                }}g 남음
              </span>
            </div>

            <div class="progress-bar-bg">
              <div
                class="progress-bar-fill"
                :style="{
                  width:
                    getPercentage(item.stockLevel) + '%'
                }"
                :class="
                  getProgressBarClass(item.stockLevel)
                "
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 발주 내역 -->
      <div class="grid-section">
        <div class="section-title-box">
          <h3>📄 발주 신청 및 배송 현황</h3>
          <span class="badge-tag gray">발주 내역</span>
        </div>

        <div class="order-list">
          <div
            v-if="myRequests.length === 0"
            class="empty-state"
          >
            신청 내역이 없습니다.
          </div>

          <div
            v-for="order in myRequests"
            :key="order.id"
            class="order-item"
          >
            <div class="order-meta">
              <span class="order-id">
                #REQ-{{ order.id }}
              </span>

              <span class="order-date">
                {{ order.requestDate }}
              </span>
            </div>

            <div class="order-body">
              <span class="order-menu">
                {{ order.menuName }}
                ({{ order.quantity }}개)
              </span>

              <span
                class="order-status"
                :class="getStatusClass(order.status)"
              >
                {{ order.status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 발주 모달 -->
    <div
      v-if="isOrderModalOpen"
      class="modal-overlay"
      @click="closeOrderModal"
    >
      <div
        class="modal-content"
        @click.stop
      >
        <h3>본사 재고 신청</h3>

        <p class="modal-desc">
          필요한 벌크 원자재 물품과 신청 수량을 입력하세요.
        </p>

        <div class="form-group">
          <label>신청 물품 선택</label>

          <select v-model="orderForm.itemId">
            <option
              v-for="item in branchInventory"
              :key="item.itemId"
              :value="item.itemId"
            >
              {{ item.itemName }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>신청 수량 (개/Box)</label>

          <input
            v-model.number="orderForm.quantity"
            type="number"
            min="1"
            placeholder="수량 입력"
          />
        </div>

        <div class="modal-actions">
          <button
            class="btn-cancel"
            @click="closeOrderModal"
          >
            취소
          </button>

          <button
            class="btn-submit"
            @click="submitOrder"
          >
            신청 완료
          </button>
        </div>
      </div>
    </div>

    <!-- 영수증 모달 -->
    <div
      v-if="isReceiptModalOpen"
      class="modal-overlay"
      @click="closeReceiptModal"
    >
      <div
        class="receipt-modal-content"
        @click.stop
      >
        <div class="receipt-header">
          <h4>🍦 스윗스쿱 강남역점</h4>
          <p>주문 영수증 (관리자 확인용)</p>
        </div>

        <div class="receipt-info-box">
          <div>
            주문번호: #{{ selectedReceipt?.orderNo }}
          </div>

          <div>
            웨이팅 번호:
            <strong>
              {{ selectedReceipt?.waitingNo }}번
            </strong>
          </div>

          <div>
            주문 상태: {{ selectedReceipt?.status }}
          </div>
        </div>

        <div class="receipt-divider-line"></div>

        <div class="receipt-items-list">
          <div
            v-for="(item, idx) in selectedReceipt?.items || []"
            :key="idx"
            class="receipt-item-row"
          >
            <div class="receipt-item-name">
              <span>
                <span
                  v-if="item.sizeName"
                  class="receipt-size"
                >
                  [{{ item.sizeName }}]
                </span>

                {{ getItemDisplayName(item) }}
              </span>

              <span>
                {{ item.quantity || 0 }}개
              </span>
            </div>

            <div
              v-if="formatItemFlavors(item)"
              class="receipt-sub-tag"
            >
              맛: {{ formatItemFlavors(item) }}
            </div>

            <div
              v-if="formatOptions(item)"
              class="receipt-sub-tag"
            >
              옵션: {{ formatOptions(item) }}
            </div>

            <div class="receipt-item-price">
              {{
                Number(
                  item.totalPrice ||
                  item.price ||
                  0
                ).toLocaleString()
              }}원
            </div>
          </div>
        </div>

        <div class="receipt-divider-line"></div>

        <div class="receipt-total-box">
          <span>총 결제금액</span>

          <span class="total-price-text">
            {{
              Number(
                selectedReceipt?.totalPrice || 0
              ).toLocaleString()
            }}원
          </span>
        </div>

        <div class="receipt-footer-text">
          결제수단:
          {{ selectedReceipt?.paymentMethod || "카드결제" }}
          <br />
          감사합니다. 언제나 신선함을 전하겠습니다.
        </div>

        <div class="modal-actions receipt-close-actions">
          <button
            class="btn-cancel receipt-close-btn"
            @click="closeReceiptModal"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  onMounted,
  onUnmounted,
  ref,
  computed
} from "vue";

import axios from "../api/index.js";

import {
  collection,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query
} from "firebase/firestore";

import { db } from "@/api/firebase";

const branchId = ref(
  Number(localStorage.getItem("branchId")) || 1
);

const branchInventory = ref([]);
const myRequests = ref([]);
const realtimeOrders = ref([]);

const kioskList = ref([]);
const isKioskLoading = ref(false);

const isOrderModalOpen = ref(false);
const orderForm = ref({
  itemId: 1,
  quantity: 1
});

const isReceiptModalOpen = ref(false);
const selectedReceipt = ref(null);

let unsubscribeOrders = null;

// 완료되지 않은 실시간 주문만 필터링 (대시보드 노출용)
const activeRealtimeOrders = computed(() => {
  return realtimeOrders.value.filter(order => order.status !== 'COMPLETED');
});

/*
 * 키오스크 목록 조회
 */
const fetchKiosks = async () => {
  isKioskLoading.value = true;

  try {
    const response = await axios.get(
      `/api/admin/branches/${branchId.value}/kiosks`
    );

    const data = Array.isArray(response.data)
      ? response.data
      : [];

    kioskList.value = data.map((item) => ({
      ...item,
      isUpdating: false
    }));
  } catch (primaryError) {
    try {
      const fallbackResponse = await axios.get(
        `/api/kiosk/branch/${branchId.value}`
      );

      const data = Array.isArray(
        fallbackResponse.data
      )
        ? fallbackResponse.data
        : [];

      kioskList.value = data.map((item) => ({
        ...item,
        isUpdating: false
      }));
    } catch (fallbackError) {
      console.error(
        "키오스크 목록 조회 실패:",
        fallbackError
      );

      kioskList.value = [];
    }
  } finally {
    isKioskLoading.value = false;
  }
};

const isKioskActive = (status) => {
  return (
    status === "ACTIVE" ||
    status === "정상"
  );
};

const getStatusText = (status) => {
  if (
    status === "ACTIVE" ||
    status === "정상"
  ) {
    return "정상";
  }

  if (
    status === "INACTIVE" ||
    status === "꺼짐"
  ) {
    return "꺼짐";
  }

  return status || "장애";
};

const getStatusBadgeClass = (status) => {
  const active = isKioskActive(status);

  return {
    "status-badge": true,
    "badge-normal": active,
    "badge-off":
      !active && status !== "장애",
    "badge-error": status === "장애"
  };
};

const toggleKioskStatus = async (kiosk) => {
  const active = isKioskActive(kiosk.status);

  const nextDisplayStatus =
    active ? "꺼짐" : "정상";

  const nextApiStatus =
    active ? "INACTIVE" : "ACTIVE";

  const confirmed = window.confirm(
    active
      ? `키오스크 #${kiosk.id} 가동을 중지하시겠습니까?`
      : `키오스크 #${kiosk.id}를 활성화하시겠습니까?`
  );

  if (!confirmed) {
    kioskList.value = [...kioskList.value];
    return;
  }

  kiosk.isUpdating = true;

  try {
    try {
      const response = await axios.patch(
        `/api/admin/kiosks/${kiosk.id}/status`,
        {
          status: nextDisplayStatus
        }
      );

      kiosk.status =
        response.data?.status ||
        nextDisplayStatus;
    } catch (primaryError) {
      const response = await axios.patch(
        `/api/kiosk/${kiosk.id}/status`,
        null,
        {
          params: {
            status: nextApiStatus
          }
        }
      );

      kiosk.status =
        response.data?.status ||
        nextApiStatus;
    }
  } catch (error) {
    console.error(
      "키오스크 상태 변경 실패:",
      error
    );

    window.alert(
      "키오스크 상태 변경에 실패했습니다."
    );
  } finally {
    kiosk.isUpdating = false;
  }
};

/*
 * 테스트 초기화
 */
const testResetOrders = async () => {
  const confirmed = window.confirm(
    "일일 초기화를 진행하시겠습니까? Firebase 실시간 주문 목록이 초기화됩니다."
  );

  if (!confirmed) {
    return;
  }

  try {
    await axios.post(
      "/api/admin/orders/reset"
    );

    realtimeOrders.value = [];

    window.alert(
      "초기화가 완료되었습니다. 웨이팅 번호가 1번부터 시작됩니다."
    );
  } catch (error) {
    console.error(
      "초기화 실패:",
      error
    );

    window.alert(
      "초기화 요청 중 오류가 발생했습니다."
    );
  }
};

/*
 * 지점 재고 조회
 */
const fetchBranchInventory = async () => {
  try {
    const response = await axios.get(
      `/api/admin/branches/${branchId.value}/inventory`
    );

    const data = Array.isArray(response.data)
      ? response.data
      : [];

    branchInventory.value = data.map(
      (inventory) => ({
        itemId:
          inventory.item?.id ||
          inventory.itemId,

        itemName:
          inventory.item?.itemName ||
          inventory.itemName ||
          "원자재",

        stockLevel: Number(
          inventory.stockLevel ?? 0
        )
      })
    );
  } catch (error) {
    console.error(
      "지점 재고 조회 실패:",
      error
    );

    branchInventory.value = [];
  }
};

/*
 * 지점 발주 내역 조회
 */
const fetchMyRequests = async () => {
  try {
    const response = await axios.get(
      `/api/admin/branches/${branchId.value}/orders`
    );

    const data = Array.isArray(response.data)
      ? response.data
      : [];

    myRequests.value = data.map((order) => {
      const rawDate =
        order.requestDate ||
        order.regDate ||
        order.createdDate ||
        "";

      const formattedDate = rawDate
        ? String(rawDate)
            .substring(0, 10)
            .replace(/-/g, ".")
        : "";

      return {
        id: order.id,

        menuName:
          order.item?.itemName ||
          order.itemName ||
          "신청 물품",

        quantity:
          order.requestQuantity ||
          order.quantity ||
          0,

        requestDate: formattedDate,

        status:
          order.approvalStatus ||
          order.status ||
          order.orderStatus ||
          "대기 중"
      };
    });
  } catch (error) {
    console.error(
      "지점 발주 내역 조회 실패:",
      error
    );

    myRequests.value = [];
  }
};

/*
 * 주문 표시 헬퍼
 */
const getItemDisplayName = (item) => {
  if (!item) {
    return "메뉴명 없음";
  }

  const baseName =
    item.name ||
    item.menuName ||
    item.productName ||
    item.title ||
    "";

  const icecreamSizes = [
    "파인트",
    "쿼터",
    "패밀리",
    "하프갤런",
    "싱글",
    "더블",
    "싱글콘",
    "더블콘",
    "싱글컵",
    "더블컵"
  ];

  const isIceCream =
    icecreamSizes.some((size) =>
      String(item.sizeName || "").includes(size)
    ) ||
    baseName.includes(",");

  return isIceCream
    ? "아이스크림"
    : baseName || "메뉴명 없음";
};

const formatItemFlavors = (item) => {
  if (!item) {
    return "";
  }

  const rawFlavors =
    item.menus ||
    item.flavors ||
    [];

  let flavorList = [];

  if (Array.isArray(rawFlavors)) {
    flavorList = rawFlavors
      .map((menu) => {
        if (
          typeof menu === "object" &&
          menu !== null
        ) {
          return (
            menu.name ||
            menu.flavorName ||
            menu.menuName ||
            ""
          );
        }

        return menu;
      })
      .filter(Boolean);
  } else if (
    typeof rawFlavors === "string"
  ) {
    flavorList = rawFlavors
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (
    flavorList.length === 0 &&
    item.menuName &&
    (
      item.sizeName ||
      item.menuName.includes(",")
    )
  ) {
    flavorList = String(item.menuName)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return flavorList.join(", ");
};

const formatOptions = (item) => {
  if (!item) {
    return "";
  }

  if (item.optionName) {
    return item.optionName;
  }

  const options = item.options;

  if (!options) {
    return "";
  }

  if (Array.isArray(options)) {
    return options
      .map((option) => {
        if (
          typeof option === "object" &&
          option !== null
        ) {
          return (
            option.name ||
            option.label ||
            option.optionName ||
            ""
          );
        }

        return option;
      })
      .filter(Boolean)
      .join(", ");
  }

  if (
    typeof options === "object"
  ) {
    return (
      options.name ||
      options.label ||
      options.optionName ||
      JSON.stringify(options)
    );
  }

  return String(options);
};

/*
 * Firebase 실시간 주문
 */
const initRealtimeOrderListener = () => {
  const ordersQuery = query(
    collection(db, "orders")
  );

  unsubscribeOrders = onSnapshot(
    ordersQuery,

    (snapshot) => {
      snapshot
        .docChanges()
        .forEach((change) => {
          if (change.type === "added") {
            const orderData =
              change.doc.data();

            const alreadyExists =
              realtimeOrders.value.some(
                (order) =>
                  order.docId ===
                  change.doc.id
              );

            if (alreadyExists) {
              return;
            }

            realtimeOrders.value.unshift({
              ...orderData,
              docId: change.doc.id,
              expanded: false
            });
          }

          if (change.type === "modified") {
            const index =
              realtimeOrders.value.findIndex(
                (order) =>
                  order.docId ===
                  change.doc.id
              );

            if (index !== -1) {
              realtimeOrders.value[index] = {
                ...realtimeOrders.value[index],
                ...change.doc.data()
              };
            }
          }

          if (change.type === "removed") {
            realtimeOrders.value =
              realtimeOrders.value.filter(
                (order) =>
                  order.docId !==
                  change.doc.id
              );
          }
        });
    },

    (error) => {
      console.error(
        "Firebase 실시간 주문 연결 실패:",
        error
      );
    }
  );
};

const toggleOrderDetail = (orderId) => {
  const target =
    realtimeOrders.value.find(
      (order) =>
        order.orderId === orderId
    );

  if (target) {
    target.expanded =
      !target.expanded;
  }
};

const completeOrder = async (orderId) => {
  const targetOrder =
    realtimeOrders.value.find(
      (order) =>
        order.orderId === orderId
    );

  if (!targetOrder) {
    return;
  }

  const confirmed = window.confirm(
    "이 주문을 제조 완료 처리하시겠습니까?"
  );

  if (!confirmed) {
    return;
  }

  try {
    if (targetOrder.docId) {
      const orderRef = doc(db, "orders", targetOrder.docId);
      await updateDoc(orderRef, { status: 'COMPLETED' });
    }
  } catch (error) {
    console.error(
      "주문 완료 처리 실패:",
      error
    );

    window.alert(
      "주문 완료 처리 중 오류가 발생했습니다."
    );
  }
};

const cancelOrder = async (orderId) => {
  const confirmed = window.confirm(
    "정말 이 주문을 취소하시겠습니까? 데이터베이스에서 주문 정보가 삭제됩니다."
  );

  if (!confirmed) {
    return;
  }

  const targetOrder =
    realtimeOrders.value.find(
      (order) =>
        order.orderId === orderId
    );

  if (!targetOrder) {
    return;
  }

  try {
    await axios.delete(
      `/api/admin/orders/${orderId}`
    );

    if (targetOrder.docId) {
      await deleteDoc(
        doc(
          db,
          "orders",
          targetOrder.docId
        )
      );
    }

    realtimeOrders.value =
      realtimeOrders.value.filter(
        (order) =>
          order.orderId !== orderId
      );

    window.alert(
      "주문이 취소되었습니다."
    );
  } catch (error) {
    console.error(
      "주문 취소 처리 실패:",
      error
    );

    window.alert(
      "주문 취소 처리 중 오류가 발생했습니다."
    );
  }
};

/*
 * 영수증 모달
 */
const openReceiptModal = (order) => {
  selectedReceipt.value = order;
  isReceiptModalOpen.value = true;
};

const closeReceiptModal = () => {
  isReceiptModalOpen.value = false;
  selectedReceipt.value = null;
};

/*
 * 발주 모달
 */
const openOrderModal = () => {
  orderForm.value = {
    itemId:
      branchInventory.value[0]?.itemId ||
      1,

    quantity: 1
  };

  isOrderModalOpen.value = true;
};

const closeOrderModal = () => {
  isOrderModalOpen.value = false;
};

const submitOrder = async () => {
  const quantity = Number(
    orderForm.value.quantity
  );

  if (!orderForm.value.itemId) {
    window.alert(
      "신청할 물품을 선택해주세요."
    );

    return;
  }

  if (
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    window.alert(
      "신청 수량은 1개 이상의 정수로 입력해주세요."
    );

    return;
  }

  try {
    const payload = {
      branchId: branchId.value,
      itemId: orderForm.value.itemId,
      quantity
    };

    await axios.post(
      "/api/admin/branches/orders",
      payload
    );

    window.alert(
      "본사로 재고 신청이 전달되었습니다."
    );

    closeOrderModal();

    await Promise.all([
      fetchBranchInventory(),
      fetchMyRequests()
    ]);
  } catch (error) {
    console.error(
      "본사 발주 신청 실패:",
      error
    );

    window.alert(
      "본사 발주 신청 처리 중 오류가 발생했습니다."
    );
  }
};

/*
 * UI 헬퍼
 */
const getPercentage = (level) => {
  const numericLevel =
    Number(level) || 0;

  return Math.max(
    0,
    Math.min(
      100,
      (numericLevel / 10000) * 100
    )
  );
};

const getProgressBarClass = (level) => {
  const numericLevel =
    Number(level) || 0;

  if (numericLevel < 3000) {
    return "bar-danger";
  }

  if (numericLevel < 6000) {
    return "bar-warning";
  }

  return "bar-success";
};

const getStatusClass = (status) => {
  switch (status) {
    case "대기 중":
    case "대기중":
    case "PENDING":
      return "status-waiting";

    case "배송 중":
    case "배송중":
    case "SHIPPING":
      return "status-shipping";

    case "완료":
    case "승인완료":
    case "APPROVED":
    case "COMPLETED":
      return "status-done";

    default:
      return "";
  }
};

onMounted(() => {
  fetchKiosks();
  fetchBranchInventory();
  fetchMyRequests();
  initRealtimeOrderListener();
});

onUnmounted(() => {
  if (unsubscribeOrders) {
    unsubscribeOrders();
    unsubscribeOrders = null;
  }
});
</script>

<style scoped>
.branch-dashboard {
  min-height: 100vh;
  padding: 30px;
  box-sizing: border-box;
  background-color: #f8fafc;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.dashboard-header h2 {
  margin: 0;
  color: #1e293b;
  font-size: 22px;
  font-weight: 700;
}

.subtitle {
  margin-top: 4px;
  margin-bottom: 0;
  color: #64748b;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-order,
.btn-test {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-order {
  border: 0;
  background: #d13b7d;
  color: white;
}

.btn-test {
  border: 1px solid #cbd5e1;
  background: #f1f5f9;
  color: #475569;
}

.btn-test:hover {
  background: #e2e8f0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.grid-section {
  height: 380px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
}

.section-title-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-title-box h3 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
}

.badge-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.badge-tag.pink {
  background: #fdf2f8;
  color: #d13b7d;
}

.badge-tag.green {
  background: #ecfdf5;
  color: #059669;
}

.badge-tag.blue {
  background: #eff6ff;
  color: #2563eb;
}

.badge-tag.gray {
  background: #f1f5f9;
  color: #475569;
}

.kiosk-control-container {
  flex: 1;
  overflow-y: auto;
}

.kiosk-grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.kiosk-card {
  padding: 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  transition: 0.2s;
}

.kiosk-card.is-active {
  border-color: #10b981;
}

.kiosk-card-header,
.kiosk-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kiosk-card-header {
  margin-bottom: 8px;
}

.kiosk-title {
  color: #111827;
  font-size: 0.95rem;
  font-weight: 700;
}

.status-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge-normal {
  background: #d1fae5;
  color: #065f46;
}

.badge-off {
  background: #f3f4f6;
  color: #4b5563;
}

.badge-error {
  background: #fee2e2;
  color: #991b1b;
}

.kiosk-card-body {
  margin-bottom: 10px;
}

.kiosk-id-info {
  margin: 0;
  color: #6b7280;
  font-size: 0.8rem;
}

.kiosk-card-footer {
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.switch-text {
  color: #374151;
  font-size: 0.78rem;
  font-weight: 600;
}

.switch {
  width: 42px;
  height: 22px;
  position: relative;
  display: inline-block;
}

.switch input {
  width: 0;
  height: 0;
  opacity: 0;
}

.slider {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  background: #d1d5db;
  cursor: pointer;
  transition: 0.3s;
}

.slider::before {
  width: 16px;
  height: 16px;
  position: absolute;
  left: 3px;
  bottom: 3px;
  border-radius: 50%;
  background: white;
  content: "";
  transition: 0.3s;
}

input:checked + .slider {
  background: #10b981;
}

input:checked + .slider::before {
  transform: translateX(20px);
}

input:disabled + .slider {
  opacity: 0.6;
  cursor: not-allowed;
}

.inventory-cards,
.order-list {
  flex: 1;
  overflow-y: auto;
}

.inventory-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inv-card {
  padding: 12px;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
}

.inv-info {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 13.5px;
}

.inv-name {
  color: #334155;
  font-weight: 600;
}

.inv-weight {
  color: #475569;
  font-weight: 700;
}

.progress-bar-bg {
  height: 8px;
  overflow: hidden;
  border-radius: 4px;
  background: #f1f5f9;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-success {
  background: #10b981;
}

.bar-warning {
  background: #f59e0b;
}

.bar-danger {
  background: #ef4444;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-item {
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.live-order-card {
  padding: 12px;
  border: 1px solid #fce7f3;
  border-radius: 8px;
  background: #fffbfd;
  cursor: pointer;
}

.live-order-card:hover {
  background: #fff5f8;
}

.order-meta,
.order-body,
.order-total-row,
.detail-item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-meta {
  gap: 10px;
  margin-bottom: 4px;
  color: #94a3b8;
  font-size: 12px;
}

.order-id {
  color: #475569;
  font-weight: 600;
}

.order-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.order-body-column {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.order-total-row {
  width: 100%;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}

.order-total-price {
  color: #d13b7d;
}

.order-menu {
  color: #334155;
  font-size: 13.5px;
  font-weight: 600;
}

.order-status {
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 11.5px;
  font-weight: 700;
}

.expand-icon {
  color: #64748b;
  font-size: 11px;
}

.btn-receipt,
.btn-complete,
.btn-cancel-order {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.btn-receipt {
  border: 1px solid #fce7f3;
  background: #fdf2f8;
  color: #d13b7d;
}

.btn-complete {
  border: 1px solid #a7f3d0;
  background: #ecfdf5;
  color: #059669;
}

.btn-cancel-order {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #dc2626;
}

.order-detail-box {
  width: 100%;
  margin-top: 8px;
  animation: fade-in 0.2s ease;
}

.detail-divider {
  height: 1px;
  margin: 6px 0;
  background: #f1f5f9;
}

.detail-title {
  margin-bottom: 4px;
  color: #d13b7d;
  font-size: 11.5px;
  font-weight: 700;
}

.detail-item-row {
  margin-bottom: 4px;
  padding: 8px;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  background: white;
  font-size: 12.5px;
}

.detail-item-name {
  color: #1e293b;
  font-weight: 600;
}

.detail-size-name {
  margin-right: 4px;
  color: #d13b7d;
}

.option-tag,
.receipt-sub-tag {
  display: inline-block;
  margin-top: 3px;
  padding: 2px 5px;
  border-radius: 4px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 10.5px;
  font-weight: 600;
}

.detail-item-bottom {
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
}

.payment-method {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed #e2e8f0;
  color: #64748b;
  font-size: 12px;
}

.empty-state {
  padding: 30px 0;
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
}

.status-waiting {
  background: #fffbeb;
  color: #d97706;
}

.status-shipping {
  background: #eff6ff;
  color: #2563eb;
}

.status-done {
  background: #ecfdf5;
  color: #059669;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
}

.modal-content {
  width: 400px;
  padding: 24px;
  border-radius: 12px;
  background: white;
}

.modal-content h3 {
  margin-top: 0;
}

.modal-desc {
  margin-top: 4px;
  margin-bottom: 18px;
  color: #94a3b8;
  font-size: 13px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.form-group label {
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.form-group input,
.form-group select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.btn-cancel,
.btn-submit {
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-cancel {
  border: 1px solid #e2e8f0;
  background: #f1f5f9;
  color: #475569;
}

.btn-submit {
  border: 0;
  background: #d13b7d;
  color: white;
  font-weight: 600;
}

.receipt-modal-content {
  width: 380px;
  padding: 24px;
  box-sizing: border-box;
  border-radius: 8px;
  background: white;
  box-shadow: 0 10px 25px
    rgba(0, 0, 0, 0.2);
  font-family: "Courier New", Courier, monospace;
}

.receipt-header {
  margin-bottom: 12px;
  text-align: center;
}

.receipt-header h4 {
  margin-top: 0;
  margin-bottom: 2px;
  color: #0f172a;
  font-size: 16px;
}

.receipt-header p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.receipt-info-box {
  margin-bottom: 8px;
  color: #334155;
  font-size: 12px;
  line-height: 1.5;
}

.receipt-divider-line {
  margin: 10px 0;
  border-top: 1px dashed #cbd5e1;
}

.receipt-items-list {
  max-height: 220px;
  overflow-y: auto;
}

.receipt-item-row {
  margin-bottom: 10px;
  font-size: 12px;
}

.receipt-item-name {
  display: flex;
  justify-content: space-between;
  color: #1e293b;
  font-weight: 700;
}

.receipt-size {
  margin-right: 4px;
  color: #d13b7d;
}

.receipt-item-price {
  margin-top: 2px;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  text-align: right;
}

.receipt-total-box {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
}

.total-price-text {
  color: #d13b7d;
}

.receipt-footer-text {
  margin-top: 14px;
  color: #64748b;
  font-size: 11px;
  line-height: 1.4;
  text-align: center;
}

.receipt-close-actions {
  margin-top: 16px;
}

.receipt-close-btn {
  width: 100%;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1000px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .grid-section {
    height: auto;
    min-height: 380px;
  }
}

@media (max-width: 700px) {
  .branch-dashboard {
    padding: 18px;
  }

  .dashboard-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .order-meta {
    align-items: flex-start;
    flex-direction: column;
  }

  .order-actions {
    flex-wrap: wrap;
  }

  .modal-content,
  .receipt-modal-content {
    width: calc(100vw - 32px);
  }
}
</style>