<template>
  <header class="main-header">
    <div class="header-right">
      <!-- 알림 벨 -->
      <div class="notification-container">
        <button
          type="button"
          class="icon-btn"
          @click="toggleNotification"
        >
          <span class="icon">🔔</span>

          <span
            v-if="hasNewNotification"
            class="badge-dot"
          ></span>
        </button>

        <!-- 알림 드롭다운 -->
        <div
          v-if="showNotificationBox"
          class="notification-box"
          @click.stop
        >
          <div class="noti-header">
            <span>실시간 알림</span>

            <span class="noti-guide">
              클릭하면 삭제됩니다
            </span>
          </div>

          <div class="noti-body">
            <div
              v-for="(noti, index) in notifications"
              :key="noti.id"
              class="noti-item clickable"
              title="클릭하여 알림 지우기"
              @click="removeNotification(index)"
            >
              <span class="noti-type">
                {{ noti.type }}
              </span>

              <p>
                {{ noti.message }}
              </p>

              <small>
                {{ noti.receivedAt }}
              </small>
            </div>

            <div
              v-if="notifications.length === 0"
              class="noti-empty"
            >
              새로운 알림이 없습니다.
            </div>
          </div>
        </div>
      </div>

      <!-- 관리자 프로필 -->
      <div class="profile-dropdown-container">
        <button
          type="button"
          class="profile-btn"
          @click="toggleDropdown"
        >
          <span class="avatar-circle">관</span>

          <span class="admin-name">
            {{ userRole === "HQ"
              ? "총 관리자 ▾"
              : "분점 관리자 ▾"
            }}
          </span>
        </button>

        <!-- 관리자 메뉴 -->
        <div
          v-if="isDropdownOpen"
          class="admin-dropdown-menu"
          @click.stop
        >
          <div class="dropdown-header">
            {{
              userRole === "HQ"
                ? "본점 · 슈퍼관리자님"
                : `${username || "분점 관리자"}님`
            }}
          </div>

          <hr />

          <!-- 본점 관리자 메뉴 -->
          <template v-if="userRole === 'HQ'">
            <router-link
              to="/menu-management"
              class="dropdown-item"
              @click="closeDropdown"
            >
              🍒 맛 관리
            </router-link>

            <router-link
              to="/event-management"
              class="dropdown-item"
              @click="closeDropdown"
            >
              🎁 이벤트 / 배너 관리
            </router-link>

            <router-link
              to="/inquiries"
              class="dropdown-item"
              @click="closeDropdown"
            >
              💬 지점문의 답변
            </router-link>
          </template>

          <!-- 분점 관리자 메뉴 -->
          <template v-else>
            <router-link
              to="/branch/dashboard"
              class="dropdown-item"
              @click="closeDropdown"
            >
              🏠 지점 홈
            </router-link>
          </template>

          <hr />

          <button
            type="button"
            class="dropdown-item logout-btn"
            @click="handleLogout"
          >
            🔒 로그아웃
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import {
  onMounted,
  onUnmounted,
  ref
} from "vue";

import { useRouter } from "vue-router";

import {
  collection,
  onSnapshot,
  query
} from "firebase/firestore";

import { db } from "@/api/firebase";

const router = useRouter();

/*
 * 관리자 정보
 */
const userRole = ref("");
const username = ref("");

/*
 * 알림 상태
 */
const notifications = ref([]);
const showNotificationBox = ref(false);
const hasNewNotification = ref(false);

/*
 * 관리자 메뉴 상태
 */
const isDropdownOpen = ref(false);

/*
 * Firebase 구독 해제 함수
 */
let unsubscribeOrders = null;

/*
 * SSE 연결 객체
 */
let sseSource = null;

/*
 * 알림 고유 ID 생성
 */
const createNotificationId = () => {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
};

/*
 * 현재 시각 표시
 */
const getCurrentTime = () => {
  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }
  ).format(new Date());
};

/*
 * 공통 알림 추가 함수
 */
const addNotification = (
  message,
  type = "알림"
) => {
  notifications.value.unshift({
    id: createNotificationId(),
    type,
    message,
    receivedAt: getCurrentTime()
  });

  /*
   * 알림 개수 제한
   */
  if (notifications.value.length > 30) {
    notifications.value =
      notifications.value.slice(0, 30);
  }

  hasNewNotification.value = true;
};

/*
 * 관리자 메뉴 토글
 */
const toggleDropdown = (event) => {
  event.stopPropagation();

  isDropdownOpen.value =
    !isDropdownOpen.value;

  if (isDropdownOpen.value) {
    showNotificationBox.value = false;
  }
};

/*
 * 관리자 메뉴 닫기
 */
const closeDropdown = () => {
  isDropdownOpen.value = false;
};

/*
 * 알림창 토글
 */
const toggleNotification = (event) => {
  event.stopPropagation();

  showNotificationBox.value =
    !showNotificationBox.value;

  if (showNotificationBox.value) {
    isDropdownOpen.value = false;
    hasNewNotification.value = false;
  }
};

/*
 * 알림 하나 삭제
 */
const removeNotification = (index) => {
  notifications.value.splice(index, 1);

  if (notifications.value.length === 0) {
    hasNewNotification.value = false;
  }
};

/*
 * 외부 클릭 시 팝업 닫기
 */
const closeAllPopups = () => {
  isDropdownOpen.value = false;
  showNotificationBox.value = false;
};

/*
 * 로그아웃
 */
const handleLogout = () => {
  const confirmed =
    window.confirm(
      "로그아웃 하시겠습니까?"
    );

  if (!confirmed) {
    return;
  }

  isDropdownOpen.value = false;

  localStorage.removeItem("userRole");
  localStorage.removeItem("username");
  localStorage.removeItem("branchId");
  localStorage.removeItem("adminId");
  localStorage.removeItem("accessToken");

  router.push("/login");
};

/*
 * 띵동 알림음
 */
const playDingDongSound = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const audioContext =
      new AudioContextClass();

    const playTone = (
      frequency,
      startTime,
      duration
    ) => {
      const oscillator =
        audioContext.createOscillator();

      const gain =
        audioContext.createGain();

      oscillator.type = "sine";

      oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime +
          startTime
      );

      gain.gain.setValueAtTime(
        0.3,
        audioContext.currentTime +
          startTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime +
          startTime +
          duration
      );

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start(
        audioContext.currentTime +
          startTime
      );

      oscillator.stop(
        audioContext.currentTime +
          startTime +
          duration
      );
    };

    playTone(659.25, 0, 0.4);
    playTone(523.25, 0.35, 0.6);
  } catch (error) {
    console.error(
      "알림음 재생 실패:",
      error
    );
  }
};

/*
 * Firebase 주문 알림 연결
 */
const connectFirebaseOrders = () => {
  let isInitialLoad = true;

  const ordersQuery = query(
    collection(db, "orders")
  );

  unsubscribeOrders = onSnapshot(
    ordersQuery,

    (snapshot) => {
      /*
       * 최초 기존 데이터 로딩은 알림 제외
       */
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      snapshot
        .docChanges()
        .forEach((change) => {
          if (change.type !== "added") {
            return;
          }

          const newOrder =
            change.doc.data();

          const orderNo =
            newOrder.orderNo ||
            newOrder.orderId ||
            "알 수 없음";

          const waitingNo =
            newOrder.waitingNo ?? "-";

          const message =
            `[새 주문] 주문번호 #${orderNo} ` +
            `(웨이팅 ${waitingNo}번) 접수`;

          playDingDongSound();

          addNotification(
            message,
            "Firebase 주문"
          );
        });
    },

    (error) => {
      console.error(
        "Firebase 주문 알림 연결 실패:",
        error
      );
    }
  );
};

/*
 * SSE 알림 연결
 */
const connectSse = () => {
  /*
   * 로그인 시 저장한 관리자 ID 사용
   */
  const savedAdminId =
    localStorage.getItem("adminId");

  /*
   * 관리자 ID가 없으면 역할에 따라 기본값 사용
   */
  const adminId =
    savedAdminId ||
    (
      userRole.value === "HQ"
        ? "main_hq"
        : username.value
    );

  if (!adminId) {
    console.warn(
      "SSE 연결에 사용할 관리자 ID가 없습니다."
    );

    return;
  }

  const url =
    `/api/admin/sse/connect` +
    `?adminId=${encodeURIComponent(adminId)}`;

  sseSource = new EventSource(url);

  /*
   * 백엔드에서 event: notification으로 전송
   */
  sseSource.addEventListener(
    "notification",
    (event) => {
      addNotification(
        event.data,
        "관리자 알림"
      );

      playDingDongSound();
    }
  );

  /*
   * 백엔드에서 기본 message 이벤트로 전송하는 경우
   */
  sseSource.onmessage = (event) => {
    if (!event.data) {
      return;
    }

    addNotification(
      event.data,
      "실시간 알림"
    );
  };

  sseSource.onopen = () => {
    console.log(
      `SSE 연결 성공: ${adminId}`
    );
  };

  sseSource.onerror = (error) => {
    console.error(
      "SSE 연결 오류:",
      error
    );
  };
};

onMounted(() => {
  window.addEventListener(
    "click",
    closeAllPopups
  );

  userRole.value =
    localStorage.getItem("userRole") ||
    "HQ";

  username.value =
    localStorage.getItem("username") ||
    "";

  connectFirebaseOrders();
  connectSse();
});

onUnmounted(() => {
  window.removeEventListener(
    "click",
    closeAllPopups
  );

  if (unsubscribeOrders) {
    unsubscribeOrders();
    unsubscribeOrders = null;
  }

  if (sseSource) {
    sseSource.close();
    sseSource = null;
  }
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

/* 알림 버튼 */

.notification-container {
  position: relative;
}

.icon-btn {
  width: 36px;
  height: 36px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.2s;
}

.icon-btn:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

.badge-dot {
  width: 8px;
  height: 8px;
  position: absolute;
  top: 2px;
  right: 2px;
  border: 1.5px solid white;
  border-radius: 50%;
  background: #ff4081;
}

/* 알림 팝업 */

.notification-box {
  width: 320px;
  max-height: 380px;
  position: absolute;
  top: 45px;
  right: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  box-shadow:
    0 10px 25px
    rgba(0, 0, 0, 0.12);
}

.noti-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
  font-size: 14px;
  font-weight: 600;
}

.noti-guide {
  color: #94a3b8;
  font-size: 10px;
  font-weight: 400;
}

.noti-body {
  max-height: 320px;
  overflow-y: auto;
}

.noti-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #475569;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.noti-item:last-child {
  border-bottom: 0;
}

.noti-item.clickable {
  cursor: pointer;
}

.noti-item.clickable:hover {
  background: #fdf2f8;
  color: #d13b7d;
}

.noti-type {
  display: inline-flex;
  margin-bottom: 5px;
  padding: 3px 7px;
  border-radius: 10px;
  background: #f3e8ff;
  color: #6f42c1;
  font-size: 9px;
  font-weight: 700;
}

.noti-item p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

.noti-item small {
  display: block;
  margin-top: 5px;
  color: #94a3b8;
  font-size: 10px;
}

.noti-empty {
  padding: 30px 0;
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
}

/* 관리자 프로필 */

.profile-dropdown-container {
  position: relative;
}

.profile-btn {
  padding: 6px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: background 0.2s;
}

.profile-btn:hover {
  background: #f8fafc;
}

.avatar-circle {
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background: #6f42c1;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.admin-name {
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}

/* 관리자 드롭다운 */

.admin-dropdown-menu {
  width: 210px;
  position: absolute;
  top: 45px;
  right: 0;
  z-index: 100;
  padding: 6px 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  box-shadow:
    0 10px 25px
    rgba(0, 0, 0, 0.12);
}

.dropdown-header {
  padding: 10px 16px;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.dropdown-item {
  width: 100%;
  padding: 10px 16px;
  display: block;
  box-sizing: border-box;
  border: 0;
  background: none;
  color: #334155;
  font-size: 13px;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f8fafc;
  color: #6f42c1;
}

.logout-btn {
  color: #dc2626;
  font-weight: 600;
}

hr {
  margin: 4px 0;
  border: 0;
  border-top: 1px solid #f1f5f9;
}

@media (max-width: 600px) {
  .main-header {
    padding: 0 14px;
  }

  .header-right {
    gap: 10px;
  }

  .notification-box {
    width: min(
      320px,
      calc(100vw - 28px)
    );
    right: -120px;
  }

  .admin-dropdown-menu {
    width: 190px;
  }
}
</style>