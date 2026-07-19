<template>
  <aside class="sidebar-container">
    <!-- 서비스 로고 영역 -->
    <div class="logo-area" @click="goToHome">
      <span class="logo-icon">🍦</span>
      <h1 class="logo-title">Sweet Scoop</h1>
    </div>

    <!-- 메뉴 리스트 영역 -->
    <nav class="menu-nav">
      
      <!-- ==============================================
           [CASE 1] 본사 관리자(HQ) 메뉴 세트
           ============================================== -->
      <template v-if="userRole === 'HQ'">
        <!-- [HQ - 그룹 1] 일반 관리 -->
        <div class="menu-group" :class="{ 'is-open': openGroups.general }">
          <button class="group-header-btn" @click="toggleGroup('general')">
            <span class="group-title">📁 일반 관리</span>
            <span class="arrow-icon">▾</span>
          </button>
          <div class="group-items">
            <router-link to="/dashboard" class="menu-item" active-class="active">
              <span class="menu-icon">📊</span> 대시보드
            </router-link>
            <router-link to="/delivery-management" class="menu-item" active-class="active">
              <span class="menu-icon">🚚</span> 배송 관리
            </router-link>
            <router-link to="/admin/branches" class="menu-item" active-class="active">
              <span class="menu-icon">🏪</span> 분점 관리
            </router-link>
          </div>
        </div>

        <!-- [HQ - 그룹 2] 본사 전용 설정 -->
        <div class="menu-group" :class="{ 'is-open': openGroups.hqOnly }">
          <button class="group-header-btn" @click="toggleGroup('hqOnly')">
            <span class="group-title">⚙️ 본사 전용 설정</span>
            <span class="arrow-icon">▾</span>
          </button>
          <div class="group-items">
            <router-link to="/menu-management" class="menu-item" active-class="active">
              <span class="menu-icon">🍒</span> 맛 관리 (메뉴)
            </router-link>
            <router-link to="/event-management" class="menu-item" active-class="active">
              <span class="menu-icon">🎁</span> 이벤트 / 배너 관리
            </router-link>
            <router-link to="/inquiries" class="menu-item" active-class="active">
              <span class="menu-icon">💬</span> 지점문의 답변
            </router-link>
          </div>
        </div>
      </template>

      <!-- ==============================================
           [CASE 2] 분점 관리자(BRANCH) 메뉴 세트
           ============================================== -->
      <template v-else-if="userRole === 'BRANCH'">
        <!-- [BRANCH - 그룹 1] 지점 영업 통제 -->
        <div class="menu-group" :class="{ 'is-open': openGroups.branchOps }">
          <button class="group-header-btn" @click="toggleGroup('branchOps')">
            <span class="group-title">🏪 지점 운영 관리</span>
            <span class="arrow-icon">▾</span>
          </button>
          <div class="group-items">
            <router-link to="/branch/dashboard" class="menu-item" active-class="active">
              <span class="menu-icon">🏠</span> 지점 홈 (대시보드)
            </router-link>
            <router-link to="/kiosk-control" class="menu-item" active-class="active">
              <span class="menu-icon">🖥️</span> 키오스크 활성화 (AS-001)
            </router-link>
            <router-link to="/orders-history" class="menu-item" active-class="active">
              <span class="menu-icon">🧾</span> 주문 취소/영수증 (AS-003, 004)
            </router-link>
          </div>
        </div>

        <!-- [BRANCH - 그룹 2] 물류 재고 통제 -->
        <div class="menu-group" :class="{ 'is-open': openGroups.branchInventory }">
          <button class="group-header-btn" @click="toggleGroup('branchInventory')">
            <span class="group-title">📦 지점 재고 통제</span>
            <span class="arrow-icon">▾</span>
          </button>
          <div class="group-items">
            <router-link to="/branch/inventory" class="menu-item" active-class="active">
              <span class="menu-icon">🍦</span> 실시간 재고 관리 (AS-002)
            </router-link>
            <router-link to="/branch/order-request" class="menu-item" active-class="active">
              <span class="menu-icon">📨</span> 발주 및 자동발주 (AS-005, 006)
            </router-link>
          </div>
        </div>
      </template>

      <!-- [공통 그룹] 소통 및 분석 -->
      <div class="menu-group" :class="{ 'is-open': openGroups.analysis }">
        <button class="group-header-btn" @click="toggleGroup('analysis')">
          <span class="group-title">📈 소통 및 분석</span>
          <span class="arrow-icon">▾</span>
        </button>
        <div class="group-items">
          <router-link :to="userRole === 'HQ' ? '/statistics' : '/branch/statistics'" class="menu-item" active-class="active">
            <span class="menu-icon">📊</span> 매출 분석 (AC-002)
          </router-link>
          <router-link :to="userRole === 'HQ' ? '/inquiries' : '/branch/inquiries'" class="menu-item" active-class="active">
            <span class="menu-icon">💬</span> 문의사항 관리 (AC-003)
          </router-link>
        </div>
      </div>

    </nav>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const userRole = ref('');

// 아코디언 열림/닫힘 제어
const openGroups = ref({
  general: true,
  hqOnly: false,
  branchOps: true,
  branchInventory: false,
  analysis: false
});

const toggleGroup = (groupKey) => {
  openGroups.value[groupKey] = !openGroups.value[groupKey];
};

const goToHome = () => {
  router.push(userRole.value === 'HQ' ? '/dashboard' : '/branch/dashboard');
};

onMounted(() => {
  // 로컬 스토리지에 기저장된 유저 권한 정보 획득
  userRole.value = localStorage.getItem('userRole') || '';
});
</script>

<style scoped>
/* 사이드바 기본 레이아웃 스타일 (이전 가이드 스펙과 완벽 정합) */
.sidebar-container {
  width: 260px;
  height: 100vh;
  background-color: #d13b7d;
  color: white;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  flex-shrink: 0;
}
.logo-area {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
}
.logo-icon { font-size: 24px; }
.logo-title { font-size: 18px; font-weight: 700; }
.menu-nav {
  flex: 1;
  padding: 15px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}
.menu-group { display: flex; flex-direction: column; }
.group-header-btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.85);
  padding: 12px 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border-radius: 8px;
}
.group-header-btn:hover { background: rgba(255, 255, 255, 0.08); color: white; }
.arrow-icon { font-size: 12px; transition: transform 0.2s ease; }
.is-open .arrow-icon { transform: rotate(180deg); }
.group-items {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s cubic-bezier(0, 1, 0, 1);
  display: flex;
  flex-direction: column;
  padding-left: 8px;
}
.is-open .group-items {
  max-height: 500px;
  transition: max-height 0.25s ease-in;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: 8px;
  margin-top: 3px;
  transition: all 0.2s;
}
.menu-item:hover { background: rgba(255, 255, 255, 0.05); color: white; }
.menu-icon { font-size: 16px; }
.menu-item.active { background: rgba(255, 255, 255, 0.2); color: white; font-weight: 600; }
</style>