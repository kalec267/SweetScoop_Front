```vue
<template>
  <section class="delivery-page">
    <!-- 페이지 상단 -->
    <div class="page-header">
      <div>
        <p class="page-eyebrow">물류 관리</p>

        <h2>배송 현황 관리</h2>

        <p class="page-description">
          승인된 발주 요청의 배송 상태를 확인하고 변경할 수 있습니다.
        </p>
      </div>

      <button
        type="button"
        class="refresh-button"
        :disabled="isLoading"
        @click="fetchDeliveries"
      >
        <span :class="{ rotating: isLoading }">
          ↻
        </span>

        새로고침
      </button>
    </div>

    <!-- 요약 카드 -->
    <div class="summary-grid">
      <article class="summary-card">
        <div class="summary-icon">
          📦
        </div>

        <div>
          <p>전체 배송</p>
          <strong>{{ deliveryList.length }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon preparing">
          ⏳
        </div>

        <div>
          <p>배송 준비중</p>
          <strong>{{ preparingCount }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon shipping">
          🚚
        </div>

        <div>
          <p>배송중</p>
          <strong>{{ shippingCount }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon completed">
          ✓
        </div>

        <div>
          <p>배송 완료</p>
          <strong>{{ completedCount }}</strong>
        </div>
      </article>
    </div>

    <!-- 테이블 카드 -->
    <div class="table-card">
      <div class="table-toolbar">
        <div>
          <h3>배송 요청 목록</h3>

          <p>
            총 {{ filteredDeliveryList.length }}건의 배송 요청
          </p>
        </div>

        <div class="filter-area">
          <div class="search-box">
            <span>🔍</span>

            <input
              v-model.trim="searchKeyword"
              type="text"
              placeholder="분점명 또는 물품명 검색"
            />
          </div>

          <select v-model="selectedStatus">
            <option value="ALL">
              전체 상태
            </option>

            <option value="준비중">
              준비중
            </option>

            <option value="배송중">
              배송중
            </option>

            <option value="배송완료">
              배송완료
            </option>
          </select>
        </div>
      </div>

      <!-- 로딩 상태 -->
      <div
        v-if="isLoading"
        class="state-box"
      >
        <div class="loading-spinner"></div>

        <p>
          배송 목록을 불러오는 중입니다.
        </p>
      </div>

      <!-- 조회 결과 없음 -->
      <div
        v-else-if="filteredDeliveryList.length === 0"
        class="state-box"
      >
        <span class="empty-icon">
          📭
        </span>

        <h4>
          조회된 배송 요청이 없습니다.
        </h4>

        <p>
          검색 조건이나 배송 상태를 다시 확인해 주세요.
        </p>
      </div>

      <!-- 배송 목록 -->
      <div
        v-else
        class="table-wrapper"
      >
        <table>
          <thead>
            <tr>
              <th>발주 ID</th>
              <th>목적지 분점</th>
              <th>배송 물품</th>
              <th>수량</th>
              <th>배송 상태</th>
              <th>상태 변경</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in filteredDeliveryList"
              :key="item.requestId"
            >
              <td>
                <span class="request-id">
                  #DEL-{{ item.requestId }}
                </span>
              </td>

              <td>
                <div class="branch-cell">
                  <span class="branch-icon">
                    🏪
                  </span>

                  <div>
                    <strong>
                      {{ item.branchName }}
                    </strong>

                    <small>
                      분점 배송
                    </small>
                  </div>
                </div>
              </td>

              <td>
                <div class="product-cell">
                  <span class="product-icon">
                    🍦
                  </span>

                  <span>
                    {{ item.requestMenu }}
                  </span>
                </div>
              </td>

              <td>
                <strong>
                  {{ item.quantity }}
                </strong>

                <span class="quantity-unit">
                  개
                </span>
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="
                    getStatusClass(
                      getDeliveryStatus(item)
                    )
                  "
                >
                  <span class="status-dot"></span>

                  {{ getDeliveryStatus(item) }}
                </span>
              </td>

              <td>
                <button
                  v-if="
                    getDeliveryStatus(item) === '준비중'
                  "
                  type="button"
                  class="action-button shipping-button"
                  :disabled="
                    updatingId === item.requestId
                  "
                  @click="
                    updateDelivery(
                      item.requestId,
                      '배송중'
                    )
                  "
                >
                  <span>🚚</span>

                  {{
                    updatingId === item.requestId
                      ? "처리 중"
                      : "배송 출발"
                  }}
                </button>

                <button
                  v-else-if="
                    getDeliveryStatus(item) === '배송중'
                  "
                  type="button"
                  class="action-button complete-button"
                  :disabled="
                    updatingId === item.requestId
                  "
                  @click="
                    updateDelivery(
                      item.requestId,
                      '배송완료'
                    )
                  "
                >
                  <span>✓</span>

                  {{
                    updatingId === item.requestId
                      ? "처리 중"
                      : "배송 완료"
                  }}
                </button>

                <span
                  v-else
                  class="complete-text"
                >
                  🎉 처리 완료
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import {
  computed,
  onMounted,
  ref
} from "vue";

import api from "@/api/index.js";

/*
 * 배송 목록 및 화면 상태
 */
const deliveryList = ref([]);
const searchKeyword = ref("");
const selectedStatus = ref("ALL");

const isLoading = ref(false);
const updatingId = ref(null);

/*
 * 요청의 고유 ID 추출
 */
const getRequestId = (item) => {
  return (
    item?.requestId ??
    item?.hqInventoryId ??
    item?.id ??
    null
  );
};

/*
 * 배송 상태 표준화
 */
const getDeliveryStatus = (item) => {
  if (!item) {
    return "준비중";
  }

  const status = String(
    item.deliveryStatus ||
    item.status ||
    ""
  )
    .trim()
    .toUpperCase();

  const completedStatuses = [
    "배송완료",
    "배송 완료",
    "DELIVERED",
    "ARRIVED",
    "COMPLETED"
  ];

  const shippingStatuses = [
    "배송중",
    "배송 중",
    "IN_TRANSIT",
    "SHIPPED",
    "SHIPPING"
  ];

  const preparingStatuses = [
    "준비중",
    "준비 중",
    "배송준비중",
    "배송 준비중",
    "PREPARING",
    "READY",
    "WAITING"
  ];

  if (completedStatuses.includes(status)) {
    return "배송완료";
  }

  if (shippingStatuses.includes(status)) {
    return "배송중";
  }

  if (preparingStatuses.includes(status)) {
    return "준비중";
  }

  /*
   * 값이 없거나 알 수 없는 배송 상태는 준비중으로 처리
   */
  return "준비중";
};

/*
 * 승인된 발주 요청인지 확인
 */
const isApprovedRequest = (item) => {
  const approvalStatus = String(
    item?.approvalStatus ||
    item?.approval_status ||
    item?.status ||
    ""
  )
    .trim()
    .toUpperCase();

  const approvedStatuses = [
    "승인",
    "승인완료",
    "승인 완료",
    "APPROVED",
    "COMPLETED"
  ];

  return approvedStatuses.includes(
    approvalStatus
  );
};

/*
 * 배송 상태별 개수
 */
const preparingCount = computed(() => {
  return deliveryList.value.filter(
    (item) =>
      getDeliveryStatus(item) === "준비중"
  ).length;
});

const shippingCount = computed(() => {
  return deliveryList.value.filter(
    (item) =>
      getDeliveryStatus(item) === "배송중"
  ).length;
});

const completedCount = computed(() => {
  return deliveryList.value.filter(
    (item) =>
      getDeliveryStatus(item) === "배송완료"
  ).length;
});

/*
 * 검색, 상태 필터 및 정렬
 *
 * 정렬 순서:
 * 1. 준비중
 * 2. 배송중
 * 3. 배송완료
 *
 * 동일 상태에서는 ID가 큰 요청을 먼저 표시
 */
const filteredDeliveryList = computed(() => {
  const keyword =
    searchKeyword.value
      .trim()
      .toLowerCase();

  const filtered =
    deliveryList.value.filter((item) => {
      const branchName = String(
        item.branchName || ""
      ).toLowerCase();

      const requestMenu = String(
        item.requestMenu ||
        item.itemName ||
        ""
      ).toLowerCase();

      const deliveryStatus =
        getDeliveryStatus(item);

      const matchesKeyword =
        !keyword ||
        branchName.includes(keyword) ||
        requestMenu.includes(keyword);

      const matchesStatus =
        selectedStatus.value === "ALL" ||
        deliveryStatus ===
          selectedStatus.value;

      return (
        matchesKeyword &&
        matchesStatus
      );
    });

  const statusPriority = {
    준비중: 1,
    배송중: 2,
    배송완료: 3
  };

  return [...filtered].sort((a, b) => {
    const priorityA =
      statusPriority[
        getDeliveryStatus(a)
      ] ?? 99;

    const priorityB =
      statusPriority[
        getDeliveryStatus(b)
      ] ?? 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    const idA =
      Number(getRequestId(a)) || 0;

    const idB =
      Number(getRequestId(b)) || 0;

    return idB - idA;
  });
});

/*
 * 배송 상태별 CSS 클래스
 */
const getStatusClass = (status) => {
  if (status === "준비중") {
    return "status-preparing";
  }

  if (status === "배송중") {
    return "status-shipping";
  }

  if (status === "배송완료") {
    return "status-completed";
  }

  return "status-default";
};

/*
 * 백엔드 응답을 화면용 구조로 변환
 */
const normalizeDeliveryItem = (item) => {
  return {
    requestId: getRequestId(item),

    branchName:
      item.branch?.branchName ||
      item.branchName ||
      item.branch_name ||
      "스윗스쿱 지점",

    requestMenu:
      item.item?.itemName ||
      item.itemName ||
      item.item_name ||
      item.requestMenu ||
      "원자재 물품",

    quantity: Number(
      item.requestQuantity ??
      item.request_quantity ??
      item.quantity ??
      0
    ),

    deliveryStatus:
      item.deliveryStatus ||
      item.delivery_status ||
      "준비중",

    approvalStatus:
      item.approvalStatus ||
      item.approval_status ||
      item.status ||
      ""
  };
};

/*
 * 전체 배송 목록 조회
 */
const fetchDeliveries = async () => {
  isLoading.value = true;

  try {
    const response = await api.get(
      "/api/admin/branches/orders"
    );

    const responseData =
      Array.isArray(response.data)
        ? response.data
        : [];

    deliveryList.value = responseData
      .filter(isApprovedRequest)
      .map(normalizeDeliveryItem)
      .filter(
        (item) =>
          item.requestId !== null &&
          item.requestId !== undefined
      );
  } catch (error) {
    console.error(
      "배송 목록 조회 실패:",
      error
    );

    deliveryList.value = [];

    const responseData =
      error.response?.data;

    const errorMessage =
      typeof responseData === "string"
        ? responseData
        : responseData?.message;

    if (errorMessage) {
      window.alert(errorMessage);
    }
  } finally {
    isLoading.value = false;
  }
};

/*
 * 배송 상태 변경
 */
const updateDelivery = async (
  id,
  status
) => {
  if (
    id === null ||
    id === undefined
  ) {
    window.alert(
      "배송 요청 ID를 확인할 수 없습니다."
    );

    return;
  }

  if (updatingId.value !== null) {
    return;
  }

  const confirmed = window.confirm(
    `배송 상태를 [${status}]로 변경하시겠습니까?`
  );

  if (!confirmed) {
    return;
  }

  updatingId.value = id;

  try {
    /*
     * 우선 기본 배송 상태 변경 API 호출
     */
    try {
      await api.patch(
        `/api/admin/branches/orders/${id}/delivery`,
        {
          deliveryStatus: status
        }
      );
    } catch (primaryError) {
      const statusCode =
        primaryError.response?.status;

      /*
       * 기본 API 경로가 없는 경우에만
       * 예비 API 호출
       */
      if (
        statusCode !== 404 &&
        statusCode !== 405
      ) {
        throw primaryError;
      }

      await api.patch(
        `/api/admin/hq-orders/${id}/status`,
        null,
        {
          params: {
            deliveryStatus: status
          }
        }
      );
    }

    /*
     * 화면 상태를 즉시 변경
     */
    const targetItem =
      deliveryList.value.find(
        (item) =>
          item.requestId === id
      );

    if (targetItem) {
      targetItem.deliveryStatus =
        status;
    }

    window.alert(
      `배송 상태가 [${status}]로 변경되었습니다.`
    );

    /*
     * 서버의 최신 데이터 다시 조회
     */
    await fetchDeliveries();
  } catch (error) {
    console.error(
      "배송 상태 변경 실패:",
      error
    );

    const responseData =
      error.response?.data;

    const message =
      typeof responseData === "string"
        ? responseData
        : responseData?.message ||
          "배송 상태 변경에 실패했습니다.";

    window.alert(message);
  } finally {
    updatingId.value = null;
  }
};

/*
 * 화면 최초 진입 시 배송 목록 조회
 */
onMounted(() => {
  fetchDeliveries();
});
</script>

<style scoped>
.delivery-page {
  width: 100%;
  min-width: 0;
  padding: 32px;
  box-sizing: border-box;
  background: #f8fafc;
}

.page-header {
  margin-bottom: 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.page-eyebrow {
  margin: 0 0 6px;
  color: #d13b7d;
  font-size: 13px;
  font-weight: 700;
}

.page-header h2 {
  margin: 0;
  color: #172033;
  font-size: 28px;
  font-weight: 800;
}

.page-description {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.refresh-button {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  background: white;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
}

.refresh-button:hover {
  border-color: #d13b7d;
  color: #d13b7d;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rotating {
  display: inline-block;
  animation: rotate 0.8s linear infinite;
}

.summary-grid {
  margin-bottom: 26px;
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  min-width: 0;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  border: 1px solid #edf0f4;
  border-radius: 14px;
  background: white;
  box-shadow:
    0 4px 14px
    rgba(15, 23, 42, 0.04);
}

.summary-icon {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 12px;
  background: #fce7f3;
  font-size: 21px;
}

.summary-icon.preparing {
  background: #fff7ed;
}

.summary-icon.shipping {
  background: #eff6ff;
}

.summary-icon.completed {
  background: #ecfdf5;
  color: #16a34a;
  font-weight: 800;
}

.summary-card p {
  margin: 0 0 5px;
  color: #64748b;
  font-size: 13px;
}

.summary-card strong {
  color: #172033;
  font-size: 25px;
  font-weight: 800;
}

.table-card {
  overflow: hidden;
  border: 1px solid #e5eaf0;
  border-radius: 16px;
  background: white;
  box-shadow:
    0 8px 24px
    rgba(15, 23, 42, 0.04);
}

.table-toolbar {
  padding: 20px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid #edf0f4;
}

.table-toolbar h3 {
  margin: 0 0 5px;
  color: #1e293b;
  font-size: 18px;
}

.table-toolbar p {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
}

.filter-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-box {
  width: 250px;
  height: 40px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  border: 1px solid #dfe5ec;
  border-radius: 9px;
  background: #f8fafc;
}

.search-box input {
  width: 100%;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #334155;
  font-size: 13px;
}

.filter-area select {
  height: 40px;
  padding: 0 34px 0 12px;
  border: 1px solid #dfe5ec;
  border-radius: 9px;
  outline: none;
  background: white;
  color: #475569;
  cursor: pointer;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
}

th,
td {
  padding: 16px 18px;
  border-bottom: 1px solid #edf0f4;
  text-align: left;
  vertical-align: middle;
}

th {
  background: #fafbfc;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

td {
  color: #334155;
  font-size: 14px;
}

tbody tr:hover {
  background: #fffafd;
}

tbody tr:last-child td {
  border-bottom: none;
}

.request-id {
  color: #d13b7d;
  font-weight: 700;
}

.branch-cell,
.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.branch-icon,
.product-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 9px;
  background: #f8fafc;
}

.branch-cell strong {
  display: block;
  margin-bottom: 2px;
  color: #1e293b;
}

.branch-cell small {
  display: block;
  color: #94a3b8;
  font-size: 11px;
}

.quantity-unit {
  margin-left: 2px;
  color: #64748b;
  font-size: 12px;
}

.status-badge {
  width: fit-content;
  padding: 6px 10px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.status-preparing {
  background: #fff7ed;
  color: #ea580c;
}

.status-shipping {
  background: #eff6ff;
  color: #2563eb;
}

.status-completed {
  background: #ecfdf5;
  color: #16a34a;
}

.status-default {
  background: #f1f5f9;
  color: #64748b;
}

.action-button {
  min-width: 112px;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.shipping-button {
  background: #eff6ff;
  color: #2563eb;
}

.shipping-button:hover:not(:disabled) {
  background: #dbeafe;
}

.complete-button {
  background: #ecfdf5;
  color: #16a34a;
}

.complete-button:hover:not(:disabled) {
  background: #d1fae5;
}

.action-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.complete-text {
  color: #16a34a;
  font-size: 13px;
  font-weight: 700;
}

.state-box {
  min-height: 290px;
  padding: 50px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  text-align: center;
}

.state-box h4 {
  margin: 12px 0 5px;
  color: #475569;
}

.state-box p {
  margin: 0;
  font-size: 13px;
}

.empty-icon {
  font-size: 38px;
}

.loading-spinner {
  width: 34px;
  height: 34px;
  margin-bottom: 13px;
  border: 4px solid #f1f5f9;
  border-top-color: #d13b7d;
  border-radius: 50%;
  animation: rotate 0.8s linear infinite;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .summary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .table-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-area {
    width: 100%;
  }

  .search-box {
    flex: 1;
    width: auto;
  }
}

@media (max-width: 700px) {
  .delivery-page {
    padding: 20px 16px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .filter-area {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
  }

  .search-box,
  .filter-area select {
    width: 100%;
  }
}
</style>
```
