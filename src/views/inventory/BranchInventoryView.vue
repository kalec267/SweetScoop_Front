<template>
    <div class="inventory-container">
      <h2>🏪 지점 실시간 재고 관리 (1번 지점)</h2>
      
      <div v-if="loading" class="loading">재고 데이터를 불러오는 중입니다...</div>
  
      <table v-else border="1" class="inventory-table">
        <thead>
          <tr>
            <th>재고 고유 ID</th>
            <th>물품 ID</th>
            <th>현재 재고량 (g)</th>
            <th>상태 및 관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in inventoryList" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.itemId }}</td>
            <td :class="{ 'warning-text': item.stockLevel < 5000 }">
              {{ item.stockLevel.toLocaleString() }}g
            </td>
            <td>
              <span v-if="item.stockLevel < 5000" class="badge bg-danger">⚠️ 재고부족 (자동발주)</span>
              <span v-else class="badge bg-success">✅ 정상</span>
            </td>
          </tr>
          <tr v-if="inventoryList.length === 0">
            <td colspan="4">등록된 재고 정보가 없습니다.</td>
          </tr>
        </tbody>
      </table>
  
      <div class="test-simulator">
        <h3>🚚 [테스트 전용] 발주 물품 입고 시뮬레이터</h3>
        <p>본사 발주 ID (hqinventory 테이블의 id)를 입력하고 버튼을 누르면 재고가 다시 채워집니다.</p>
        <input 
          type="number" 
          v-model.number="testHqId" 
          placeholder="발주 ID 입력 (예: 1)" 
          class="sim-input" 
        />
        <button @click="simulateStockIn" class="sim-btn">
          물품 매장 입고(완료) 처리
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'BranchInventoryView',
    data() {
      return {
        inventoryList: [], // 백엔드 API로부터 받을 데이터 저장소
        loading: true,     // 로딩 상태 플래그
        branchId: 1,       // 테스트용 지점 ID (우선 1번 지점으로 고정)
        testHqId: null     // 본사 발주 입고 테스트용 변수
      };
    },
    mounted() {
      // 컴포넌트가 화면에 장착되면 백엔드 API 호출 실행
      this.fetchInventoryData();
    },
    methods: {
      fetchInventoryData() {
        this.loading = true;
        axios.get(`http://localhost:8888/inventory/branch/${this.branchId}`)
          .then(response => {
            this.inventoryList = response.data;
            this.loading = false;
          })
          .catch(error => {
            console.error("재고 API 호출 중 에러 발생:", error);
            alert("재고 데이터를 가져오는데 실패했습니다. 백엔드 서버가 켜져있는지 확인하세요.");
            this.loading = false;
          });
      },
      // 본사 발주 입고 API를 호출하는 비즈니스 메서드
      simulateStockIn() {
        if (!this.testHqId) {
          alert("발주 ID를 입력해주세요.");
          return;
        }
        
        axios.post(`http://localhost:8888/inventory/in/hq?hqInventoryId=${this.testHqId}`)
          .then(response => {
            alert(response.data);
            this.fetchInventoryData(); // 완료 후 화면 새로고침하여 바뀐 수량 확인
            this.testHqId = null;       // 입력창 초기화
          })
          .catch(error => {
            console.error("입고 처리 실패:", error);
            alert("입고 처리에 실패했습니다. 콘솔 창의 에러 메시지를 확인하세요.");
          });
      }
    }
  }
  </script>
  
  <style scoped>
  .inventory-container {
    padding: 30px;
    font-family: Arial, sans-serif;
  }
  .inventory-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    text-align: center;
  }
  .inventory-table th, .inventory-table td {
    padding: 12px;
  }
  .inventory-table th {
    background-color: #f4f6f9;
  }
  .warning-text {
    color: #dc3545;
    font-weight: bold;
  }
  .badge {
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    color: white;
  }
  .bg-danger { background-color: #dc3545; }
  .bg-success { background-color: #28a745; }
  .loading {
    text-align: center;
    padding: 50px;
    font-size: 16px;
    color: #666;
  }
  
  .test-simulator {
    margin-top: 40px;
    padding: 20px;
    border: 2px dashed var(--border);
    border-radius: 8px;
    text-align: left;
    background: var(--code-bg);
  }
  .test-simulator h3 {
    margin: 0 0 10px 0;
    color: var(--text-h);
  }
  .test-simulator p {
    margin: 0 0 15px 0;
    font-size: 14px;
  }
  .sim-input {
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 4px;
    margin-right: 10px;
    width: 200px;
  }
  .sim-btn {
    padding: 9px 16px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  .sim-btn:hover {
    background-color: #218838;
  }
  </style>