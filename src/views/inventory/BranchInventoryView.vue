<template>
  <div class="inventory-container">
    <!-- 상단 타이틀 및 지점 필터 선택 -->
    <div class="inventory-header">
      <div class="title-area">
        <h2>지점별 실시간 재고 관리</h2>
        
        <!-- DB 연동 지점 리스트 동적 v-for 바인딩 완료 -->
        <select v-model="selectedBranchId" @change="fetchInventoryData" class="branch-select">
          <option value="" disabled>--- 지점을 선택하세요 ---</option>
          <option v-for="branch in branchList" :key="branch.id" :value="branch.id">
            {{ branch.id }}번 지점 ({{ branch.branchName }})
          </option>
        </select>
      </div>
      <div class="action-area">
        <button class="btn-refresh" @click="fetchInventoryData">🔄 새로고침</button>
      </div>
    </div>

    <!-- 현황 요약 미니 보드 -->
    <div class="summary-grid">
      <div class="summary-card alert-card">
        <div class="card-title">재고 부족 경고 품목</div>
        <div class="card-value">{{ alertItemsCount }}건</div>
      </div>
      <div class="summary-card normal-card">
        <div class="card-title">정상 운영 품목</div>
        <div class="card-value">{{ inventoryList.length - alertItemsCount }}건</div>
      </div>
    </div>

    <!-- 재고 데이터 메인 테이블 영역 -->
    <div class="table-section">
      <table class="inventory-table">
        <thead>
          <tr>
            <th>카테고리</th>
            <th>물품 ID</th>
            <th>물류 실물품명</th>
            <th class="text-right">현재 재고량</th>
            <th>상태</th>
            <th class="text-center">수동 재고 신청</th>
          </tr>
        </thead>
        <tbody>
          <!-- 백엔드 임계치 기준인 5000g 미만일 때 row-danger 클래스 적용 -->
          <tr v-for="item in inventoryList" :key="item.itemId" :class="{ 'row-danger': item.stockLevel < 5000 }">
            <td class="cate-badge"><span>{{ item.categoryName }}</span></td>
            <td class="item-id">#{{ item.itemId }}</td>
            <!-- 물류 실물 이름 바인딩 -->
            <td class="item-name">{{ item.itemName }}</td>
            <!-- parseUnit 함수를 사용하여 정수형 코드를 한글 단위로 치환 -->
            <td class="stock-level text-right">{{ formatNumber(item.stockLevel) }} g ({{ parseUnit(item.unit) }})</td>
            <td>
              <span v-if="item.stockLevel < 5000" class="badge bg-danger">재고 부족 (자동신청 대기)</span>
              <span v-else class="badge bg-success">안정</span>
            </td>
            <td class="text-center">
              <button class="btn-request" @click="openRequestModal(item)">
                📦 수동 신청
              </button>
            </td>
          </tr>
          <tr v-if="inventoryList.length === 0">
            <td colspan="6" class="table-empty">조회된 재고 내역이 없습니다. DB 데이터를 확인해 주세요.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'BranchInventory',
  data() {
    return {
      selectedBranchId: "", // 초기값 비워두고 지점 리스트 로드 후 셋팅
      branchList: [],       // 백엔드 DB에서 받아온 지점 마스터 리스트를 저장할 배열 변수
      inventoryList: []
    };
  },
  computed: {
    // 백엔드 자동 발주 기준인 5000g 미만 품목 필터링 계산
    alertItemsCount() {
      return this.inventoryList.filter(item => item.stockLevel < 5000).length;
    }
  },
  mounted() {
    // 화면이 열리자마자 지점 목록을 먼저 받아옵니다.
    this.fetchBranchList();
  },
  methods: {
    // 백엔드 API에서 지점 리스트를 동적으로 읽어오는 메서드
    async fetchBranchList() {
      try {
        const response = await axios.get('http://localhost:8888/inventory/branches');
        this.branchList = response.data;
        
        // 지점이 존재하면 리스트의 첫 번째 지점을 기본값으로 잡고 재고 데이터를 조회합니다.
        if (this.branchList.length > 0) {
          this.selectedBranchId = this.branchList[0].id;
          this.fetchInventoryData();
        }
      } catch (error) {
        console.error("지점 마스터 목록 로드 실패:", error);
      }
    },
    async fetchInventoryData() {
      if (!this.selectedBranchId) return; // 선택된 지점이 없으면 통신 스킵
      
      try {
        const response = await axios.get(`http://localhost:8888/inventory/branch/${this.selectedBranchId}`);
        this.inventoryList = response.data;
      } catch (error) {
        console.error("지점 재고 데이터를 가져오는 중 에러 발생:", error);
      }
    },
    async openRequestModal(item) {
      const reqAmount = prompt(`[${item.itemName}] 특이케이스 수동 발주 신청\n\n본사에 신청할 중량(g 단위)을 입력하세요:`, "5000");
      
      if (!reqAmount || isNaN(reqAmount) || Number(reqAmount) <= 0) {
        alert("올바른 수량을 입력해주세요.");
        return;
      }

      try {
        // 백엔드 컨트롤러의 @RequestParam 규격에 맞추어 쿼리 스트링 파라미터 형태로 전송
        const params = new URLSearchParams();
        params.append('branchId', this.selectedBranchId);
        params.append('itemId', item.itemId);
        params.append('amount', Number(reqAmount));

        const response = await axios.post('http://localhost:8888/inventory/request/manual', params);
        
        if (response.status === 200) {
          alert("본사 발주 대기열에 수동 신청이 정상 등록되었습니다. 본사 승인을 기다려주세요.");
        }
      } catch (error) {
        alert("수동 발주 신청 중 오류가 발생했습니다.");
        console.error(error);
      }
    },
    parseUnit(unitCode) {
      // DB의 정수형 단위 코드를 한글 이름으로 치환
      const code = Number(unitCode);
      if (code === 1) return '통';
      if (code === 2) return '개';
      if (code === 3) return '팩';
      return '단위';
    },
    formatNumber(val) {
      return String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  }
};
</script>

<style scoped>
.inventory-container { padding: 24px; background-color: #f8fafc; font-family: 'Inter', sans-serif; }
.inventory-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.title-area { display: flex; align-items: center; gap: 16px; }
.branch-select { padding: 8px 12px; font-size: 14px; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #fff; font-weight: 500; outline: none; cursor: pointer; }
.btn-refresh { padding: 8px 16px; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; font-weight: 500; }
.btn-refresh:hover { background: #f1f5f9; }

.summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
.summary-card { background-color: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.alert-card .card-value { color: #ef4444; font-size: 24px; font-weight: 700; }
.normal-card .card-value { color: #10b981; font-size: 24px; font-weight: 700; }
.card-title { color: #64748b; font-size: 14px; margin-bottom: 8px; }

.table-section { background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.inventory-table { width: 100%; border-collapse: collapse; }
.inventory-table th { color: #64748b; border-bottom: 2px solid #e2e8f0; font-size: 14px; font-weight: 600; padding: 12px 16px; text-align: left; }
.inventory-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px; text-align: left; }

.text-right { text-align: right !important; }
.text-center { text-align: center !important; }

.cate-badge span { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: 600; }
.item-id { color: #94a3b8; font-family: monospace; }
.item-name { font-weight: 600; color: #1e293b; }
.stock-level { font-weight: 700; color: #334155; }

.badge { padding: 4px 8px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.bg-success { background-color: #d1fae5; color: #065f46; }
.bg-danger { background-color: #fee2e2; color: #991b1b; }
.row-danger { background-color: #fff5f5; }

.btn-request { background-color: #6366f1; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 500; cursor: pointer; font-size: 13px; }
.btn-request:hover { background-color: #4f46e5; }
.table-empty { text-align: center !important; color: #94a3b8; padding: 40px 0; }
</style>