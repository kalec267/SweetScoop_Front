<template>
  <div class="branch-dashboard">
    <!-- 헤더 영역 -->
    <div class="dashboard-header">
      <div>
        <h2>분점 관리 파트너 (스윗스쿱 강남역점)</h2>
        <p class="subtitle">실시간 지점 원자재 재고 관리 및 본사 신청 현황</p>
      </div>
      <button class="btn-order" @click="openOrderModal">＋ 본사 재고 신청 (발주)</button>
    </div>

    <!-- 메인 레이아웃 그리드 (좌: 지점 보유 재고 / 우: 실시간 주문 & 본사 신청 목록) -->
    <div class="dashboard-grid">
      
      <!-- [왼쪽] 실시간 원자재 보유 현황 -->
      <div class="grid-section">
        <div class="section-title-box">
          <h3>🍦 매장 원자재 재고 보유량</h3>
          <span class="badge-tag">실시간</span>
        </div>
        
        <div class="inventory-cards">
          <div v-for="item in branchInventory" :key="item.itemId" class="inv-card">
            <div class="inv-info">
              <span class="inv-name">{{ item.itemName }}</span>
              <span class="inv-weight">{{ item.stockLevel.toLocaleString() }}g 남음</span>
            </div>
            <!-- 재고량에 따른 프로그레스 바 컬러 차등화 -->
            <div class="progress-bar-bg">
              <div 
                class="progress-bar-fill" 
                :style="{ width: getPercentage(item.stockLevel) + '%' }"
                :class="getProgressBarClass(item.stockLevel)"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- [오른쪽 상단] 실시간 키오스크 주문 접수 현황 (Firebase 연동) -->
      <div class="grid-section" style="margin-bottom: 30px;">
        <div class="section-title-box">
          <h3>🔔 실시간 키오스크 주문 접수</h3>
          <span class="badge-tag" style="background: #ecfdf5; color: #059669;">LIVE</span>
        </div>

        <div class="order-list">
          <div v-if="realtimeOrders.length === 0" style="text-align: center; color: #94a3b8; padding: 20px 0; font-size: 13px;">
            들어온 실시간 주문이 없습니다. 대기 중...
          </div>
          <div v-for="order in realtimeOrders" :key="order.orderId" class="order-item live-order-card">
            <div class="order-meta">
              <span class="order-id">주문번호: #{{ order.orderNo }} (웨이팅: <strong>{{ order.waitingNo }}</strong>번)</span>
              <span class="order-status status-waiting">{{ order.status }}</span>
            </div>
            <div class="order-body" style="flex-direction: column; align-items: flex-start; gap: 4px;">
              <!-- 메뉴 및 옵션 정보 렌더링 -->
              <div style="font-weight: 600; color: #1e293b; font-size: 14px;">
                <span v-for="(item, idx) in order.items" :key="idx">
                  {{ item.menuName }} ({{ item.quantity }}개) <span v-if="idx < order.items.length - 1">, </span>
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; width: 100%; font-size: 13px; color: #64748b; margin-top: 4px;">
                <span>결제수단: {{ order.paymentMethod || '카드결제' }}</span>
                <span style="font-weight: 700; color: #d13b7d;">{{ Number(order.totalPrice).toLocaleString() }}원</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- [오른쪽 하단] 최근 본사 재고 신청 내역 -->
      <div class="grid-section">
        <div class="section-title-box">
          <h3>📄 본사 신청 및 배송 현황</h3>
        </div>

        <div class="order-list">
          <div v-for="order in myRequests" :key="order.id" class="order-item">
            <div class="order-meta">
              <span class="order-id">#REQ-{{ order.id }}</span>
              <span class="order-date">{{ order.requestDate }}</span>
            </div>
            <div class="order-body">
              <span class="order-menu">{{ order.menuName }} ({{ order.quantity }}개)</span>
              <span class="order-status" :class="getStatusClass(order.status)">
                {{ order.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- 💡 신규 발주(재고 신청) 모달 창 -->
    <div v-if="isOrderModalOpen" class="modal-overlay">
      <div class="modal-content">
        <h3>본사 재고 신청</h3>
        <p class="modal-desc">필요한 벌크 원자재 물품과 신청 수량을 입력하세요.</p>

        <div class="form-group">
          <label>신청 물품 선택</label>
          <select v-model="orderForm.itemId">
            <option v-for="item in branchInventory" :key="item.itemId" :value="item.itemId">
              {{ item.itemName }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>신청 수량 (개/Box)</label>
          <input type="number" v-model="orderForm.quantity" min="1" placeholder="수량 입력" />
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="closeOrderModal">취소</button>
          <button class="btn-submit" @click="submitOrder">신청 완료</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from '../api/index.js'; // 공통 Axios 인스턴스

// 💡 방금 수정한 firebase.js에서 db 객체 불러오기 (경로가 올바른지 확인!)
import { db } from '@/api/firebase'; 
import { collection, query, onSnapshot } from "firebase/firestore";

// 로그인한 사용자 세션 정보 가져오기 (세션 연동 전까지 기본값 1 적용)
const branchId = ref(Number(localStorage.getItem('branchId')) || 1); 

// 실시간 원자재 데이터 상태값
const branchInventory = ref([]);

// 본사 신청 목록 데이터 상태값
const myRequests = ref([]);

// 💡 실시간 고객 주문 리스트 상태값
const realtimeOrders = ref([]);

const isOrderModalOpen = ref(false);
const orderForm = ref({ itemId: 1, quantity: 1 });

// 1. 백엔드로부터 해당 지점의 실시간 재고 목록 가져오기
const fetchBranchInventory = async () => {
try {
  const res = await axios.get(`/api/admin/branches/${branchId.value}/inventory`);
  
  branchInventory.value = res.data.map(inv => ({
    itemId: inv.item.id,
    itemName: inv.item.itemName,
    stockLevel: inv.stockLevel
  }));
} catch (error) {
  console.warn("실제 DB 재고 테이블 조회 실패 또는 데이터가 없습니다. 모의 데이터를 표시합니다.");
  branchInventory.value = [
    { itemId: 1, itemName: '엄마는 외계인 튜브(1000g)', stockLevel: 8500 },
    { itemId: 2, itemName: '아몬드 봉봉 튜브(1000g)', stockLevel: 2100 },
    { itemId: 3, itemName: '민트 초콜릿 칩 튜브(1000g)', stockLevel: 6000 },
    { itemId: 4, itemName: '그린티 튜브(1000g)', stockLevel: 4500 }
  ];
}
};

// 2. 본사 신청(발주) 내역 백엔드에서 조회해오기
const fetchMyRequests = async () => {
try {
  const res = await axios.get(`/api/admin/branches/${branchId.value}/orders`);
  
  myRequests.value = res.data.map(order => {
    const rawDate = order.requestDate || order.regDate || order.createdDate || '';
    const formattedDate = rawDate ? rawDate.substring(0, 10).replace(/-/g, '.') : '';

    return {
      id: order.id,
      menuName: order.item ? order.item.itemName : (order.itemName || '신청 물품'),
      quantity: order.requestQuantity || order.quantity || 0,
      requestDate: formattedDate,
      status: order.status || order.orderStatus || '대기 중'
    };
  });
} catch (error) {
  console.warn("발주 신청 내역을 불러오는데 실패했습니다. 기본 샘플 데이터를 노출합니다.");
  myRequests.value = [
    { id: 104, menuName: '아몬드 봉봉 튜브', quantity: 5, requestDate: '2026.07.16', status: '대기 중' },
    { id: 102, menuName: '엄마는 외계인 튜브', quantity: 10, requestDate: '2026.07.14', status: '배송 중' },
    { id: 101, menuName: '그린티 튜브', quantity: 3, requestDate: '2026.07.12', status: '완료' }
  ];
}
};

// 💡 3. Firestore 실시간 주문 감지 리스너 설정
const initRealtimeOrderListener = () => {
  // 최상위 'orders' 컬렉션을 직접 바라보도록 수정합니다.
  const ordersQuery = query(collection(db, "orders"));

  onSnapshot(ordersQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const newOrder = change.doc.data();
        console.log("🔥 [실시간 Firestore 주문 수신 성공]:", newOrder);
        
        realtimeOrders.value.unshift(newOrder);
      }
    });
  });
};

// 4. 본사로 발주(재고 신청) 등록 처리 (POST)
const submitOrder = async () => {
try {
  const payload = {
    branchId: branchId.value,
    itemId: orderForm.value.itemId,
    quantity: orderForm.value.quantity
  };

  await axios.post('/api/admin/branches/orders', payload);
  
  alert("본사로 재고 신청이 안전하게 전달되었습니다.");
  closeOrderModal();
  
  const selectedItem = branchInventory.value.find(item => item.itemId === orderForm.value.itemId);
  const itemName = selectedItem ? selectedItem.itemName : '신청 물품';

  const today = new Date();
  const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

  const newRequest = {
    id: myRequests.value.length > 0 ? Math.max(...myRequests.value.map(o => o.id)) + 1 : 1,
    menuName: itemName,
    quantity: orderForm.value.quantity,
    requestDate: formattedDate,
    status: '대기 중'
  };
  
  myRequests.value.unshift(newRequest);
  fetchBranchInventory(); 
  fetchMyRequests();      
} catch (error) {
  alert("본사 발주 신청 처리 중 에러가 발생했습니다.");
}
};

const getPercentage = (level) => Math.min(100, (level / 10000) * 100);

const getProgressBarClass = (level) => {
if (level < 3000) return 'bar-danger';
if (level < 6000) return 'bar-warning';
return 'bar-success';
};

const getStatusClass = (status) => {
switch (status) {
  case '대기 중': return 'status-waiting';
  case '배송 중': return 'status-shipping';
  case '완료': return 'status-done';
  default: return '';
}
};

const openOrderModal = () => {
orderForm.value = { itemId: branchInventory.value[0]?.itemId || 1, quantity: 1 };
isOrderModalOpen.value = true;
};
const closeOrderModal = () => isOrderModalOpen.value = false;

onMounted(() => {
fetchBranchInventory();
fetchMyRequests(); 
initRealtimeOrderListener(); // 💡 컴포넌트 마운트 시 파이어베이스 실시간 리스너 작동 시작!
});
</script>

<style scoped>
.branch-dashboard {
  padding: 30px;
  background-color: #f8fafc;
  min-height: 100vh;
  box-sizing: border-box;
}
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}
.dashboard-header h2 {
  font-size: 22px;
  color: #1e293b;
  font-weight: 700;
}
.subtitle {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}
.btn-order {
  background: #d13b7d;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}
.grid-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}
.section-title-box {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}
.section-title-box h3 {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}
.badge-tag {
  background: #fdf2f8;
  color: #d13b7d;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.inventory-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.inv-card {
  border: 1px solid #f1f5f9;
  padding: 14px;
  border-radius: 8px;
}
.inv-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 8px;
}
.inv-name { font-weight: 600; color: #334155; }
.inv-weight { font-weight: 700; color: #475569; }

.progress-bar-bg {
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}
.bar-success { background: #10b981; }
.bar-warning { background: #f59e0b; }
.bar-danger { background: #ef4444; }

/* 우측 발주 리스트 및 실시간 주문 리스트 */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 380px;
  overflow-y: auto;
}
.order-item {
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 12px;
}
.order-item:last-child { border-bottom: none; }

.live-order-card {
  background: #fffbfd;
  border: 1px solid #fce7f3;
  padding: 12px;
  border-radius: 8px;
}

.order-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 4px;
}
.order-id { font-weight: 600; color: #475569; }
.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.order-menu { font-size: 14px; font-weight: 600; color: #334155; }
.order-status { font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 4px; }

.status-waiting { background: #fffbeb; color: #d97706; }
.status-shipping { background: #eff6ff; color: #2563eb; }
.status-done { background: #ecfdf5; color: #059669; }

/* 모달 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-content { background: white; padding: 24px; border-radius: 12px; width: 400px; }
.modal-desc { font-size: 13px; color: #94a3b8; margin-top: 4px; margin-bottom: 18px; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.form-group label { font-size: 13px; font-weight: 600; color: #475569; }
.form-group input, .form-group select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.btn-cancel { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 10px 16px; border-radius: 8px; cursor: pointer; }
.btn-submit { background: #d13b7d; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
</style>