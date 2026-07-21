<template>
  <div class="hq-container">
    <div class="hq-header">
      <h2>🏢 본사 통합 물류 대시보드</h2>
      
      <!-- 상단 탭 메뉴 전환 스위치 -->
      <div class="tab-menu">
        <button :class="['tab-btn', { active: currentTab === 'orders' }]" @click="currentTab = 'orders'">
          📦 지점 발주 승인 관리
        </button>
        <button :class="['tab-btn', { active: currentTab === 'stock' }]" @click="switchTabToStock">
          🏪 본사 창고 재고 현황
        </button>
      </div>
    </div>

    <!-- ------------------------------------------------------------- -->
    <!-- 탭 1: 지점 발주 승인 관리 -->
    <!-- ------------------------------------------------------------- -->
    <div class="table-section" v-if="currentTab === 'orders'">
      <div class="section-title-bar">
        <h3>지점별 발주 신청 목록</h3>
        <button class="btn-refresh" @click="fetchHqOrders">🔄 새로고침</button>
      </div>
      <table class="hq-table">
        <thead>
          <tr>
            <th>발주 번호</th>
            <th>요청 지점</th>
            <th>요청 물품</th>
            <th class="text-right">신청 수량</th>
            <th>승인 상태</th>
            <th>배송 상태</th>
            <th class="text-center">발주 처리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in paginatedOrders" :key="order.hqInventoryId" :class="{ 'row-completed': order.approvalStatus === 'COMPLETED' }">
            <td class="order-id">#{{ order.hqInventoryId }}</td>
            <td class="branch-name">{{ order.branchName }}</td>
            <td class="item-name">{{ order.itemName }} <span class="item-id">(#{{ order.itemId }})</span></td>
            <td class="quantity text-right">{{ formatNumber(order.requestQuantity) }} g/ea</td>
            <td>
              <span :class="['badge', order.approvalStatus === 'COMPLETED' ? 'bg-success' : 'bg-warning']">
                {{ order.approvalStatus === 'COMPLETED' ? '승인 완료' : '결제 대기' }}
              </span>
            </td>
            <td>
              <span :class="['badge', order.deliveryStatus === 'ARRIVED' ? 'bg-delivery-done' : 'bg-delivery-ready']">
                {{ order.deliveryStatus === 'ARRIVED' ? '배송 완료' : '출고 준비중' }}
              </span>
            </td>
            <td class="text-center">
              <button v-if="order.approvalStatus !== 'COMPLETED'" class="btn-approve" @click="approveOrder(order.hqInventoryId)">
                ✔ 발주 승인
              </button>
              <span v-else class="text-done">처리 완료</span>
            </td>
          </tr>
          <tr v-if="orderList.length === 0">
            <td colspan="7" class="table-empty">현재 접수된 지점 발주 신청이 없습니다.</td>
          </tr>
        </tbody>
      </table>

      <!-- 페이징 버튼 -->
      <div class="pagination-container" v-if="totalPages > 1">
        <button class="btn-page" :disabled="currentPage === 1" @click="currentPage--">◀ 이전</button>
        <button v-for="page in totalPages" :key="page" :class="['btn-page-num', { 'active-page': currentPage === page }]" @click="currentPage = page">
          {{ page }}
        </button>
        <button class="btn-page" :disabled="currentPage === totalPages" @click="currentPage++">다음 ▶</button>
      </div>
    </div>

    <!-- ------------------------------------------------------------- -->
    <!-- 탭 2: 본사 창고 실시간 재고 현황 & 원자재 수급 기능 -->
    <!-- ------------------------------------------------------------- -->
    <div class="table-section" v-if="currentTab === 'stock'">
      <div class="section-title-bar">
        <h3>본사 중앙 물류창고 잔여 재고</h3>
        <button class="btn-refresh" @click="fetchHqStock">🔄 새로고침</button>
      </div>
      <table class="hq-table">
        <thead>
          <tr>
            <th>물품 ID</th>
            <th>물품 정보</th>
            <th class="text-right">본사 보유 중량/수량</th>
            <th>창고 상태</th>
            <th class="text-center">공장 발주/수급</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stock in hqStockList" :key="stock.id">
            <td class="order-id">#{{ stock.itemId }}</td>
            <td class="item-name">
              {{ getItemName(stock.itemId) }}
            </td>
            <td class="quantity text-right text-bold">
              {{ formatNumber(stock.stockLevel) }} {{ getUnitType(stock.itemId) }}
            </td>
            <td>
              <span v-if="stock.stockLevel < 50000" class="badge bg-danger">🚨 본사 재고 부족 (비상)</span>
              <span v-else class="badge bg-success">보유고 넉넉</span>
            </td>
            <td class="text-center">
              <button class="btn-factory-charge" @click="chargeStockFromFactory(stock.itemId)">
                🏭 공장 수급신청
              </button>
            </td>
          </tr>
          <tr v-if="hqStockList.length === 0">
            <td colspan="5" class="table-empty">본사 창고에 등록된 원자재가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import api from '@/api';

export default {
  name: 'HqOrderManagement',
  data() {
    return {
      currentTab: 'orders', 
      orderList: [],
      hqStockList: [],      
      itemList: [],         // DB에서 읽어온 전체 자재 목록
      itemMap: {},          // ID별 Item 객체 매핑용
      currentPage: 1,
      itemsPerPage: 10
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.orderList.length / this.itemsPerPage);
    },
    paginatedOrders() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.orderList.slice(start, end);
    }
  },
  mounted() {
    this.fetchItems();
    this.fetchHqOrders();
  },
  methods: {
    async fetchItems() {
      try {
        const response = await api.get('/api/inventory/items');
        
        if (Array.isArray(response.data)) {
          this.itemList = response.data;
          const map = {};
          this.itemList.forEach(item => {
            map[item.id] = item;
          });
          this.itemMap = map;
        } else {
          console.warn("원자재 목록이 배열 형태가 아닙니다:", response.data);
          this.itemList = [];
        }
      } catch (error) {
        console.error("원자재 목록 로드 실패:", error);
      }
    },

    switchTabToStock() {
      this.currentTab = 'stock';
      this.fetchHqStock();
    },

    async fetchHqOrders() {
      try {
        const response = await api.get('/api/inventory/hq/orders');
        
        if (Array.isArray(response.data)) {
          this.orderList = response.data.sort((a, b) => {
            if (a.approvalStatus === 'PENDING' && b.approvalStatus !== 'PENDING') return -1;
            if (a.approvalStatus !== 'PENDING' && b.approvalStatus === 'PENDING') return 1;
            return b.hqInventoryId - a.hqInventoryId;
          });
        } else {
          console.warn("발주 목록 데이터가 배열이 아닙니다:", response.data);
          this.orderList = [];
        }
        this.currentPage = 1;
      } catch (error) {
        console.error("발주 목록 로드 실패:", error);
      }
    },

    async fetchHqStock() {
      try {
        const response = await api.get('/api/inventory/hq/stock');
        this.hqStockList = response.data;
      } catch (error) {
        console.error("본사 실시간 재고 연동 실패:", error);
      }
    },

    async approveOrder(hqInventoryId) {
      if (!confirm("해당 발주 건을 승인하시겠습니까?\n승인 시 본사 창고 재고 차감 및 지점 재고 가산이 실시간 처리됩니다.")) return;

      try {
        // 🌟 URLSearchParams 대신 params 옵션으로 전달
        const response = await api.post('/api/inventory/in/hq', null, {
          params: { hqInventoryId }
        });

        if (response.status === 200) {
          alert("승인 처리가 완료되었습니다!");
          this.fetchHqOrders(); 
        }
      } catch (error) {
        // 백엔드 예외 메시지 출력
        const errorMsg = error.response?.data || "발주 승인 처리 중 에러가 발생했습니다.";
        alert(`❌ 승인 실패: ${errorMsg}`);
      }
    },

    async chargeStockFromFactory(itemId) {
      const item = this.itemMap[itemId];
      const isMochi = item && item.categoryId === 2;
      const chargeAmount = isMochi ? 1000 : 200000;
      const itemName = this.getItemName(itemId);
      const unitText = isMochi ? 'ea' : 'g';

      if (!confirm(`🏭 [공장 원재료 매입 요청]\n공장 제조 라인에 [ ${itemName} ${this.formatNumber(chargeAmount)}${unitText} ] 공급을 요청하시겠습니까?`)) {
        return;
      }

      try {
        // 🌟 URLSearchParams 대신 Axios params 옵션으로 전달
        const response = await api.post('/api/inventory/hq/stock/charge', null, {
          params: {
            itemId: itemId,
            amount: chargeAmount
          }
        });

        if (response.status === 200) {
          alert("🎉 " + response.data);
          this.fetchHqStock(); // 충전 후 재고 목록 실시간 갱신
        }
      } catch (error) {
        const errorMsg = error.response?.data || "공장 수급 요청 처리 중 에러가 발생했습니다.";
        alert(`❌ 충전 실패: ${errorMsg}`);
        console.error(error);
      }
    },

    getItemName(itemId) {
      const item = this.itemMap[itemId];
      return item ? item.itemName : `원자재 (ID: #${itemId})`;
    },

    getUnitType(itemId) {
      const item = this.itemMap[itemId];
      return (item && item.categoryId === 2) ? 'ea' : 'g';
    },

    formatNumber(val) {
      return String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  }
};
</script>

<style scoped>
.hq-container { padding: 24px; background-color: #f8fafc; font-family: 'Inter', sans-serif; min-height: 80vh; }
.hq-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
.section-title-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

.tab-menu { display: flex; gap: 8px; }
.tab-btn { padding: 10px 20px; border: 1px solid #cbd5e1; background: #fff; font-weight: 600; border-radius: 8px 8px 0 0; cursor: pointer; color: #64748b; transition: all 0.2s; }
.tab-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; }

.btn-refresh { padding: 6px 12px; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; font-size: 13px; }
.btn-refresh:hover { background: #f1f5f9; }

.table-section { background: #fff; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; border-top: none; }
.hq-table { width: 100%; border-collapse: collapse; }
.hq-table th { color: #64748b; border-bottom: 2px solid #e2e8f0; font-size: 14px; font-weight: 600; padding: 12px 16px; text-align: left; }
.hq-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px; color: #334155; }

.text-right { text-align: right !important; }
.text-center { text-align: center !important; }
.text-bold { font-weight: 700; color: #1e293b; }

.order-id { font-family: monospace; color: #94a3b8; }
.branch-name { font-weight: 700; color: #1e293b; }
.item-name { font-weight: 600; }
.item-id { color: #94a3b8; font-size: 13px; font-weight: 400; }
.quantity { font-weight: 700; color: #475569; }

.badge { padding: 4px 8px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.bg-warning { background-color: #fef3c7; color: #92400e; }
.bg-success { background-color: #d1fae5; color: #065f46; }
.bg-danger { background-color: #fee2e2; color: #991b1b; }
.bg-delivery-done { background-color: #e2e8f0; color: #475569; }
.bg-delivery-ready { background-color: #e0f2fe; color: #0369a1; }

.row-completed { background-color: #fafafa; opacity: 0.75; }
.btn-approve { background-color: #10b981; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; }
.btn-approve:hover { background-color: #059669; }
.text-done { color: #94a3b8; font-size: 13px; }
.table-empty { text-align: center !important; color: #94a3b8; padding: 40px 0; }

.btn-factory-charge { background-color: #3b82f6; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; }
.btn-factory-charge:hover { background-color: #2563eb; }

.pagination-container { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 24px; }
.btn-page { padding: 6px 12px; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; font-size: 13px; }
.btn-page:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
.btn-page-num { padding: 6px 12px; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; font-size: 13px; }
.active-page { background-color: #6366f1; color: white; border-color: #6366f1; font-weight: 600; }
</style>