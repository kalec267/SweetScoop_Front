<template>
  <div class="inventory-container">
    <!-- 1. 상단 타이틀 & 컨트롤 영역 -->
    <div class="top-header">
      <div class="title-left">
        <h2>지점별 실시간 재고 관리</h2>
        
        <!-- 지점 선택 드롭다운 -->
        <select 
          v-model="selectedBranchId" 
          @change="fetchInventoryData" 
          :disabled="userRole === 'BRANCH'" 
          class="branch-select"
        >
          <option v-for="b in branchList" :key="b.id" :value="b.id">
            {{ b.id }}번 지점 ({{ b.branchName }}) {{ userRole === 'BRANCH' && b.id === myBranchId ? ' - 내 매장' : '' }}
          </option>
        </select>
      </div>

      <!-- 추가: 본사 재고 신청 버튼 -->
      <button class="btn-order" @click="openOrderModal">＋ 본사 재고 신청 (발주)</button>
    </div>

    <!-- 2. 상단 요약 카드 2개 -->
    <div class="summary-cards">
      <div class="summary-card danger-card">
        <span class="card-label">재고 부족 경고 품목</span>
        <span class="card-value danger-text">{{ warningCount }}건</span>
      </div>

      <div class="summary-card success-card">
        <span class="card-label">정상 운영 품목</span>
        <span class="card-value success-text">{{ normalCount }}건</span>
      </div>
    </div>

    <!-- 3. 메인 재고 관리 테이블 -->
    <div class="table-card">
      <table class="inventory-table">
        <thead>
          <tr>
            <th style="width: 12%;">카테고리</th>
            <th style="width: 12%;">물품 ID</th>
            <th style="width: 38%;">물류 실물품명</th>
            <th style="width: 15%;">현재 재고량</th>
            <th style="width: 10%;">상태</th>
            <th style="width: 13%;">수동 재고 신청</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in inventoryList" :key="item.itemId">
            <!-- 카테고리 태그 -->
            <td>
              <span class="category-badge">
                {{ item.categoryName || '아이스크림' }}
              </span>
            </td>

            <!-- 물품 ID -->
            <td class="item-id">#{{ item.itemId }}</td>

            <!-- 물류 실물품명 -->
            <td class="item-name">{{ item.itemName }}</td>

            <!-- 현재 재고량 -->
            <td class="stock-amount">
              {{ item.stockLevel.toLocaleString() }} {{ item.unit === 2 ? 'ea' : 'g' }}
            </td>

            <!-- 상태 태그 -->
            <td>
              <span 
                class="status-pill" 
                :class="item.stockLevel < getThreshold(item) ? 'pill-danger' : 'pill-ok'"
              >
                {{ item.stockLevel < getThreshold(item) ? '부족' : '안정' }}
              </span>
            </td>

            <!-- 수동/대행 발주 신청 버튼 -->
            <td>
              <button class="btn-request-purple" @click="openRequestModal(item)">
                📦 {{ userRole === 'HQ' ? '대행 신청' : '수동 신청' }}
              </button>
            </td>
          </tr>

          <tr v-if="inventoryList.length === 0">
            <td colspan="6" class="empty-cell">조회된 재고 품목이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 4. 추가: 본사 신규 발주 모달 -->
    <div v-if="isOrderModalOpen" class="modal-overlay" @click.self="closeOrderModal">
      <div class="modal-content">
        <h3>본사 재고 신청</h3>
        <p class="modal-desc">필요한 벌크 원자재 물품과 신청 수량을 입력하세요.</p>

        <div class="form-group">
          <label>신청 물품 선택</label>
          <select v-model="orderForm.itemId">
            <option v-for="item in inventoryList" :key="item.itemId" :value="item.itemId">
              {{ item.itemName }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>신청 수량 (개/Box)</label>
          <input type="number" v-model="orderForm.quantity" min="1" placeholder="수량 입력"/>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="closeOrderModal">취소</button>
          <button class="btn-submit" @click="submitOrder">신청 완료</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/api/index.js';

export default {
  name: 'BranchInventoryView',
  data() {
    return {
      userRole: localStorage.getItem('userRole') || 'BRANCH',
      myBranchId: Number(localStorage.getItem('branchId')) || 1,
      selectedBranchId: null,
      branchList: [],
      inventoryList: [],
      
      // 모달 조작 상태 데이터 추가
      isOrderModalOpen: false,
      orderForm: {
        itemId: null,
        quantity: 1
      }
    };
  },
  computed: {
    warningCount() {
      return this.inventoryList.filter(item => item.stockLevel < this.getThreshold(item)).length;
    },
    normalCount() {
      return this.inventoryList.filter(item => item.stockLevel >= this.getThreshold(item)).length;
    },
    currentBranchName() {
      const branch = this.branchList.find(b => b.id === this.selectedBranchId);
      return branch ? branch.branchName : '지점';
    }
  },
  async mounted() {
    await this.fetchBranchList();
    
    if (this.userRole === 'BRANCH') {
      this.selectedBranchId = this.myBranchId;
    } else if (this.branchList.length > 0) {
      this.selectedBranchId = this.branchList[0].id;
    }

    this.fetchInventoryData();
  },
  methods: {
    async fetchBranchList() {
      try {
        const response = await api.get('/api/inventory/branches');
        if (Array.isArray(response.data)) {
          this.branchList = response.data;
        }
      } catch (error) {
        console.error("지점 목록 로드 실패:", error);
      }
    },

    async fetchInventoryData() {
      if (!this.selectedBranchId) return;
      try {
        const response = await api.get(`/api/inventory/branch/${this.selectedBranchId}`);
        if (Array.isArray(response.data)) {
          this.inventoryList = response.data;
        }
      } catch (error) {
        console.error("지점 재고 로드 실패:", error);
      }
    },

    getThreshold(item) {
      return item.unit === 2 ? 50 : 5000;
    },

    async openRequestModal(item) {
      const isMochi = item.unit === 2;
      const unitText = isMochi ? '개' : 'g';
      const defaultAmount = isMochi ? '500' : '5000';

      const reqAmount = prompt(
        `[${this.currentBranchName} - ${item.itemName}] ${this.userRole === 'HQ' ? '대행 발주' : '수동 발주'}\n\n신청할 수량(${unitText})을 입력하세요:`, 
        defaultAmount
      );
      
      if (!reqAmount || isNaN(reqAmount) || Number(reqAmount) <= 0) return;

      try {
        const response = await api.post('/api/inventory/request/manual', null, {
          params: {
            branchId: this.selectedBranchId,
            itemId: item.itemId,
            amount: Number(reqAmount)
          }
        });
        
        if (response.status === 200) {
          alert(`🎉 [${this.currentBranchName}] 본사 발주 대기열에 수동 신청이 정상 등록되었습니다!`);
        }
      } catch (error) {
        alert("발주 신청 처리 중 오류가 발생했습니다.");
      }
    },

    // --- 추가: 본사 재고 신청 모달 관련 함수 ---
    openOrderModal() {
      this.orderForm = {
        itemId: this.inventoryList[0]?.itemId || null,
        quantity: 1
      };
      this.isOrderModalOpen = true;
    },

    closeOrderModal() {
      this.isOrderModalOpen = false;
    },

    async submitOrder() {
      if (!this.orderForm.itemId) {
        alert("신청할 물품을 선택해주세요.");
        return;
      }
      if (!this.orderForm.quantity || this.orderForm.quantity < 1) {
        alert("올바른 수량을 입력해주세요.");
        return;
      }

      try {
        const payload = {
          branchId: this.selectedBranchId,
          itemId: this.orderForm.itemId,
          quantity: Number(this.orderForm.quantity)
        };

        await api.post('/api/admin/branches/orders', payload);
        alert("본사로 재고 신청이 전달되었습니다.");
        this.closeOrderModal();
        this.fetchInventoryData(); // 재고 현황 갱신
      } catch (error) {
        console.error("본사 발주 신청 실패:", error);
        alert("본사 발주 신청 처리 중 에러가 발생했습니다.");
      }
    }
  }
};
</script>

<style scoped>
.inventory-container {
  padding: 30px;
  background-color: #f8fafc;
  min-height: 100vh;
  box-sizing: border-box;
}

/* 상단 타이틀 & 컨트롤 */
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.title-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.title-left h2 {
  font-size: 22px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}
.branch-select {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  background: white;
}

/* 추가: 본사 재고 신청 버튼 스타일 */
.btn-order {
  background: #d13b7d;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-order:hover {
  background: #b82e6b;
}

/* 상단 요약 카드 */
.summary-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}
.summary-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
}
.card-label {
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
}
.card-value {
  font-size: 26px;
  font-weight: 900;
}
.danger-text { color: #ef4444; }
.success-text { color: #10b981; }

/* 메인 테이블 카드 */
.table-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.inventory-table {
  width: 100%;
  border-collapse: collapse;
}
.inventory-table th {
  background: #ffffff;
  padding: 16px;
  text-align: left;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
}
.inventory-table td {
  padding: 16px;
  text-align: left;
  font-size: 14px;
  border-bottom: 1px solid #f1f5f9;
}

/* 카테고리 태그 */
.category-badge {
  background: #e0f2fe;
  color: #0284c7;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
}

.item-id {
  color: #94a3b8;
  font-weight: 600;
}
.item-name {
  font-weight: 700;
  color: #1e293b;
}
.stock-amount {
  font-weight: 800;
  color: #0f172a;
}

/* 상태 알약 */
.status-pill {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  color: white;
}
.pill-ok { background: #059669; }
.pill-danger { background: #dc2626; }

/* 버튼 스타일 */
.btn-request-purple {
  background: #6366f1;
  color: white;
  border: none;
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-request-purple:hover {
  background: #4f46e5;
}

.empty-cell {
  text-align: center;
  color: #94a3b8;
  padding: 50px;
}

/* --- 추가: 신규 발주 모달 CSS --- */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 400px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}
.modal-content h3 {
  margin-top: 0;
  font-size: 18px;
  color: #0f172a;
  font-weight: 700;
}
.modal-desc {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
  margin-bottom: 18px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}
.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}
.form-group input, .form-group select {
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
.btn-cancel {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.btn-submit {
  background: #d13b7d;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
</style>