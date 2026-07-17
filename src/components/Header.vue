<template>
  <header class="main-header">
    <div class="header-right">
      
      <!-- 1. 알림 벨 버튼 및 알림 레이어 -->
      <div class="notification-container">
        <button class="icon-btn" @click="toggleNotification">
          <span class="icon">🔔</span>
          <span v-if="hasNewNotification" class="badge-dot"></span>
        </button>

        <!-- 실시간 알림 드롭다운 박스 -->
        <div v-if="showNotificationBox" class="notification-box">
          <div class="noti-header">실시간 알림</div>
          <div class="noti-body">
            <div v-for="(noti, idx) in notifications" :key="idx" class="noti-item">
              {{ noti }}
            </div>
            <div v-if="notifications.length === 0" class="noti-empty">
              새로운 알림이 없습니다.
            </div>
          </div>
        </div>
      </div>
      
      <!-- 2. 관리자 드롭다운 컨테이너 -->
      <div class="profile-dropdown-container">
        <button class="profile-btn" @click="toggleDropdown">
          <span class="avatar-circle">관</span>
          <!-- 💡 권한에 따라 노출되는 이름 변경 -->
          <span class="admin-name">
            {{ userRole === 'HQ' ? '총 관리자 ▾' : '분점 관리자 ▾' }}
          </span>
        </button>

        <!-- 드롭다운 리스트 박스 -->
        <div v-if="isDropdownOpen" class="dropdown-menu">
          <!-- 💡 권한에 따라 드롭다운 헤더 텍스트 분기 -->
          <div class="dropdown-header">
            {{ userRole === 'HQ' ? '본점 · 슈퍼관리자님' : '스윗스쿱 강남역점님' }}
          </div>
          <hr />

          <!-- 💡 [본사 관리자 HQ 전용 바로가기 링크] -->
          <template v-if="userRole === 'HQ'">
            <router-link to="/menu-management" class="dropdown-item" @click="isDropdownOpen = false">🍒 맛 관리</router-link>
            <router-link to="/event-management" class="dropdown-item" @click="isDropdownOpen = false">🎁 이벤트 / 배너 관리</router-link>
            <router-link to="/inquiries" class="dropdown-item" @click="isDropdownOpen = false">💬 지점문의 답변</router-link>
          </template>

          <!-- 💡 [분점 관리자 BRANCH 전용 바로가기 링크] -->
          <template v-else-if="userRole === 'BRANCH'">
            <router-link to="/branch/dashboard" class="dropdown-item" @click="isDropdownOpen = false">🏠 지점 홈</router-link>
            <router-link to="/branch/inventory-status" class="dropdown-item" @click="isDropdownOpen = false">🍦 실시간 재고 관리</router-link>
            <router-link to="/branch/order-request" class="dropdown-item" @click="isDropdownOpen = false">📨 발주 신청</router-link>
          </template>

          <hr />
          <button class="dropdown-item logout-btn" @click="handleLogout">🔒 로그아웃</button>
        </div>
      </div>
      
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 알림 관련 상태
const notifications = ref([]);
const showNotificationBox = ref(false);
const hasNewNotification = ref(false);
let sseSource = null;

// 관리자 프로필 및 권한 상태
const isDropdownOpen = ref(false);
const userRole = ref(''); // 👈 로컬스토리지에서 읽어올 권한 ('HQ' 또는 'BRANCH')

const toggleDropdown = (event) => {
  event.stopPropagation();
  isDropdownOpen.value = !isDropdownOpen.value;
  if (isDropdownOpen.value) {
    showNotificationBox.value = false;
  }
};

const toggleNotification = (event) => {
  event.stopPropagation();
  showNotificationBox.value = !showNotificationBox.value;
  if (showNotificationBox.value) {
    isDropdownOpen.value = false;
    hasNewNotification.value = false;
  }
};

const closeAllPopups = () => {
  isDropdownOpen.value = false;
  showNotificationBox.value = false;
};

const handleLogout = () => {
  if (confirm("로그아웃 하시겠습니까?")) {
    isDropdownOpen.value = false;
    // 💡 로그아웃 시 로컬스토리지 데이터 완전 청소
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    router.push('/login');
  }
};

onMounted(() => {
  window.addEventListener('click', closeAllPopups);

  // 💡 로컬 스토리지에 저장된 유저 권한 획득하여 동적 바인딩 준비
  userRole.value = localStorage.getItem('userRole') || 'HQ';

  // SSE 연결 열기 (본사 어드민 로그인 계정 기준)
  sseSource = new EventSource('http://localhost:8888/api/admin/sse/connect?adminId=main_hq');

  // 실시간 알림 수신 리스너 등록
  sseSource.addEventListener('notification', (event) => {
    notifications.value.unshift(event.data);
    hasNewNotification.value = true;
  });
});

onUnmounted(() => {
  window.removeEventListener('click', closeAllPopups);
  if (sseSource) sseSource.close();
});
</script>

<style scoped>
/* 기존 스타일은 동일하게 유지됩니다 */
.main-header {
  height: 60px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 30px;
  background: transparent;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}
.notification-container {
  position: relative;
}
.icon-btn {
  background: white;
  border: 1px solid #e2e8f0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.icon-btn:hover {
  background: #f8fafc;
}
.badge-dot {
  width: 8px;
  height: 8px;
  background: #ff4081;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  right: 2px;
  border: 1.5px solid white;
}
.notification-box {
  position: absolute;
  right: 0;
  top: 45px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  width: 280px;
  max-height: 350px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.noti-header {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
}
.noti-body {
  overflow-y: auto;
  max-height: 290px;
}
.noti-item {
  padding: 12px 16px;
  font-size: 13px;
  border-bottom: 1px solid #f8fafc;
  color: #475569;
  line-height: 1.4;
}
.noti-item:last-child {
  border-bottom: none;
}
.noti-empty {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
}
.profile-dropdown-container {
  position: relative;
}
.profile-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.2s;
}
.profile-btn:hover {
  background: #f8fafc;
}
.avatar-circle {
  width: 24px;
  height: 24px;
  background: #6f42c1;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.admin-name {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}
.dropdown-menu {
  position: absolute;
  right: 0;
  top: 45px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 180px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 100;
  padding: 6px 0;
}
.dropdown-header {
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}
.dropdown-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  font-size: 13px;
  color: #334155;
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
  box-sizing: border-box;
}
.dropdown-item:hover {
  background: #f8fafc;
  color: #d13b7d; /* 배스킨라빈스 오리지널 핑크 매칭 */
}
.logout-btn {
  color: #dc2626;
  font-weight: 600;
}
hr {
  border: 0;
  border-top: 1px solid #f1f5f9;
  margin: 4px 0;
}
</style>