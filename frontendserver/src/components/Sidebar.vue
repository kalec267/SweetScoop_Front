<template>
  <aside class="sidebar-container">
    <!-- 서비스 로고 영역 -->
    <div class="logo-area">
      <span class="logo-icon">🍦</span>
      <h1 class="logo-title">배스킨라빈스 관리자</h1>
    </div>

    <!-- 메뉴 리스트 영역 -->
    <nav class="menu-nav">
      
      <!-- [그룹 1] 일반 관리 -->
      <div class="menu-group" :class="{ 'is-open': openGroups.general }">
        <button class="group-header-btn" @click="toggleGroup('general')">
          <span class="group-title">📁 일반 관리</span>
          <span class="arrow-icon">▾</span>
        </button>
        <div class="group-items">
          <router-link to="/dashboard" class="menu-item" active-class="active">
            <span class="menu-icon">📊</span> 대시보드
          </router-link>
          <router-link to="/order-request" class="menu-item" active-class="active">
            <span class="menu-icon">📥</span> 재고 신청
          </router-link>
          <router-link to="/inventory" class="menu-item" active-class="active">
            <span class="menu-icon">📦</span> 재고 현황
          </router-link>
          <router-link to="/delivery" class="menu-item" active-class="active">
            <span class="menu-icon">🚚</span> 배송 관리
          </router-link>
          <router-link to="/branch" class="menu-item" active-class="active">
            <span class="menu-icon">🏪</span> 분점 관리
          </router-link>
        </div>
      </div>

      <!-- [그룹 2] 본사 전용 설정 -->
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

      <!-- [그룹 3] 분석 -->
      <div class="menu-group" :class="{ 'is-open': openGroups.analysis }">
        <button class="group-header-btn" @click="toggleGroup('analysis')">
          <span class="group-title">📈 분석 및 통계</span>
          <span class="arrow-icon">▾</span>
        </button>
        <div class="group-items">
          <router-link to="/analytics" class="menu-item" active-class="active">
            <span class="menu-icon">📊</span> 통계 / 리포트
          </router-link>
        </div>
      </div>

    </nav>
  </aside>
</template>

<script setup>
import { ref } from 'vue';

// 각 대분류 그룹의 아코디언 상태값 (true: 열림, false: 닫힘)
const openGroups = ref({
  general: true,   // 기본적으로 일반 관리는 열어둠
  hqOnly: false,
  analysis: false
});

// 그룹 토글 핸들러
const toggleGroup = (groupKey) => {
  openGroups.value[groupKey] = !openGroups.value[groupKey];
};
</script>

<style scoped>
/* 사이드바 기본 컨테이너 */
.sidebar-container {
  width: 260px;
  height: 100vh;
  background-color: #d13b7d; /* 배스킨라빈스 핑크 테마 */
  color: white;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

/* 상단 로고 디자인 */
.logo-area {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.logo-icon {
  font-size: 24px;
}
.logo-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

/* 네비게이션 감싸개 */
.menu-nav {
  flex: 1;
  padding: 15px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

/* 메뉴 대그룹 감싸개 */
.menu-group {
  display: flex;
  flex-direction: column;
}

/* 대그룹 헤더 버튼 (아코디언 트리거) */
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
  text-align: left;
  border-radius: 8px;
  transition: all 0.2s ease;
}
.group-header-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

/* 아코디언 화살표 회전 애니메이션 */
.arrow-icon {
  font-size: 12px;
  transition: transform 0.2s ease;
}
.is-open .arrow-icon {
  transform: rotate(180deg); /* 열릴 때 화살표 180도 회전 */
}

/* 세부 하위 메뉴 박스 기본 상태 (숨김) */
.group-items {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s cubic-bezier(0, 1, 0, 1); /* 열림/닫힘 슬라이드 애니메이션 */
  display: flex;
  flex-direction: column;
  padding-left: 8px;
}

/* 열렸을 때 세부 하위 메뉴 높이 활성화 */
.is-open .group-items {
  max-height: 500px; /* 넉넉한 값 지정 */
  transition: max-height 0.25s ease-in;
}

/* 각각의 세부 하위 라우터 메뉴 항목 */
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
.menu-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}
.menu-icon {
  font-size: 16px;
}

/* 라우터 활성화 시 디자인 변경 스펙 */
.menu-item.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
}
</style>