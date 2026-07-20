<template>
  <aside class="sidebar-container">
    <!-- 로고 -->
    <div
      class="logo-area"
      @click="goToHome"
    >
      <span class="logo-icon">🍨</span>

      <h1 class="logo-title">
        SweetScoop 관리자
      </h1>
    </div>

    <nav class="menu-nav">
      <!-- ========================================
          본사 관리자 전용 메뉴
      ========================================= -->
      <template v-if="userRole === 'HQ'">
        <!-- 일반 관리 -->
        <div
          class="menu-group"
          :class="{ 'is-open': openGroups.general }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('general')"
          >
            <span class="group-title">
              📁 일반 관리
            </span>

            <span class="arrow-icon">▾</span>
          </button>

          <div class="group-items">
            <router-link
              to="/dashboard"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">📊</span>
              대시보드
            </router-link>

            <router-link
              to="/delivery"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">🚚</span>
              배송 관리
            </router-link>

            <router-link
              to="/admin/branches"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">🏪</span>
              분점 관리
            </router-link>
          </div>
        </div>

        <!-- 본사 물류 관리 -->
        <div
          class="menu-group"
          :class="{ 'is-open': openGroups.hqInventory }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('hqInventory')"
          >
            <span class="group-title">
              📦 본사 물류 관리
            </span>

            <span class="arrow-icon">▾</span>
          </button>

          <div class="group-items">
            <router-link
              to="/items"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">📋</span>
              물품 관리
            </router-link>

            <router-link
              to="/inventory/hq-orders"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">🏢</span>
              본사 발주 승인
            </router-link>
          </div>
        </div>

        <!-- 본사 전용 설정 -->
        <div
          class="menu-group"
          :class="{ 'is-open': openGroups.hqOnly }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('hqOnly')"
          >
            <span class="group-title">
              ⚙️ 본사 전용 설정
            </span>

            <span class="arrow-icon">▾</span>
          </button>

          <div class="group-items">
            <router-link
              to="/menu-management"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">🍒</span>
              메뉴 관리
            </router-link>

            <router-link
              to="/event-management"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">🎁</span>
              이벤트 / 배너 관리
            </router-link>

            <router-link
              to="/inquiries"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">💬</span>
              문의사항
            </router-link>
            <router-link
              to="/notice"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">💬</span>
              공지사항
            </router-link>
            
          </div>
        </div>

        <!-- 본사 통계 -->
        <div
          class="menu-group"
          :class="{ 'is-open': openGroups.hqAnalysis }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('hqAnalysis')"
          >
            <span class="group-title">
              📈 본사 통계 및 분석
            </span>

            <span class="arrow-icon">▾</span>
          </button>

          <div class="group-items">
            <router-link
              to="/sales"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">📊</span>
              전체 매출 통계
            </router-link>

          </div>
        </div>
      </template>

      <!-- ========================================
           지점 관리자 전용 메뉴
      ========================================= -->
      <template v-else-if="userRole === 'BRANCH'">
        <!-- 지점 운영 -->
        <div
          class="menu-group"
          :class="{ 'is-open': openGroups.branchOps }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('branchOps')"
          >
            <span class="group-title">
              🏪 지점 운영 관리
            </span>

            <span class="arrow-icon">▾</span>
          </button>

          <div class="group-items">
            <router-link
              to="/branch/dashboard"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">🏠</span>
              지점 홈
            </router-link>

            <router-link
              to="/branch/kiosk-control"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">🖥️</span>
              키오스크 활성화
            </router-link>

            <router-link
              to="/branch/orders-history"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">🧾</span>
              주문 취소 / 영수증
            </router-link>
          </div>
        </div>

        <!-- 지점 재고 -->
        <div
          class="menu-group"
          :class="{ 'is-open': openGroups.branchInventory }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('branchInventory')"
          >
            <span class="group-title">
              📦 지점 재고 통제
            </span>

            <span class="arrow-icon">▾</span>
          </button>

          <div class="group-items">
            <router-link
              to="/inventory"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">🍦</span>
              지점 재고 관리
            </router-link>

            <router-link
              to="/order-request"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">📨</span>
              발주 및 자동발주
            </router-link>
          </div>
        </div>

        <!-- 지점 분석 -->
        <div
          class="menu-group"
          :class="{ 'is-open': openGroups.branchAnalysis }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('branchAnalysis')"
          >
            <span class="group-title">
              📈 지점 통계 및 분석
            </span>

            <span class="arrow-icon">▾</span>
          </button>

          <div class="group-items">
            <router-link
              to="/sales"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">📊</span>
              지점 매출 통계
            </router-link>

          </div>
        </div>

        <!-- 지점 문의 -->
        <div
          class="menu-group"
          :class="{ 'is-open': openGroups.branchCommunication }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('branchCommunication')"
          >
            <span class="group-title">
              💬 지점 문의
            </span>

            <span class="arrow-icon">▾</span>
          </button>

          <div class="group-items">
            <router-link
              to="/branch/inquiries"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">💬</span>
              문의사항 관리
            </router-link>
          </div>
        </div>
      </template>

      <!-- 권한 정보가 없는 경우 -->
      <div
        v-else
        class="role-empty"
      >
        로그인 정보가 없습니다.
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const userRole = ref("");

const openGroups = ref({
  general: true,
  hqInventory: true,
  hqOnly: true,
  hqAnalysis: false,

  branchOps: true,
  branchInventory: true,
  branchAnalysis: false,
  branchCommunication: false,
});

/**
 * 메뉴 그룹 열기/닫기
 */
const toggleGroup = (groupKey) => {
  if (
    !Object.prototype.hasOwnProperty.call(
      openGroups.value,
      groupKey
    )
  ) {
    return;
  }

  openGroups.value[groupKey] =
    !openGroups.value[groupKey];
};

/**
 * 로고 클릭 시 권한별 홈으로 이동
 */
const goToHome = async () => {
  if (userRole.value === "HQ") {
    await router.push("/dashboard");
    return;
  }

  if (userRole.value === "BRANCH") {
    await router.push("/branch/dashboard");
    return;
  }

  await router.push("/login");
};

/**
 * 로그인 권한 불러오기
 */
onMounted(() => {
  userRole.value =
    localStorage.getItem("userRole") || "";
});
</script>

<style scoped>
.sidebar-container {
  width: 260px;
  min-width: 260px;
  height: 100vh;

  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  overflow: hidden;

  color: #222;
  background: #ffffff;
  border-right: 1px solid #ececec;
  box-sizing: border-box;
}

/* 로고 영역 */
.logo-area {
  min-height: 76px;
  padding: 18px 20px;

  display: flex;
  align-items: center;
  gap: 12px;

  color: #ffffff;
  background:
    linear-gradient(
      135deg,
      #d65b8e 0%,
      #9b63cb 50%,
      #6b73f1 100%
    );

  cursor: pointer;
  user-select: none;
}

.logo-icon {
  font-size: 27px;
}

.logo-title {
  margin: 0;

  color: #ffffff;
  font-size: 19px;
  font-weight: 800;
  white-space: nowrap;
}

/* 메뉴 영역 */
.menu-nav {
  flex: 1;
  min-height: 0;
  padding: 16px 12px 24px;

  display: flex;
  flex-direction: column;
  gap: 10px;

  overflow-y: auto;
  overflow-x: hidden;
}

/* 메뉴 그룹 */
.menu-group {
  display: flex;
  flex-direction: column;
}

.group-header-btn {
  width: 100%;
  padding: 12px 10px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  border: 0;
  border-radius: 9px;
  background: transparent;

  color: #4e4e58;
  font-size: 14px;
  font-weight: 800;
  text-align: left;

  cursor: pointer;

  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.group-header-btn:hover {
  color: #b93479;
  background: #fff1f7;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 7px;
}

/* 화살표 */
.arrow-icon {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.is-open .arrow-icon {
  transform: rotate(180deg);
}

/* 접히는 메뉴 영역 */
.group-items {
  max-height: 0;
  padding-left: 7px;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  transition: max-height 0.25s ease-out;
}

.is-open .group-items {
  max-height: 500px;
  margin-top: 3px;

  transition: max-height 0.3s ease-in;
}

/* 메뉴 링크 */
.menu-item {
  width: 100%;
  min-height: 42px;
  padding: 10px 13px;
  margin-top: 3px;

  display: flex;
  align-items: center;
  gap: 11px;

  border-radius: 9px;
  box-sizing: border-box;

  color: #33333b;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;

  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.menu-item:hover {
  color: #be347b;
  background: #fff0f7;
  transform: translateX(2px);
}

.menu-icon {
  width: 20px;

  flex-shrink: 0;

  font-size: 16px;
  text-align: center;
}

/* 현재 선택 메뉴 */
.menu-item.active {
  color: #a92568;
  background: #ffe2f0;
  font-weight: 800;
}

/* 권한 없음 */
.role-empty {
  margin: 12px 4px;
  padding: 18px 12px;

  border-radius: 9px;
  background: #f7f7f9;

  color: #777780;
  font-size: 13px;
  text-align: center;
}

/* 스크롤바 */
.menu-nav::-webkit-scrollbar {
  width: 6px;
}

.menu-nav::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background: #d8d8dd;
}

.menu-nav::-webkit-scrollbar-track {
  background: transparent;
}
</style>
