<template>
    <div class="order-request-container">
      <div class="page-header">
        <h2>재고 신청 관리</h2>
        <button class="btn-primary" @click="openModal">＋ 신청 등록</button>
      </div>
  
      <!-- 신청 목록 테이블 -->
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>신청 번호</th>
              <th>분점명</th>
              <th>신청 물품</th>
              <th>수량</th>
              <th>상태</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in requestList" :key="item.requestId">
              <td>#REQ-{{ item.requestId }}</td>
              <td>{{ item.branchName }}</td>
              <td>{{ item.requestMenu }}</td>
              <td>{{ item.quantity }}개</td>
              <td>
                <span :class="'badge ' + getStatusClass(item.status)">{{ item.status }}</span>
              </td>
              <td>
                <div v-if="item.status === '대기중'" class="btn-group">
                  <button class="btn-success" @click="handleApproval(item.requestId, '승인완료')">승인</button>
                  <button class="btn-danger" @click="handleApproval(item.requestId, '반려')">반려</button>
                </div>
                <span v-else class="text-muted">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- 신청 등록 모달 팝업 -->
      <div v-if="isModalOpen" class="modal-overlay">
        <div class="modal-content">
          <h3>신규 재고 신청 등록</h3>
          <div class="form-group">
            <label>분점 선택</label>
            <select v-model="newRequest.branchId">
              <option value="1">스윗스쿱 강남역점</option>
              <option value="2">스윗스쿱 홍대점</option>
            </select>
          </div>
          <div class="form-group">
            <label>물품 선택</label>
            <select v-model="newRequest.itemId">
              <option value="1">엄마는 외계인 튜브(1000g)</option>
              <option value="2">아몬드 봉봉 튜브(1000g)</option>
              <option value="18">에스프레소 원두(1000g)</option>
            </select>
          </div>
          <div class="form-group">
            <label>요청 수량</label>
            <input type="number" v-model="newRequest.quantity" min="1" />
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModal">취소</button>
            <button class="btn-primary" @click="submitRequest">등록</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  
  const requestList = ref([]);
  const isModalOpen = ref(false);
  const newRequest = ref({ branchId: 1, itemId: 1, quantity: 10 });
  
  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:8888/api/admin/inventory/requests');
      requestList.value = res.data;
    } catch (err) {
      console.error("데이터 로드 실패", err);
    }
  };
  
  const handleApproval = async (id, status) => {
    try {
      await axios.patch(`http://localhost:8888/api/admin/inventory/requests/${id}/approval`, {
        status: status,
        hqManagerId: 'admin_hq'
      });
      alert(`발주가 ${status} 처리되었습니다.`);
      fetchRequests();
    } catch (err) {
      alert("처리 중 에러가 발생했습니다.");
    }
  };
  
  const submitRequest = async () => {
    try {
      await axios.post('http://localhost:8888/api/admin/inventory/requests', newRequest.value);
      alert("신규 재고 신청이 완료되었습니다.");
      closeModal();
      fetchRequests();
    } catch (err) {
      alert("등록 실패");
    }
  };
  
  const openModal = () => isModalOpen.value = true;
  const closeModal = () => isModalOpen.value = false;
  const getStatusClass = (status) => {
    if (status === '대기중') return 'bg-warning';
    if (status === '배송중') return 'bg-info';
    if (status === '승인완료' || status === '완료') return 'bg-success';
    return 'bg-danger';
  };
  
  onMounted(fetchRequests);
  </script>