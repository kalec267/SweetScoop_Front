```vue
<template>
  <aside class="sidebar-container">
    <!-- 로고 -->
    <div
      class="logo-area"
      @click="goToHome"
    >
      <span class="logo-icon">🍦</span>

      <h1 class="logo-title">
        Sweet Scoop
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
          :class="{
            'is-open': openGroups.general,
          }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('general')"
          >
            <span class="group-title">
              📁 일반 관리
            </span>

            <span class="arrow-icon">
              ▾
            </span>
          </button>

          <div class="group-items">
            <router-link
              to="/dashboard"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                📊
              </span>

              대시보드
            </router-link>

            <router-link
              to="/delivery"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                🚚
              </span>

              배송 관리
            </router-link>

            <router-link
              to="/admin/branches"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                🏪
              </span>

              분점 관리
            </router-link>
          </div>
        </div>

        <!-- 본사 물류 및 발주 관리 -->
        <div
          class="menu-group"
          :class="{
            'is-open': openGroups.hqInventory,
          }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('hqInventory')"
          >
            <span class="group-title">
              📦 본사 물류 관리
            </span>

            <span class="arrow-icon">
              ▾
            </span>
          </button>

          <div class="group-items">
            <router-link
              to="/items"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                📋
              </span>

              물품 관리
            </router-link>

            <router-link
              to="/inventory/hq-orders"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                🏢
              </span>

              본사 발주 승인
            </router-link>
          </div>
        </div>

        <!-- 본사 전용 설정 -->
        <div
          class="menu-group"
          :class="{
            'is-open': openGroups.hqOnly,
          }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('hqOnly')"
          >
            <span class="group-title">
              ⚙️ 본사 전용 설정
            </span>

            <span class="arrow-icon">
              ▾
            </span>
          </button>

          <div class="group-items">
            <router-link
              to="/menu-management"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                🍒
              </span>

              메뉴 관리
            </router-link>

            <router-link
              to="/event-management"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                🎁
              </span>

              이벤트 / 배너 관리
            </router-link>

            <router-link
              to="/inquiries"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                💬
              </span>

              지점문의 답변
            </router-link>
          </div>
        </div>

        <!-- 본사 분석 -->
        <div
          class="menu-group"
          :class="{
            'is-open': openGroups.hqAnalysis,
          }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('hqAnalysis')"
          >
            <span class="group-title">
              📈 본사 통계 및 분석
            </span>

            <span class="arrow-icon">
              ▾
            </span>
          </button>

          <div class="group-items">
            <router-link
              to="/sales"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                📊
              </span>

              전체 매출 통계
            </router-link>

            <router-link
              to="/analytics"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                📉
              </span>

              상세 매출 분석
            </router-link>
          </div>
        </div>
      </template>

      <!-- ========================================
           지점 관리자 전용 메뉴
      ========================================= -->
      <template v-else-if="userRole === 'BRANCH'">
        <!-- 지점 운영 관리 -->
        <div
          class="menu-group"
          :class="{
            'is-open': openGroups.branchOps,
          }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('branchOps')"
          >
            <span class="group-title">
              🏪 지점 운영 관리
            </span>

            <span class="arrow-icon">
              ▾
            </span>
          </button>

          <div class="group-items">
            <router-link
              to="/branch/dashboard"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                🏠
              </span>

              지점 홈
            </router-link>

            <router-link
              to="/branch/kiosk-control"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                🖥️
              </span>

              키오스크 활성화
            </router-link>

            <router-link
              to="/branch/orders-history"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                🧾
              </span>

              주문 취소 / 영수증
            </router-link>
          </div>
        </div>

        <!-- 지점 재고 관리 -->
        <div
          class="menu-group"
          :class="{
            'is-open': openGroups.branchInventory,
          }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('branchInventory')"
          >
            <span class="group-title">
              📦 지점 재고 통제
            </span>

            <span class="arrow-icon">
              ▾
            </span>
          </button>

          <div class="group-items">
            <router-link
              to="/inventory"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                🍦
              </span>

              지점 재고 관리
            </router-link>

            <router-link
              to="/order-request"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                📨
              </span>

              발주 및 자동발주
            </router-link>
          </div>
        </div>

        <!-- 지점 분석 -->
        <div
          class="menu-group"
          :class="{
            'is-open': openGroups.branchAnalysis,
          }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('branchAnalysis')"
          >
            <span class="group-title">
              📈 지점 통계 및 분석
            </span>

            <span class="arrow-icon">
              ▾
            </span>
          </button>

          <div class="group-items">
            <router-link
              to="/sales"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                📊
              </span>

              지점 매출 통계
            </router-link>

            <router-link
              to="/analytics"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                📉
              </span>

              상세 매출 분석
            </router-link>
          </div>
        </div>

        <!-- 지점 문의 -->
        <div
          class="menu-group"
          :class="{
            'is-open': openGroups.branchCommunication,
          }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="toggleGroup('branchCommunication')"
          >
            <span class="group-title">
              💬 지점 문의
            </span>

            <span class="arrow-icon">
              ▾
            </span>
          </button>

          <div class="group-items">
            <router-link
              to="/branch/inquiries"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                💬
              </span>

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
import {
  onMounted,
  ref,
} from "vue";
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
 * 사이드바 메뉴 그룹을 열거나 닫습니다.
 */
const toggleGroup = (groupKey) => {
  const groupExists =
    Object.prototype.hasOwnProperty.call(
      openGroups.value,
      groupKey
    );

  if (!groupExists) {
    return;
  }

  openGroups.value[groupKey] =
    !openGroups.value[groupKey];
};

/**
 * 로고 클릭 시 권한에 맞는 기본 화면으로 이동합니다.
 */
const goToHome = async () => {
  if (userRole.value === "HQ") {
    await router.push({
      name: "Dashboard",
    });

    return;
  }

  if (userRole.value === "BRANCH") {
    await router.push({
      name: "BranchDashboard",
    });

    return;
  }

  await router.push({
    name: "Login",
  });
};

/**
 * 로그인할 때 localStorage에 저장한 권한을 가져옵니다.
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
  margin: 0;
  padding: 0;

  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  overflow-x: hidden;

  color: white;
  background-color: #d13b7d;
  box-sizing: border-box;
}

/* 로고 영역 */
.logo-area {
  padding: 24px 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  border-bottom: 1px solid
    rgba(255, 255, 255, 0.1);

  cursor: pointer;
  user-select: none;
}

.logo-area:hover {
  background: rgba(255, 255, 255, 0.06);
}

.logo-icon {
  font-size: 24px;
}

.logo-title {
  margin: 0;

  font-size: 18px;
  font-weight: 700;
}

/* 전체 메뉴 영역 */
.menu-nav {
  flex: 1;
  min-height: 0;
  padding: 15px 12px;

  display: flex;
  flex-direction: column;
  gap: 12px;

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
  justify-content: space-between;
  align-items: center;

  border: none;
  border-radius: 8px;
  background: transparent;

  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 700;
  text-align: left;

  cursor: pointer;
}

.group-header-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.08);
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
  padding-left: 8px;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  transition:
    max-height 0.25s
    cubic-bezier(0, 1, 0, 1);
}

.is-open .group-items {
  max-height: 500px;

  transition:
    max-height 0.25s ease-in;
}

/* 메뉴 링크 */
.menu-item {
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  margin-top: 3px;

  display: flex;
  align-items: center;
  gap: 12px;

  border-radius: 8px;
  box-sizing: border-box;

  color: rgba(255, 255, 255, 0.8);
  font-size: 13.5px;
  text-decoration: none;

  transition:
    color 0.2s,
    background-color 0.2s;
}

.menu-item:hover {
  color: white;
  background: rgba(255, 255, 255, 0.08);
}

.menu-icon {
  width: 18px;

  flex-shrink: 0;

  font-size: 16px;
  text-align: center;
}

/* 현재 선택된 메뉴 */
.menu-item.active {
  color: white;
  background: rgba(255, 255, 255, 0.2);
  font-weight: 600;
}

/* 권한이 없을 때 */
.role-empty {
  padding: 20px 12px;

  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  text-align: center;
}
</style>
```
