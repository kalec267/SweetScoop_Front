<template>
  <div class="orders-history-container">
    <!-- 상단 헤더 영역 -->
    <div class="header-section">
      <div class="title-area">
        <h1 class="page-title">
          <i class="fa-solid fa-receipt text-pink-600"></i> 실시간 키오스크 주문 관리
        </h1>
        <p class="page-subtitle">키오스크를 통해 접수되는 주문 내역을 실시간으로 확인하고 조리 상태를 관리합니다.</p>
      </div>

      <!-- 상태별 요약 뱃지 -->
      <div class="summary-badges">
        <div class="badge-card total">
          <span class="badge-label">전체 주문</span>
          <span class="badge-value">{{ orders.length }}</span>
        </div>
        <div class="badge-card pending">
          <span class="badge-label">접수/대기</span>
          <span class="badge-value">{{ pendingCount }}</span>
        </div>
        <div class="badge-card completed">
          <span class="badge-label">조리완료</span>
          <span class="badge-value">{{ completedCount }}</span>
        </div>
      </div>
    </div>

    <!-- 필터 및 제어 툴바 -->
    <div class="toolbar-section">
      <div class="filter-tabs">
        <button 
          type="button" 
          :class="['filter-btn', { active: currentFilter === 'ALL' }]"
          @click="currentFilter = 'ALL'"
        >
          전체 보기
        </button>
        <button 
          type="button" 
          :class="['filter-btn', { active: currentFilter === 'PENDING' }]"
          @click="currentFilter = 'PENDING'"
        >
          대기중인 주문
        </button>
        <button 
          type="button" 
          :class="['filter-btn', { active: currentFilter === 'COMPLETED' }]"
          @click="currentFilter = 'COMPLETED'"
        >
          완료된 주문
        </button>
      </div>

      <div class="search-box">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="주문번호 또는 전화번호 검색..." 
          class="search-input"
        />
      </div>
    </div>

    <!-- 주문 목록 그리드 -->
    <div class="orders-content">
      <div v-if="loading" class="loading-state">
        <i class="fa-solid fa-spinner fa-spin text-3xl text-pink-600"></i>
        <p>실시간 주문 정보를 불러오는 중입니다...</p>
      </div>

      <div v-else-if="filteredOrders.length === 0" class="empty-state">
        <i class="fa-solid fa-clipboard-question text-4xl text-slate-300"></i>
        <p>조건에 일치하는 주문 내역이 없습니다.</p>
      </div>

      <div v-else class="orders-grid">
        <div 
          v-for="order in filteredOrders" 
          :key="order.id" 
          class="order-card"
          :class="{ 'status-completed': order.status === 'COMPLETED', 'status-pending': order.status !== 'COMPLETED' }"
        >
          <!-- 카드 헤더 -->
          <div class="card-header">
            <div class="order-id-group">
              <span class="order-number-tag">대기번호 {{ formatWaitingNumber(order) }}</span>
              <span class="order-id-text">ID: {{ order.id.substring(0, 8) }}...</span>
            </div>
            <span 
              class="status-badge"
              :class="order.status === 'COMPLETED' ? 'badge-completed' : 'badge-pending'"
            >
              {{ order.status === 'COMPLETED' ? '조리 완료' : '조리 대기중' }}
            </span>
          </div>

          <!-- 주문 시간 및 고객 정보 -->
          <div class="card-info">
            <div class="info-row">
              <i class="fa-regular fa-clock text-slate-400"></i>
              <span>{{ formatTime(order.createdAt) }}</span>
            </div>
            <div class="info-row">
              <i class="fa-solid fa-phone text-slate-400"></i>
              <span>{{ order.phoneNumber || '비회원 (전화번호 없음)' }}</span>
            </div>
            <div class="info-row">
              <i class="fa-solid fa-credit-card text-slate-400"></i>
              <span>{{ order.paymentMethod || '토스페이먼츠 (카드)' }}</span>
            </div>
          </div>

          <!-- 세부 주문 사항 -->
          <div class="order-items-list">
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

              <!-- 아이스크림과 모찌가 아닐 때만 옵션 표시 -->
              <div
                v-if="!isIceCreamOrMochi(item) && formatOptions(item)"
                class="option-tag"
              >
                옵션: {{ formatOptions(item) }}
              </div>

              <div class="detail-item-bottom">
                <span>
                  수량: {{ item.quantity || 0 }}개
                </span>
                <span>
                  금액: {{ Number(item.totalPrice || item.price || 0).toLocaleString() }}원
                </span>
              </div>
            </div>
          </div>

          <!-- 카드 푸터 (총액 및 액션 버튼) -->
          <div class="card-footer">
            <div class="total-price-area">
              <span class="label">총 결제금액</span>
              <span class="amount">{{ formatPrice(order.totalAmount || order.totalPrice) }}원</span>
            </div>

            <div class="action-buttons">
              <button 
                v-if="order.status !== 'COMPLETED'"
                class="btn-action complete"
                @click="updateOrderStatus(order.id, 'COMPLETED')"
              >
                <i class="fa-solid fa-check"></i> 조리 완료
              </button>
              <button 
                v-else
                class="btn-action revert"
                @click="updateOrderStatus(order.id, 'PENDING')"
              >
                <i class="fa-solid fa-rotate-left"></i> 대기로 변경
              </button>
              
              <!-- 대기 상태(PENDING)일 때만 노출되는 주문취소 버튼 -->
              <button 
                v-if="order.status !== 'COMPLETED'"
                class="btn-action cancel"
                @click="cancelOrder(order.id)"
              >
                <i class="fa-solid fa-xmark"></i> 주문취소
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { db } from '@/api/firebase';
import { collection, query, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import axios from '../api/index.js';

const orders = ref([]);
const loading = ref(true);
const currentFilter = ref('ALL');
const searchQuery = ref('');
let unsubscribeOrders = null;

/*
 * Firebase 실시간 주문 리스너
 */
const initRealtimeOrderListener = () => {
  const ordersQuery = query(collection(db, "orders"));

  unsubscribeOrders = onSnapshot(
    ordersQuery,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const orderData = change.doc.data();
          const alreadyExists = orders.value.some((order) => order.id === change.doc.id);

          if (alreadyExists) return;

          orders.value.unshift({
            ...orderData,
            id: change.doc.id,
            expanded: false
          });
        }

        if (change.type === "modified") {
          const index = orders.value.findIndex((order) => order.id === change.doc.id);
          if (index !== -1) {
            orders.value[index] = {
              ...orders.value[index],
              ...change.doc.data(),
              id: change.doc.id
            };
          }
        }

        if (change.type === "removed") {
          orders.value = orders.value.filter((order) => order.id !== change.doc.id);
        }
      });
      loading.value = false;
    },
    (error) => {
      console.error("Firebase 실시간 주문 연결 실패:", error);
      loading.value = false;
    }
  );
};

onMounted(() => {
  initRealtimeOrderListener();
});

onUnmounted(() => {
  if (unsubscribeOrders) {
    unsubscribeOrders();
  }
});

// 상단 통계 카운트 계산
const pendingCount = computed(() => {
  return orders.value.filter(o => o.status !== 'COMPLETED').length;
});

const completedCount = computed(() => {
  return orders.value.filter(o => o.status === 'COMPLETED').length;
});

// 필터링 및 검색 적용된 주문 목록
const filteredOrders = computed(() => {
  return orders.value.filter(order => {
    if (currentFilter.value === 'PENDING' && order.status === 'COMPLETED') return false;
    if (currentFilter.value === 'COMPLETED' && order.status !== 'COMPLETED') return false;

    if (searchQuery.value.trim() !== '') {
      const q = searchQuery.value.toLowerCase();
      const idMatch = String(order.id).toLowerCase().includes(q);
      const phoneMatch = order.phoneNumber && order.phoneNumber.includes(q);
      const waitingMatch = (order.waitingNumber || order.waitingNo || order.orderNo) && String(order.waitingNumber || order.waitingNo || order.orderNo).includes(q);
      if (!idMatch && !phoneMatch && !waitingMatch) return false;
    }

    return true;
  });
});

// 주문 상태 변경 함수
const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status: newStatus });
  } catch (error) {
    console.error('주문 상태 변경 실패:', error);
    alert('상태 변경 중 오류가 발생했습니다.');
  }
};

// 주문 취소 함수
const cancelOrder = async (orderId) => {
  const confirmed = window.confirm(
    "정말 이 주문을 취소하시겠습니까? 데이터베이스에서 주문 정보가 삭제됩니다."
  );

  if (!confirmed) {
    return;
  }

  const targetOrder = orders.value.find(
    (order) => order.id === orderId || order.orderId === orderId
  );

  if (!targetOrder) {
    return;
  }

  try {
    const apiOrderId = targetOrder.orderId || targetOrder.id;
    await axios.delete(`/api/admin/orders/${apiOrderId}`);

    if (targetOrder.id) {
      await deleteDoc(doc(db, "orders", targetOrder.id));
    }

    orders.value = orders.value.filter(
      (order) => order.id !== targetOrder.id
    );

    window.alert("주문이 취소되었습니다.");
  } catch (error) {
    console.error("주문 취소 처리 실패:", error);
    window.alert("주문 취소 처리 중 오류가 발생했습니다.");
  }
};

/*
 * ==========================================
 * 통합 헬퍼 함수 모음 (대기번호, 상품명, 맛, 옵션, 아이스크림/모찌 판별)
 * ==========================================
 */

// 아이스크림 또는 모찌 판별 함수
const isIceCreamOrMochi = (item) => {
  if (!item) return false;

  const baseName = item.name || item.menuName || item.productName || item.title || '';
  const icecreamSizes = [
    "파인트", "쿼터", "패밀리", "하프갤런", 
    "싱글", "더블", "싱글콘", "더블콘", "싱글컵", "더블컵"
  ];

  const isIceCream = 
    icecreamSizes.some((size) => String(item.sizeName || "").includes(size)) ||
    baseName.includes(",") ||
    baseName.includes("아이스크림");

  const isMochi = baseName.includes("모찌");

  return isIceCream || isMochi;
};

// 1. 대기번호 포맷팅 함수
const formatWaitingNumber = (order) => {
  if (!order) {
    return '#001';
  }

  const rawNum = 
    order.waitingNumber || 
    order.waitingNo || 
    order.orderNumber || 
    order.orderNo || 
    order.ticketNumber || 
    order.no || 
    1;

  if (typeof rawNum === 'string' && rawNum.startsWith('#')) {
    return rawNum;
  }

  const numericNum = parseInt(rawNum, 10);
  if (isNaN(numericNum)) {
    return `#${rawNum}`;
  }

  return `#${String(numericNum).padStart(3, '0')}`;
};

// 2. 상품명 포맷팅 함수
const getItemDisplayName = (item) => {
  if (!item) {
    return '상품명 없음';
  }

  const baseName = 
    item.name || 
    item.menuName || 
    item.productName || 
    item.title || 
    '';

  return isIceCreamOrMochi(item) && baseName.includes(",") ? "아이스크림" : baseName || '상품명 없음';
};

// 3. 맛 정보 포맷팅 함수
const formatItemFlavors = (item) => {
  if (!item) {
    return '';
  }

  const rawFlavors = item.menus || item.flavors || [];
  let flavorList = [];

  if (Array.isArray(rawFlavors)) {
    flavorList = rawFlavors
      .map((menu) => {
        if (typeof menu === "object" && menu !== null) {
          return menu.name || menu.flavorName || menu.menuName || "";
        }
        return menu;
      })
      .filter(Boolean);
  } else if (typeof rawFlavors === "string") {
    flavorList = rawFlavors
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (
    flavorList.length === 0 &&
    item.menuName &&
    (item.sizeName || item.menuName.includes(","))
  ) {
    flavorList = String(item.menuName)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return flavorList.join(", ");
};

// 4. 옵션 정보 포맷팅 함수
const formatOptions = (itemOrOptions) => {
  const options = itemOrOptions?.options !== undefined ? itemOrOptions.options : itemOrOptions;
  if (!options) {
    return '';
  }

  if (Array.isArray(options)) {
    return options
      .map((opt) => {
        if (typeof opt === 'object' && opt !== null) {
          return opt.name || opt.value || opt.label || opt.optionName || '';
        }
        return opt;
      })
      .filter(Boolean)
      .join(', ');
  }

  if (typeof options === 'object') {
    return options.name || options.label || options.optionName || Object.values(options).filter(Boolean).join(', ');
  }

  return String(options);
};

// 시간 포맷 유틸리티
const formatTime = (timestamp) => {
  if (!timestamp) return '방금 전';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// 금액 포맷 유틸리티
const formatPrice = (amount) => {
  if (!amount) return '0';
  return Number(amount).toLocaleString();
};
</script>

<style scoped>
.orders-history-container {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 24px 30px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 6px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
}

.summary-badges {
  display: flex;
  gap: 12px;
}

.badge-card {
  padding: 10px 18px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
  border: 1px solid #e2e8f0;
  background: #fdfdfd;
}

.badge-card.total { border-left: 4px solid #6366f1; }
.badge-card.pending { border-left: 4px solid #f59e0b; }
.badge-card.completed { border-left: 4px solid #10b981; }

.badge-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.badge-value {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-top: 2px;
}

.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  background: #ffffff;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.filter-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn.active {
  background: #db2777;
  color: white;
}

.search-box {
  position: relative;
  min-width: 280px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 14px;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  background: white;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #db2777;
}

.orders-content {
  flex: 1;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 16px;
  color: #64748b;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.order-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
}

.order-card.status-pending {
  border-top: 4px solid #f59e0b;
}

.order-card.status-completed {
  border-top: 4px solid #10b981;
  opacity: 0.85;
}

.card-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  background: #fafafa;
}

.order-number-tag {
  font-weight: 700;
  font-size: 15px;
  background: #fee2e2;
  color: #991b1b;
  padding: 2px 8px;
  border-radius: 6px;
}

.order-id-text {
  font-size: 12px;
  color: #94a3b8;
  margin-left: 8px;
}

.status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}

.badge-pending {
  background: #fef3c7;
  color: #d97706;
}

.badge-completed {
  background: #d1fae5;
  color: #059669;
}

.card-info {
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #475569;
}

.order-items-list {
  padding: 14px 20px;
  flex: 1;
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-divider {
  height: 1px;
  background-color: #f1f5f9;
  margin: 4px 0;
}

.detail-title {
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  margin: 0 0 6px 0;
}

.detail-item-row {
  background: #f8fafc;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
}

.detail-item-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.detail-size-name {
  color: #db2777;
  font-weight: 700;
  margin-right: 4px;
}

.option-tag {
  font-size: 12px;
  color: #64748b;
  background: #ffffff;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
  border: 1px solid #e2e8f0;
}

.detail-item-bottom {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.card-footer {
  padding: 16px 20px;
  background: #fafafa;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-price-area {
  display: flex;
  flex-direction: column;
}

.total-price-area .label {
  font-size: 11px;
  color: #64748b;
}

.total-price-area .amount {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-action {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
}

.btn-action.complete {
  background: #10b981;
  color: white;
}

.btn-action.complete:hover {
  background: #059669;
}

.btn-action.revert {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.btn-action.revert:hover {
  background: #e2e8f0;
}

.btn-action.cancel {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-action.cancel:hover {
  background: #fee2e2;
}
</style>