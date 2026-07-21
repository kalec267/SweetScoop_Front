<template>
  <div class="kiosk-control-container">
    <!-- 상단 헤더 -->
    <div class="header-section">
      <div>
        <h2>🖥️ 키오스크 활성화 관리</h2>
        <p class="subtitle">매장 내 키오스크의 가동 상태를 실시간으로 제어합니다.</p>
      </div>
      <button class="btn-refresh" @click="fetchKiosks" :disabled="isLoading">
        🔄 새로고침
      </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-box">
      키오스크 정보 불러오는 중...
    </div>

    <!-- 키오스크 그리드 목록 -->
    <div v-else-if="kiosks.length > 0" class="kiosk-grid">
      <div 
        v-for="kiosk in kiosks" 
        :key="kiosk.id" 
        class="kiosk-card"
        :class="{ 'is-active': kiosk.status === '정상' }"
      >
        <!-- 카드 상단 (이름 및 상태 배지) -->
        <div class="kiosk-card-header">
          <span class="kiosk-title">{{ kiosk.kioskName || `키오스크 #${kiosk.id}` }}</span>
          <span :class="getStatusBadgeClass(kiosk.status)">
            {{ kiosk.status }}
          </span>
        </div>

        <!-- 카드 본문 (ID 정보 등) -->
        <div class="kiosk-card-body">
          <p class="kiosk-id-info">기기 식별번호: <strong>#{{ kiosk.id }}</strong></p>
        </div>

        <!-- 카드 하단 (상태 토글 스위치) -->
        <div class="kiosk-card-footer">
          <span class="switch-text">
            {{ kiosk.status === '정상' ? '운영 중 (ON)' : '운영 중지 (OFF)' }}
          </span>
          <label class="switch">
            <input 
              type="checkbox" 
              :checked="kiosk.status === '정상'"
              :disabled="kiosk.isUpdating"
              @change="toggleStatus(kiosk)"
            />
            <span class="slider round"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- 데이터가 없을 때 -->
    <div v-else class="empty-box">
      등록된 키오스크 기기가 없습니다.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const kiosks = ref([]);
const isLoading = ref(false);

// 로그인한 분점의 ID (Pinia/Vuex 또는 라우터 파라미터에서 가져오는 값으로 설정해 주세요)
const branchId = ref(1); 

// 1. 특정 분점의 키오스크 목록 조회 (GET /api/admin/branches/{branchId}/kiosks)
const fetchKiosks = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get(`/api/admin/branches/${branchId.value}/kiosks`);
    kiosks.value = response.data.map(item => ({
      ...item,
      isUpdating: false // API 요청 중 중복 클릭 방지 플래그
    }));
  } catch (error) {
    console.error('키오스크 목록 조회 실패:', error);
    alert('키오스크 목록을 불러오는 데 실패했습니다.');
  } finally {
    isLoading.value = false;
  }
};

// 2. 키오스크 상태 변경 (PATCH /api/admin/kiosks/{kioskId}/status)
const toggleStatus = async (kiosk) => {
  // 현재 '정상'이면 -> '꺼짐'으로, 그 외는 '정상'으로 토글
  const nextStatus = kiosk.status === '정상' ? '꺼짐' : '정상';
  const confirmMsg = nextStatus === '정상'
    ? `키오스크 #${kiosk.id}를 활성화(정상) 하시겠습니까?`
    : `키오스크 #${kiosk.id} 가동을 중지(꺼짐) 하시겠습니까?`;

  if (!confirm(confirmMsg)) {
    // 취소 시 스위치 그래픽 위치 원복
    kiosks.value = [...kiosks.value];
    return;
  }

  kiosk.isUpdating = true;

  try {
    const response = await axios.patch(`/api/admin/kiosks/${kiosk.id}/status`, {
      status: nextStatus
    });
    
    // 응답받은 DTO의 status 값으로 업데이트
    kiosk.status = response.data.status;
  } catch (error) {
    console.error('상태 변경 실패:', error);
    alert('키오스크 상태 변경에 실패했습니다.');
  } finally {
    kiosk.isUpdating = false;
  }
};

// 상태값("정상", "꺼짐", "장애")에 따른 디자인 배지 클래스
const getStatusBadgeClass = (status) => {
  return {
    'status-badge': true,
    'badge-normal': status === '정상',
    'badge-off': status === '꺼짐',
    'badge-error': status === '장애'
  };
};

onMounted(() => {
  fetchKiosks();
});
</script>

<style scoped>
.kiosk-control-container {
  padding: 30px;
  max-width: 1080px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-section h2 {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 6px;
}

.subtitle {
  color: #6b7280;
  font-size: 0.95rem;
}

.btn-refresh {
  padding: 8px 16px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background-color: #e5e7eb;
}

/* 카드 그리드 레이아웃 */
.kiosk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.kiosk-card {
  background-color: #ffffff;
  border-radius: 14px;
  padding: 20px;
  border: 2px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;
}

.kiosk-card.is-active {
  border-color: #10b981; /* 정상(가동 중)일 때 초록색 테두리 */
}

.kiosk-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.kiosk-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: #111827;
}

/* 상태 배지 스타일 */
.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
}

.badge-normal { background-color: #d1fae5; color: #065f46; }
.badge-off { background-color: #f3f4f6; color: #4b5563; }
.badge-error { background-color: #fee2e2; color: #991b1b; }

.kiosk-card-body {
  margin-bottom: 20px;
}

.kiosk-id-info {
  font-size: 0.88rem;
  color: #6b7280;
}

.kiosk-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid #f3f4f6;
}

.switch-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

/* 토글 스위치 디자인 */
.switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #d1d5db;
  transition: .3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #10b981;
}

input:checked + .slider:before {
  transform: translateX(22px);
}

input:disabled + .slider {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-box, .empty-box {
  text-align: center;
  padding: 60px 0;
  color: #9ca3af;
  font-size: 1rem;
}
</style>