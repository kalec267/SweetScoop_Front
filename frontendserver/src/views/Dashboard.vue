<template>
  <div class="dashboard-container">
    <!-- 상단 대시보드 타이틀 영역 -->
    <div class="dashboard-header">
      <div class="header-title">
        <h2>대시보드</h2>
        <p class="subtitle">아이스크림 재고 신청 · 배송 현황 한눈에 보기</p>
      </div>
    </div>

    <!-- [상단] 4가지 핵심 지표 요약 카드 영역 -->
    <div class="summary-cards">
      <!-- 1. 전체 신청 -->
      <div class="card">
        <div class="card-body">
          <div class="card-info">
            <span class="card-label">전체 신청</span>
            <h3 class="card-value">{{ summary.totalRequests }}</h3>
            <span class="card-sub text-success">↗ +12 이번 주</span>
          </div>
          <div class="card-icon-box bg-light-blue">📄</div>
        </div>
      </div>

      <!-- 2. 처리 대기 -->
      <div class="card">
        <div class="card-body">
          <div class="card-info">
            <span class="card-label">처리 대기</span>
            <h3 class="card-value">{{ summary.pendingCount }}</h3>
            <span class="card-sub text-warning">⚠️ 즉시 확인 필요</span>
          </div>
          <div class="card-icon-box bg-light-yellow">🕒</div>
        </div>
      </div>

      <!-- 3. 배송 중 -->
      <div class="card">
        <div class="card-body">
          <div class="card-info">
            <span class="card-label">배송 중</span>
            <h3 class="card-value">{{ summary.shippingCount }}</h3>
            <span class="card-sub text-primary">📍 배송 진행 중</span>
          </div>
          <div class="card-icon-box bg-light-purple">🚚</div>
        </div>
      </div>

      <!-- 4. 전체 분점 -->
      <div class="card">
        <div class="card-body">
          <div class="card-info">
            <span class="card-label">전체 분점</span>
            <h3 class="card-value">{{ summary.activeBranches }}</h3>
            <span class="card-sub text-success">✅ 전점 정상 운영</span>
          </div>
          <div class="card-icon-box bg-light-pink">🏪</div>
        </div>
      </div>
    </div>

    <!-- [하단] 재고 신청 현황 테이블 영역 -->
    <div class="content-section">
      <div class="section-header">
        <div class="section-title">
          <h3>재고 신청 현황</h3>
          <p class="section-subtitle">최근 신청 내역을 확인하고 승인/반려 처리하세요</p>
        </div>
        <div class="section-actions">
          <!-- 필터 및 검색 컨트롤 영역 -->
          <div class="filter-wrapper">
            <select v-model="statusFilter" @change="currentPage = 1" class="select-filter">
              <option value="ALL">전체 상태</option>
              <option value="대기 중">처리 대기</option>
              <option value="배송 중">배송 중</option>
              <option value="완료">완료</option>
              <option value="반려">반려</option>
            </select>
          </div>
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="분점명 또는 메뉴 검색..." 
              v-model="searchQuery" 
              @input="currentPage = 1" 
            />
          </div>
          <button class="btn-submit" @click="goToOrderRequestPage">＋ 신청 등록</button>
        </div>
      </div>

      <!-- 데이터 리스트 테이블 -->
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>신청 번호</th>
              <th>분점명</th>
              <th>신청 메뉴</th>
              <th>수량</th>
              <th>신청일</th>
              <th>상태</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            <!-- 중요: 필터링과 페이징이 가공되어 분할된 paginatedRequests 바인딩 -->
            <tr v-for="req in paginatedRequests" :key="req.requestId">
              <td class="req-id">#REQ-{{ req.requestId }}</td>
              <td class="branch-name">
                <span class="dot-indicator" :class="getDotClass(req.status)"></span>
                {{ req.branchName }}
              </td>
              <td class="menu-name">{{ req.requestMenu }}</td>
              <td class="quantity">{{ req.quantity }}개</td>
              <td class="date">{{ req.requestDate || '2026.07.14' }}</td>
              <td>
                <span class="status-badge" :class="getStatusBadgeClass(req.status)">
                  {{ req.status }}
                </span>
              </td>
              <td>
                <!-- 상태 조건별 동적 버튼 렌더링 -->
                <div v-if="req.status === '대기 중'" class="action-buttons">
                  <button class="btn-approve" @click="updateStatus(req.requestId, '승인완료')">승인</button>
                  <button class="btn-reject" @click="updateStatus(req.requestId, '반려')">반려</button>
                </div>
                <div v-else-if="req.status === '배송 중'">
                  <button class="btn-track" @click="trackDelivery(req.requestId)">📍 배송 추적</button>
                </div>
                <div v-else>
                  <button class="btn-detail" @click="viewDetail(req.requestId)">상세 보기</button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedRequests.length === 0">
              <td colspan="7" class="text-center text-muted py-5">
                조건에 부합하는 재고 신청 내역이 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 테이블 하단 페이지네이션 및 정보 영역 -->
      <div class="pagination-container" v-if="filteredRequests.length > 0">
        <div class="pagination-info">
          전체 {{ filteredRequests.length }}건 중 
          {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredRequests.length) }} 표시
        </div>
        <div class="pagination-pages">
          <button 
            class="btn-page-nav" 
            @click="setPage(currentPage - 1)" 
            :disabled="currentPage === 1"
          >
            &lt;
          </button>
          
          <button 
            v-for="page in totalPages" 
            :key="page" 
            class="btn-page"
            :class="{ active: currentPage === page }" 
            @click="setPage(page)"
          >
            {{ page }}
          </button>

          <button 
            class="btn-page-nav" 
            @click="setPage(currentPage + 1)" 
            :disabled="currentPage === totalPages"
          >
            &gt;
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

// 검색 및 필터링 상태값
const searchQuery = ref('');
const statusFilter = ref('ALL');

// 페이징 상태값
const currentPage = ref(1);
const itemsPerPage = 5;

// 1. 상단 요약 카드 모의 상태 데이터
const summary = ref({
  totalRequests: 248,
  pendingCount: 18,
  shippingCount: 7,
  activeBranches: 12
});

// 2. 이미지 시안 기준 초기 리스트 백업용 데이터셋 (Mock)
const requests = ref([
  { requestId: 2024, branchName: '강남점', requestMenu: '딸기 아이스크림 외 3종', quantity: 150, requestDate: '2026.07.12', status: '대기 중' },
  { requestId: 2023, branchName: '홍대점', requestMenu: '초코 아이스크림 외 5종', quantity: 230, requestDate: '2026.07.11', status: '배송 중' },
  { requestId: 2022, branchName: '신촌점', requestMenu: '바닐라 소프트콘 외 2종', quantity: 80, requestDate: '2026.07.10', status: '완료' },
  { requestId: 2021, branchName: '수원점', requestMenu: '망고 샤베트 외 1종', quantity: 60, requestDate: '2026.07.09', status: '대기 중' },
  { requestId: 2020, branchName: '부산점', requestMenu: '레몬 셔벗 외 4종', quantity: 120, requestDate: '2026.07.08', status: '반려' }
]);

// 3. 백엔드 실시간 API 호출 연동 (JPA 구성 완료 시 실데이터 바인딩)
const fetchDashboardData = async () => {
  try {
    const summaryRes = await axios.get('http://localhost:8888/api/admin/dashboard/summary');
    summary.value = summaryRes.data;
    
    const requestsRes = await axios.get('http://localhost:8888/api/admin/inventory/requests');
    requests.value = requestsRes.data;
  } catch (error) {
    console.log('초기 개발 단계를 위해 기존 Mock 구조화 데이터 레이아웃을 표시합니다.');
  }
};

// 4. 상태 변경 비즈니스 이벤트 (승인/반려 PATCH 요청)
const updateStatus = async (requestId, nextStatus) => {
  try {
    await axios.patch(`http://localhost:8888/api/admin/inventory/requests/${requestId}/approval`, {
      status: nextStatus,
      hqManagerId: 'admin_hq'
    });
    alert(`요청이 성공적으로 변경되었습니다.`);
    fetchDashboardData();
  } catch (error) {
    // 백엔드 미동작 시 화면 프론트엔드단 선반영 동작 테스트 피드백
    const target = requests.value.find(r => r.requestId === requestId);
    if(target) {
      target.status = nextStatus === '승인완료' ? '배송 중' : '반려';
    }
  }
};

// [기능 구현] 검색어 및 셀렉트 박스 필터링 연산
const filteredRequests = computed(() => {
  return requests.value.filter(req => {
    const branch = req.branchName ? req.branchName.toLowerCase() : '';
    const menu = req.requestMenu ? req.requestMenu.toLowerCase() : '';
    const query = searchQuery.value.toLowerCase();

    const matchesSearch = branch.includes(query) || menu.includes(query);
    const matchesStatus = statusFilter.value === 'ALL' || req.status === statusFilter.value;

    return matchesSearch && matchesStatus;
  });
});

// [기능 구현] 필터링 데이터를 기준으로 현재 페이지만 조각내기
const paginatedRequests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredRequests.value.slice(start, end);
});

// [기능 구현] 전체 페이지 개수 연산
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredRequests.value.length / itemsPerPage));
});

// 페이지 스위칭 핸들러
const setPage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
};

// 버튼 인터랙션 함수 세팅
const trackDelivery = (id) => alert(`#REQ-${id} 운송 배송 추적 모달 실행`);
const viewDetail = (id) => alert(`#REQ-${id} 상세 영수증/명세서 확인`);
const goToOrderRequestPage = () => router.push('/order-request');

// 시안 배지 맵핑 필터 클래스 유틸리티
const getStatusBadgeClass = (status) => {
  switch (status) {
    case '대기 중': return 'badge-waiting';
    case '배송 중': return 'badge-shipping';
    case '완료': case '승인완료': return 'badge-success';
    case '반려': return 'badge-rejected';
    default: return '';
  }
};

const getDotClass = (status) => {
  switch (status) {
    case '대기 중': return 'dot-orange';
    case '배송 중': return 'dot-blue';
    case '완료': case '승인완료': return 'dot-green';
    case '반려': return 'dot-red';
    default: return 'dot-gray';
  }
};

onMounted(fetchDashboardData);
</script>

<style scoped>
/* 🎨 UI 이미지 피드백 맞춤형 고품격 스타일 시트 스펙 */
.dashboard-container {
  padding: 30px;
  background-color: #f8fafc;
  font-family: 'Inter', sans-serif;
}

/* 상단 타이틀 구조 */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}
.header-title h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}
.subtitle {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

/* 상단 4단 그리드 카드 디자인 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}
.card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
}
.card-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.card-info {
  display: flex;
  flex-direction: column;
}
.card-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}
.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin: 6px 0;
}
.card-sub {
  font-size: 13px;
  font-weight: 500;
}
.card-icon-box {
  width: 46px;
  height: 46px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

/* 백그라운드 컴포넌트 컬러 변동 칩 */
.bg-light-blue { background-color: #eff6ff; }
.bg-light-yellow { background-color: #fefce8; }
.bg-light-purple { background-color: #f5f3ff; }
.bg-light-pink { background-color: #fdf2f8; }

.text-success { color: #10b981; }
.text-warning { color: #f59e0b; }
.text-primary { color: #3b82f6; }

/* 하단 섹션 제어 헤더 */
.content-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.section-title h3 {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}
.section-subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
}
.section-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.filter-wrapper {
  position: relative;
}
.select-filter {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  color: #475569;
  outline: none;
}
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
}
.search-box input {
  border: 1px solid #e2e8f0;
  padding: 8px 12px 8px 35px;
  border-radius: 8px;
  font-size: 14px;
  width: 200px;
  outline: none;
}
.search-box input:focus {
  border-color: #6f42c1;
}
.btn-submit {
  background: #6f42c1;
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

/* 데이터 테이블 스타일 스펙 */
.table-wrapper {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
  font-size: 13px;
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #edf2f7;
}
td {
  padding: 16px;
  font-size: 14px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.req-id { color: #64748b; font-weight: 500; }
.branch-name { font-weight: 600; display: flex; align-items: center; gap: 8px; }
.menu-name { font-weight: 500; }

/* 지점 도트 색상 플래그 */
.dot-indicator { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.dot-orange { background-color: #f59e0b; }
.dot-blue { background-color: #3b82f6; }
.dot-green { background-color: #10b981; }
.dot-red { background-color: #ef4444; }
.dot-gray { background-color: #94a3b8; }

/* 상태 배지 스타일 */
.status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.badge-waiting { background-color: #fffbeb; color: #d97706; }
.badge-shipping { background-color: #eff6ff; color: #2563eb; }
.badge-success { background-color: #ecfdf5; color: #059669; }
.badge-rejected { background-color: #fef2f2; color: #dc2626; }

/* 액션 코어 버튼 모음 */
.action-buttons { display: flex; gap: 6px; }
.btn-approve { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-reject { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-track { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-detail { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; }

/* 하단 페이지네이션 구조 */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px solid #f1f5f9;
}
.pagination-info { font-size: 13px; color: #64748b; }
.pagination-pages { display: flex; align-items: center; gap: 6px; }
.btn-page {
  background: white;
  border: 1px solid #e2e8f0;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}
.btn-page.active {
  background: #6f42c1;
  color: white;
  border-color: #6f42c1;
}
.btn-page:disabled, .btn-page-nav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-page-nav {
  background: white;
  border: 1px solid #e2e8f0;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #64748b;
}
.text-center { text-align: center; }
.py-5 { padding-top: 3rem; padding-bottom: 3rem; }
.text-muted { color: #94a3b8; }
</style>