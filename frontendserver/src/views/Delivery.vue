<template>
    <div class="delivery-container">
      <h2>물류 배송 관리</h2>
      
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>발주 ID</th>
              <th>목적지 분점</th>
              <th>배송 물품</th>
              <th>배송 상태</th>
              <th>상태 변경</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in deliveryList" :key="item.requestId">
              <td>#DEL-{{ item.requestId }}</td>
              <td>{{ item.branchName }}</td>
              <td>{{ item.requestMenu }} ({{ item.quantity }}개)</td>
              <td>
                <span class="status-label" :class="item.deliveryStatus">{{ item.deliveryStatus }}</span>
              </td>
              <td>
                <button 
                  v-if="item.deliveryStatus === '준비중'" 
                  class="btn-action" 
                  @click="updateDelivery(item.requestId, '배송중')"
                >🚚 배송 출발</button>
                <button 
                  v-else-if="item.deliveryStatus === '배송중'" 
                  class="btn-action success" 
                  @click="updateDelivery(item.requestId, '배송완료')"
                >🏠 배송 완료 처리</button>
                <span v-else class="text-complete">🎉 완료됨</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  
  const deliveryList = ref([]);
  
  const fetchDeliveries = async () => {
    // 전체 발주 요청 데이터 중 '승인완료'된 항목들을 필터링해 노출하도록 구현 예정
    const res = await axios.get('http://localhost:8888/api/admin/inventory/requests');
    deliveryList.value = res.data.filter(item => item.status !== '대기중' && item.status !== '반려');
  };
  
  const updateDelivery = async (id, status) => {
    try {
      await axios.patch(`http://localhost:8888/api/admin/inventory/requests/${id}/delivery`, {
        deliveryStatus: status
      });
      alert(`배송 상태가 [${status}]로 변경되었습니다.`);
      fetchDeliveries();
    } catch (err) {
      alert("상태 변경 실패");
    }
  };
  
  onMounted(fetchDeliveries);
  </script>