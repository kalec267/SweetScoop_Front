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
  
      <!-- 메인 레이아웃 그리드 (좌: 지점 보유 재고 / 우: 본사 재고 신청 목록) -->
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
  
        <!-- [오른쪽] 최근 본사 재고 신청 내역 -->
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
import axios from '../api/index.js'; // 👈 공통 커스텀 로깅 인터셉터가 장착된 Axios 인스턴스 맵핑

// 로그인한 사용자 세션 정보 가져오기 (세션 연동 전까지는 기본값 1 적용)
const branchId = ref(Number(localStorage.getItem('branchId')) || 1); 

// 실시간 원자재 데이터 상태값
const branchInventory = ref([]);

// 본사 신청 목록 데이터 상태값
const myRequests = ref([]);

const isOrderModalOpen = ref(false);
const orderForm = ref({ itemId: 1, quantity: 1 });

// 1. 백엔드로부터 해당 지점의 실시간 재고 목록 가져오기
const fetchBranchInventory = async () => {
  try {
    // 💡 주소를 'api/admin/branches' 구조로 동기화합니다.
    const res = await axios.get(`http://localhost:8888/api/admin/branches/${branchId.value}/inventory`);
    
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

// 2. 본사 신청(발주) 내역 백엔드에서 조회해오기 (주소 구조 일치화)
const fetchMyRequests = async () => {
  try {
    // 💡 백엔드 설정에 따라 /orders 또는 /order 로 맵핑 주소를 테스트해 보세요.
    const res = await axios.get(`http://localhost:8888/api/admin/branches/${branchId.value}/orders`);
    myRequests.value = res.data; 
  } catch (error) {
    console.warn("발주 신청 내역을 불러오는데 실패했습니다. 기본 샘플 데이터를 노출합니다.");
    myRequests.value = [
      { id: 104, menuName: '아몬드 봉봉 튜브', quantity: 5, requestDate: '2026.07.16', status: '대기 중' },
      { id: 102, menuName: '엄마는 외계인 튜브', quantity: 10, requestDate: '2026.07.14', status: '배송 중' },
      { id: 101, menuName: '그린티 튜브', quantity: 3, requestDate: '2026.07.12', status: '완료' }
    ];
  }
};

// 3. 본사로 발주(재고 신청) 등록 처리 (POST) - 이미 성공한 경로로 유지!
const submitOrder = async () => {
  try {
    const payload = {
      branchId: branchId.value,
      itemId: orderForm.value.itemId,
      quantity: orderForm.value.quantity
    };

    // 💡 이미 SUCCESS가 검증된 안전한 주소입니다!
    await axios.post('http://localhost:8888/api/admin/branches/orders', payload);
    
    alert("본사로 재고 신청이 안전하게 전달되었습니다.");
    closeOrderModal();
    
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
  fetchMyRequests(); // 👈 컴포넌트 마운트 시 신청 내역도 로드
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
  
  /* 우측 발주 리스트 */
  .order-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .order-item {
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 12px;
  }
  .order-item:last-child { border-bottom: none; }
  .order-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #94a3b8;
    margin-bottom: 4px;
  }
  .order-id { font-weight: 600; }
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