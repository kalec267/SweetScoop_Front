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
        <span :class="{ rotating: isLoading }">↻</span>
        새로고침
      </button>
    </div>

    <!-- 요약 카드 -->
    <div class="summary-grid">
      <article class="summary-card">
        <div class="summary-icon">📦</div>

        <div>
          <p>전체 배송</p>
          <strong>{{ deliveryList.length }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon preparing">⏳</div>

        <div>
          <p>배송 준비중</p>
          <strong>{{ preparingCount }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon shipping">🚚</div>

        <div>
          <p>배송중</p>
          <strong>{{ shippingCount }}</strong>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon completed">✓</div>

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
          <p>총 {{ filteredDeliveryList.length }}건의 배송 요청</p>
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
            <option value="ALL">전체 상태</option>
            <option value="준비중">준비중</option>
            <option value="배송중">배송중</option>
            <option value="배송완료">배송완료</option>
          </select>
        </div>
      </div>

      <div v-if="isLoading" class="state-box">
        <div class="loading-spinner"></div>
        <p>배송 목록을 불러오는 중입니다.</p>
      </div>

      <div
        v-else-if="filteredDeliveryList.length === 0"
        class="state-box"
      >
        <span class="empty-icon">📭</span>
        <h4>조회된 배송 요청이 없습니다.</h4>
        <p>검색 조건이나 배송 상태를 다시 확인해 주세요.</p>
      </div>

      <div v-else class="table-wrapper">
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
              :key="item.id || item.hqInventoryId || item.requestId"
            >
              <td>
                <span class="request-id">
                  #DEL-{{ item.id || item.hqInventoryId || item.requestId }}
                </span>
              </td>

              <td>
                <div class="branch-cell">
                  <span class="branch-icon">🏪</span>

                  <div>
                    <strong>{{ item.branchName }}</strong>
                    <small>분점 배송</small>
                  </div>
                </div>
              </td>

              <td>
                <div class="product-cell">
                  <span class="product-icon">🍦</span>
                  <span>{{ item.itemName || item.requestMenu }}</span>
                </div>
              </td>

              <td>
                <strong>{{ item.requestQuantity || item.quantity }}</strong>
                <span class="quantity-unit">개</span>
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="getStatusClass(getDeliveryStatus(item))"
                >
                  <span class="status-dot"></span>
                  {{ getDeliveryStatus(item) }}
                </span>
              </td>

              <td>
                <button
                  v-if="getDeliveryStatus(item) === '준비중'"
                  type="button"
                  class="action-button shipping-button"
                  :disabled="updatingId === (item.id || item.hqInventoryId || item.requestId)"
                  @click="
                    updateDelivery(
                      item.id || item.hqInventoryId || item.requestId,
                      '배송중'
                    )
                  "
                >
                  <span>🚚</span>
                  배송 출발
                </button>

                <button
                  v-else-if="
                    getDeliveryStatus(item) === '배송중'
                  "
                  type="button"
                  class="action-button complete-button"
                  :disabled="updatingId === (item.id || item.hqInventoryId || item.requestId)"
                  @click="
                    updateDelivery(
                      item.id || item.hqInventoryId || item.requestId,
                      '배송완료'
                    )
                  "
                >
                  <span>✓</span>
                  배송 완료
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
  ref,
} from "vue";
import api from "@/api/index.js";

const deliveryList = ref([]);
const searchKeyword = ref("");
const selectedStatus = ref("ALL");
const isLoading = ref(false);
const updatingId = ref(null);

// DB의 한글("배송중", "배송완료", "준비중") 및 영문 상태값을 한글 표준 명칭으로 정확히 매핑
const getDeliveryStatus = (item) => {
  if (!item) return "준비중";

  // deliveryStatus 또는 status 키에서 값을 추출
  const raw = item.deliveryStatus || item.status || "";
  const status = String(raw).trim();

  if (status === "배송완료" || status === "DELIVERED" || status === "ARRIVED" || status === "COMPLETED") {
    return "배송완료";
  }

  if (status === "배송중" || status === "IN_TRANSIT" || status === "SHIPPED" || status === "SHIPPING") {
    return "배송중";
  }

  return "준비중";
};

const preparingCount = computed(() => {
  return deliveryList.value.filter(
    (item) => getDeliveryStatus(item) === "준비중"
  ).length;
});

const shippingCount = computed(() => {
  return deliveryList.value.filter(
    (item) => getDeliveryStatus(item) === "배송중"
  ).length;
});

const completedCount = computed(() => {
  return deliveryList.value.filter(
    (item) => getDeliveryStatus(item) === "배송완료"
  ).length;
});

// 검색, 필터링 및 정렬 (준비중 -> 배송중 -> 배송완료 순배치, 동일 상태에서는 최신순)
const filteredDeliveryList = computed(() => {
  const keyword = searchKeyword.value.toLowerCase();

  const filtered = deliveryList.value.filter((item) => {
    const branchName = String(item.branchName || "").toLowerCase();
    const requestMenu = String(item.itemName || item.requestMenu || "").toLowerCase();
    const deliveryStatus = getDeliveryStatus(item);

    const matchesKeyword =
      !keyword || branchName.includes(keyword) || requestMenu.includes(keyword);

    const matchesStatus =
      selectedStatus.value === "ALL" || deliveryStatus === selectedStatus.value;

    return matchesKeyword && matchesStatus;
  });

  const statusPriority = {
    "준비중": 1,
    "배송중": 2,
    "배송완료": 3
  };

  return filtered.sort((a, b) => {
    const priorityA = statusPriority[getDeliveryStatus(a)] || 99;
    const priorityB = statusPriority[getDeliveryStatus(b)] || 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB; // 배송 완료건은 맨 아래로 배치
    }

    const idA = a.id || a.hqInventoryId || a.requestId || 0;
    const idB = b.id || b.hqInventoryId || b.requestId || 0;
    return idB - idA;
  });
});

const getStatusClass = (status) => {
  const normalizedStatus = status || "준비중";

  if (normalizedStatus === "준비중") {
    return "status-preparing";
  }

  if (normalizedStatus === "배송중") {
    return "status-shipping";
  }

  if (normalizedStatus === "배송완료") {
    return "status-completed";
  }

  return "status-default";
};

const fetchDeliveries = async () => {
  isLoading.value = true;

  try {
    const response = await api.get("/api/admin/inventory/requests");
    const responseData = Array.isArray(response.data) ? response.data : [];

    // 반려(REJECTED) 건을 제외하고 전체 목록 셋팅
    deliveryList.value = responseData.filter(
      (item) => item.approvalStatus !== "REJECTED"
    );

  } catch (error) {
    console.error("배송 목록 조회 실패:", error);
    deliveryList.value = [];
  } finally {
    isLoading.value = false;
  }
};

const updateDelivery = async (id, status) => {
  const confirmed = window.confirm(`배송 상태를 [${status}]로 변경하시겠습니까?`);
  if (!confirmed) return;

  updatingId.value = id;

  try {
    // 백엔드로 PATCH 요청 전송
    await api.patch(`/api/admin/inventory/requests/${id}/delivery`, {
      deliveryStatus: status,
    });

    // 성공 후 로컬 데이터 리스트의 상태값을 변경된 상태('배송중' / '배송완료')로 강제 업데이트
    const target = deliveryList.value.find(
      (item) => (item.requestId || item.hqInventoryId || item.id) === id
    );

    if (target) {
      target.status = status;
      target.deliveryStatus = status;
    }

    window.alert(`배송 상태가 [${status}]로 변경되었습니다.`);

  } catch (error) {
    console.error("배송 상태 변경 실패:", error);
    window.alert("배송 상태 변경에 실패했습니다.");
  } finally {
    updatingId.value = null;
  }
};

onMounted(() => {
  fetchDeliveries();
});
</script>

<style scoped>
.delivery-page {
  width: 100%;
  min-width: 0;
  padding: 32px;
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}

.summary-icon {
  width: 46px;
  height: 46px;

  display: flex;
  align-items: center;
  justify-content: center;

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
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
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

.shipping-button:hover {
  background: #dbeafe;
}

.complete-button {
  background: #ecfdf5;
  color: #16a34a;
}

.complete-button:hover {
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
    align-items: stretch;
    flex-direction: column;
  }

  .search-box,
  .filter-area select {
    width: 100%;
  }
}
</style>