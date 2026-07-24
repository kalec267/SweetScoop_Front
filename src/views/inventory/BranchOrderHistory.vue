<template>
    <div class="order-history-container">
      <div class="header-section">
        <h2>📄 발주 신청 및 배송 현황</h2>
        <p class="subtitle">자동 및 수동으로 신청된 본사 발주 내역과 승인/배송 상태를 조회합니다.</p>
      </div>
  
      <!-- 필터 영역 -->
      <div class="filter-card">
        <label class="filter-label">조회 지점:</label>
        <select 
          v-model="selectedBranchId" 
          @change="fetchMyOrders" 
          :disabled="userRole === 'BRANCH'" 
          class="branch-select"
        >
          <option v-for="b in branchList" :key="b.id" :value="b.id">
            {{ b.branchName }}
          </option>
        </select>
      
      </div>
  
      <!-- 발주 내역 테이블 -->
      <div class="order-table-card">
        <table class="order-table">
          <thead>
            <tr>
              <th>신청 번호</th>
              <th>지점명</th>
              <th>원자재 품명</th>
              <th>신청 수량</th>
              <th>승인 상태</th>
              <th>배송 상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in myOrderList" :key="order.hqInventoryId">
              <td>#REQ-{{ order.hqInventoryId }}</td>
              <td>{{ order.branchName }}</td>
              <td class="font-bold">{{ order.itemName }}</td>
              <td>{{ order.requestQuantity.toLocaleString() }}</td>
              <td>
                <span :class="order.approvalStatus === 'COMPLETED' ? 'badge-success' : 'badge-warning'">
                  {{ order.approvalStatus === 'COMPLETED' ? '승인 완료' : '승인 대기' }}
                </span>
              </td>
              <td>
                <span :class="order.deliveryStatus === 'ARRIVED' ? 'badge-blue' : 'badge-gray'">
                  {{ order.deliveryStatus === 'ARRIVED' ? '배송 완료' : (order.deliveryStatus === 'SHIPPING' ? '배송 중' : '배송 준비 중') }}
                </span>
              </td>
            </tr>
            <tr v-if="myOrderList.length === 0">
              <td colspan="6" class="empty-cell">신청된 발주 내역이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script>
  import api from '@/api/index.js';
  
  export default {
    name: 'BranchOrderHistory',
    data() {
      return {
        userRole: localStorage.getItem('userRole') || 'BRANCH',
        myBranchId: Number(localStorage.getItem('branchId')) || 1,
        selectedBranchId: null,
        branchList: [],
        myOrderList: []
      };
    },
    async mounted() {
      await this.fetchBranchList();
      
      if (this.userRole === 'BRANCH') {
        this.selectedBranchId = this.myBranchId;
      } else if (this.branchList.length > 0) {
        this.selectedBranchId = this.branchList[0].id;
      }
  
      this.fetchMyOrders();
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
  
      async fetchMyOrders() {
        if (!this.selectedBranchId) return;
        try {
          const response = await api.get('/api/inventory/hq/orders');
          if (Array.isArray(response.data)) {
            // 해당 지점의 발주 내역만 필터링
            this.myOrderList = response.data.filter(
              order => Number(order.branchId) === Number(this.selectedBranchId)
            );
          }
        } catch (error) {
          console.error("발주 현황 로드 실패:", error);
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .order-history-container { padding: 24px; background: #f8fafc; min-height: 100vh; }
  .header-section h2 { font-size: 20px; font-weight: 800; color: #1e293b; }
  .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; margin-bottom: 20px; }
  
  .filter-card { display: flex; align-items: center; gap: 10px; background: white; padding: 14px 20px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
  .branch-select { padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; font-weight: 600; }
  .btn-refresh { padding: 6px 12px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: 600; cursor: pointer; }
  
  .order-table-card { background: white; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; }
  .order-table { width: 100%; border-collapse: collapse; }
  .order-table th, .order-table td { padding: 14px 18px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
  .order-table th { background: #f8fafc; font-weight: 700; color: #475569; }
  
  .font-bold { font-weight: 700; color: #1e293b; }
  .badge-warning { background: #fffbeb; color: #d97706; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; }
  .badge-success { background: #ecfdf5; color: #059669; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; }
  .badge-blue { background: #eff6ff; color: #2563eb; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; }
  .badge-gray { background: #f1f5f9; color: #64748b; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; }
  .empty-cell { text-align: center; color: #94a3b8; padding: 40px; }
  </style>