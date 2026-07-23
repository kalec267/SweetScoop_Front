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
          <span class="admin-name">
            {{ userRole === 'HQ' ? '총 관리자 ▾' : '분점 관리자 ▾' }}
          </span>
        </button>

        <!-- 드롭다운 리스트 박스 -->
        <div v-if="isDropdownOpen" class="admin-dropdown-menu">
          <div class="dropdown-header">
            {{ userRole === 'HQ' ? '본점 · 슈퍼관리자님' : '스윗스쿱 강남역점님' }}
          </div>
          <hr />

          <template v-if="userRole === 'HQ'">
            <!-- HQ 메뉴 -->
          </template>

          <template v-else-if="userRole === 'BRANCH'">
            <router-link to="/branch/dashboard" class="dropdown-item" @click="isDropdownOpen = false">🏠 지점 홈</router-link>
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
import axios from 'axios';

const router = useRouter();

const notifications = ref([]);
const showNotificationBox = ref(false);
const hasNewNotification = ref(false);
let sseSource = null;

const isDropdownOpen = ref(false);
const userRole = ref('');

// 💡 [수정] 백엔드 SseController 경로(/api/admin/sse/notifications)와 맞춤
const fetchPreviousNotifications = async (role) => {
  try {
    const res = await axios.get(`/api/admin/sse/notifications?role=${role}`);
    notifications.value = res.data.map(item => item.message);
  } catch (err) {
    console.error('기존 알림 조회 실패:', err);
  }
};

onMounted(async () => {
  window.addEventListener('click', closeAllPopups);

  // 로컬 스토리지 권한 읽기 (기본값 설정)
  userRole.value = localStorage.getItem('userRole') || 'HQ';
  const username = localStorage.getItem('username') || 'admin_' + Date.now();

  // 1. 기존 DB 알림 목록 불러오기 (새로고침 대응)
  await fetchPreviousNotifications(userRole.value);

  // 2. 본사 관리자("HQ")일 때만 HQ 채널로 SSE 연결
  if (userRole.value === 'HQ') {
    // 💡 [수정] 백엔드 SseController의 @RequestParam("adminId") 파라미터명과 매칭
    sseSource = new EventSource(`/api/admin/sse/connect?role=HQ&adminId=${username}`);

    sseSource.addEventListener('notification', (event) => {
      notifications.value.unshift(event.data);
      hasNewNotification.value = true;
    });
  } 
  // 3. 분점 관리자("BRANCH")일 때는 BRANCH 전용 채널로 연결 (HQ용 알림 수신 방지)
  else if (userRole.value === 'BRANCH') {
    sseSource = new EventSource(`/api/admin/sse/connect?role=BRANCH&adminId=${username}`);

    sseSource.addEventListener('notification', (event) => {
      notifications.value.unshift(event.data);
      hasNewNotification.value = true;
    });
  }
});

onUnmounted(() => {
  window.removeEventListener('click', closeAllPopups);
  if (sseSource) {
    sseSource.close();
  }
});

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
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    router.push('/login');
  }
};
</script>

<style scoped>
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
  transition: 0.2s;
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
  transition: 0.2s;
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
.admin-dropdown-menu {
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
  color: #d13b7d;
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