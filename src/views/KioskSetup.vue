<!-- src/views/KioskSetup.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api/axios'; // 기존 axios 인스턴스 사용

const router = useRouter();

// 데이터 상태
const branchList = ref([]);
const kioskList = ref([]);

const selectedBranch = ref(null); // 선택된 지점 객체 { id, name }
const selectedKiosk = ref(null);   // 선택된 키오스크 객체 { id, kioskNo, name }

const loadingBranch = ref(false);
const loadingKiosk = ref(false);

// 1. 지점 목록 불러오기
const fetchBranches = async () => {
  loadingBranch.value = true;
  try {
    const response = await api.get('/api/admin/branches');
    branchList.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('지점 목록 조회 실패:', error);
    alert('지점 목록을 불러오지 못했습니다.');
  } finally {
    loadingBranch.value = false;
  }
};

// 2. 지점 선택 시 해당 지점의 키오스크 목록 불러오기
const selectBranch = async (branch) => {
  selectedBranch.value = branch;
  selectedKiosk.value = null; // 지점이 바뀌면 기존 선택된 키오스크 초기화
  kioskList.value = [];
  
  loadingKiosk.value = true;
  try {
    // 지점 ID에 해당하는 키오스크 목록 조회 API
    const response = await api.get(`/api/admin/branches/${branch.id}/kiosks`);
    kioskList.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('키오스크 목록 조회 실패:', error);
    alert('키오스크 목록을 불러오지 못했습니다.');
  } finally {
    loadingKiosk.value = false;
  }
};

// 3. 키오스크 선택
const selectKiosk = (kiosk) => {
  selectedKiosk.value = kiosk;
};

// 4. 설정 저장 및 키오스크 시작
const saveSetup = () => {
  if (!selectedBranch.value || !selectedKiosk.value) {
    alert('지점과 키오스크를 모두 선택해 주세요.');
    return;
  }

  const branchId = selectedBranch.value.id;
  // kioskNo 속성이 없으면 id를 기본값으로 사용
  const kioskNo = selectedKiosk.value.kioskNo ?? selectedKiosk.value.id;

  // localStorage에 저장
  localStorage.setItem('branchId', branchId);
  localStorage.setItem('kioskNo', kioskNo);
  localStorage.setItem('branchName', selectedBranch.value.name || '');

  alert(`[${selectedBranch.value.name || '지점 ' + branchId}] - [키오스크 ${kioskNo}번] 설정이 완료되었습니다.`);
  
  // 메인 화면으로 이동
  router.push('/');
};

onMounted(() => {
  fetchBranches();
});
</script>

<template>
  <main class="setup-frame">
    <header class="setup-header">
      <h1>⚙️ 키오스크 초기 기기 등록</h1>
      <p>사용할 지점과 키오스크 번호를 선택해 주세요.</p>
    </header>

    <!-- STEP 1: 지점 선택 -->
    <section class="setup-section">
      <h2>1. 분점 선택</h2>
      <p v-if="loadingBranch" class="status-msg">지점 목록을 불러오는 중...</p>
      
      <div v-else class="button-grid">
        <button
          v-for="branch in branchList"
          :key="branch.id"
          type="button"
          class="select-btn"
          :class="{ active: selectedBranch?.id === branch.id }"
          @click="selectBranch(branch)"
        >
          <span class="btn-title">{{ branch.name || `지점 ${branch.id}` }}</span>
          <span class="btn-sub">ID: {{ branch.id }}</span>
        </button>
      </div>
    </section>

    <!-- STEP 2: 키오스크 선택 (지점이 선택된 경우에만 표시) -->
    <section v-if="selectedBranch" class="setup-section">
      <h2>2. 키오스크 선택 ({{ selectedBranch.name || '지점 ' + selectedBranch.id }})</h2>
      <p v-if="loadingKiosk" class="status-msg">키오스크 목록을 불러오는 중...</p>
      <p v-else-if="kioskList.length === 0" class="status-msg">해당 지점에 등록된 키오스크가 없습니다.</p>

      <div v-else class="button-grid">
        <button
          v-for="kiosk in kioskList"
          :key="kiosk.id"
          type="button"
          class="select-btn"
          :class="{ active: selectedKiosk?.id === kiosk.id }"
          @click="selectKiosk(kiosk)"
        >
          <span class="btn-title">{{ kiosk.name || `${kiosk.kioskNo || kiosk.id}호기` }}</span>
          <span class="btn-sub">키오스크 번호: {{ kiosk.kioskNo || kiosk.id }}</span>
        </button>
      </div>
    </section>

    <!-- 하단 설정 완료 버튼 -->
    <footer class="bottom-action">
      <div class="selected-summary">
        <span>선택한 설정:</span>
        <strong>
          {{ selectedBranch ? (selectedBranch.name || `지점 ${selectedBranch.id}`) : '지점 미선택' }}
          /
          {{ selectedKiosk ? (selectedKiosk.name || `${selectedKiosk.kioskNo || selectedKiosk.id}호기`) : '키오스크 미선택' }}
        </strong>
      </div>
      <button
        type="button"
        class="submit-btn"
        :disabled="!selectedBranch || !selectedKiosk"
        @click="saveSetup"
      >
        이 설정으로 키오스크 시작하기
      </button>
    </footer>
  </main>
</template>

<style scoped>
.setup-frame {
  max-width: 600px;
  margin: 0 auto;
  padding: 30px 20px 120px;
  font-family: sans-serif;
}

.setup-header {
  text-align: center;
  margin-bottom: 30px;
}

.setup-header h1 {
  font-size: 22px;
  color: #222;
  margin-bottom: 8px;
}

.setup-header p {
  font-size: 14px;
  color: #666;
}

.setup-section {
  margin-bottom: 35px;
  background: #f9f9f9;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #eee;
}

.setup-section h2 {
  font-size: 16px;
  color: #ff1493;
  margin-top: 0;
  margin-bottom: 15px;
}

.status-msg {
  color: #888;
  font-size: 13px;
  text-align: center;
  padding: 20px 0;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.select-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 80px;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-btn:hover {
  border-color: #ffb6c1;
}

.select-btn.active {
  border-color: #ff1493;
  background: #fff0f7;
  box-shadow: 0 4px 10px rgba(255, 20, 147, 0.15);
}

.btn-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
}

.select-btn.active .btn-title {
  color: #ff1493;
}

.btn-sub {
  font-size: 11px;
  color: #888;
  margin-top: 4px;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: min(100%, 600px);
  padding: 15px 20px;
  background: #ffffff;
  border-top: 1px solid #eee;
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selected-summary {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #555;
}

.selected-summary strong {
  color: #ff1493;
}

.submit-btn {
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 25px;
  background: #ff1493;
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>