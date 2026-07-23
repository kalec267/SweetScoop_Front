<template>
  <header class="main-header">
    <div class="header-right">
      
      <!-- 알림 벨 버튼 및 알림 레이어 -->
      <div class="notification-container">
        <button class="icon-btn" @click="toggleNotification">
          <span class="icon">🔔</span>
          <span v-if="hasNewNotification" class="badge-dot"></span>
        </button>

        <!-- 실시간 알림 드롭다운 박스 -->
        <div v-if="showNotificationBox" class="notification-box" @click.stop>
          <div class="noti-header">
            <span>실시간 주문 알림</span>
            <span style="font-size: 11px; color: #94a3b8; font-weight: normal;">클릭하면 삭제됩니다</span>
          </div>
          <div class="noti-body">
            <div 
              v-for="(noti, idx) in notifications" 
              :key="idx" 
              class="noti-item clickable"
              @click="removeNotification(idx)"
              title="클릭하여 알림 지우기"
            >
              {{ noti }}
            </div>
            <div v-if="notifications.length === 0" class="noti-empty">
              새로운 알림이 없습니다.
            </div>
          </div>
        </div>
      </div>
      
      <!-- 관리자 드롭다운 컨테이너 -->
      <div class="profile-dropdown-container">
        <button class="profile-btn" @click="toggleDropdown">
          <span class="avatar-circle">관</span>
          <span class="admin-name">
            {{ userRole === 'HQ' ? '총 관리자 ▾' : '분점 관리자 ▾' }}
          </span>
        </button>

        <div v-if="isDropdownOpen" class="admin-dropdown-menu">
          <div class="dropdown-header">
            {{ userRole === 'HQ' ? '본점 · 슈퍼관리자님' : '스윗스쿱 강남역점님' }}
          </div>
          <hr />

          <template v-if="userRole === 'BRANCH'">
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
import { db } from '@/api/firebase';
import { collection, query, onSnapshot } from "firebase/firestore";

const router = useRouter();

const notifications = ref([]);
const showNotificationBox = ref(false);
const hasNewNotification = ref(false);

const isDropdownOpen = ref(false);
const userRole = ref('');

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

const removeNotification = (idx) => {
  notifications.value.splice(idx, 1);
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

// 💡 띵동 차임벨 재생 함수
const playDingDongSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (frequency, startTime, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + startTime);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + startTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(audioCtx.currentTime + startTime);
      osc.stop(audioCtx.currentTime + startTime + duration);
    };

    playTone(659.25, 0, 0.4);
    playTone(523.25, 0.35, 0.6);
  } catch (error) {
    console.log("오디오 재생 중 오류가 발생했습니다.", error);
  }
};

let unsubscribeOrders = null;

onMounted(() => {
  window.addEventListener('click', closeAllPopups);
  userRole.value = localStorage.getItem('userRole') || 'HQ';

  // 💡 최초 로딩 시 기존 데이터로 인한 중복 소리 방지 플래그
  let isInitialLoad = true;

  const ordersQuery = query(collection(db, "orders"));
  unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
    // 첫 스냅샷(기존 데이터 로딩)은 소리 안 나게 통과시킴
    if (isInitialLoad) {
      isInitialLoad = false;
      return;
    }

    // 이후부터 실제로 새로 추가되는 주문에만 반응
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const newOrder = change.doc.data();

        // 1. 진짜 새 주문일 때만 띵동 소리 재생
        playDingDongSound();

        // 2. 헤더 알림 리스트에 추가
        const message = `[새 주문] 주문번호 #${newOrder.orderNo || '알수없음'} (웨이팅 ${newOrder.waitingNo || '-'}번) 접수`;
        notifications.value.unshift(message);

        // 3. 벨 아이콘 빨간 점 활성화
        hasNewNotification.value = true;
      }
    });
  });
});

onUnmounted(() => {
  window.removeEventListener('click', closeAllPopups);
  if (unsubscribeOrders) unsubscribeOrders();
});
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
  display: flex;
  justify-content: space-between;
  align-items: center;
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
.noti-item.clickable {
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.noti-item.clickable:hover {
  background-color: #fdf2f8;
  color: #d13b7d;
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