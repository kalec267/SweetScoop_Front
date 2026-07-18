<template>
  <aside class="sidebar-container">
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
      <!-- 본사 관리자 메뉴 -->
      <template v-if="userRole === 'HQ'">
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
              to="/items"
              class="menu-item"
              active-class="active"
            >
              <span class="menu-icon">
                📦
              </span>
              물류 관리
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
      </template>

      <!-- 분점 관리자 메뉴 -->
      <template
        v-else-if="userRole === 'BRANCH'"
      >
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
              주문 취소/영수증
            </router-link>
          </div>
        </div>

        <div
          class="menu-group"
          :class="{
            'is-open':
              openGroups.branchInventory,
          }"
        >
          <button
            type="button"
            class="group-header-btn"
            @click="
              toggleGroup('branchInventory')
            "
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
              실시간 재고 관리
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
      </template>

      <!-- 공통 메뉴 -->
      <div
        class="menu-group"
        :class="{
          'is-open': openGroups.analysis,
        }"
      >
        <button
          type="button"
          class="group-header-btn"
          @click="toggleGroup('analysis')"
        >
          <span class="group-title">
            📈 소통 및 분석
          </span>
          <span class="arrow-icon">
            ▾
          </span>
        </button>

        <div class="group-items">
          <router-link
            to="/analytics"
            class="menu-item"
            active-class="active"
          >
            <span class="menu-icon">
              📊
            </span>
            매출 분석
          </router-link>

          <router-link
            :to="
              userRole === 'HQ'
                ? '/inquiries'
                : '/branch/inquiries'
            "
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
  hqOnly: true,
  branchOps: true,
  branchInventory: false,
  analysis: false,
});

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
  overflow-x: hidden;

  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  color: white;
  background-color: #d13b7d;
  box-sizing: border-box;
}

.logo-area {
  padding: 24px 20px;

  display: flex;
  align-items: center;
  gap: 10px;

  border-bottom: 1px solid
    rgba(255, 255, 255, 0.1);

  cursor: pointer;
}

.logo-icon {
  font-size: 24px;
}

.logo-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

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

.arrow-icon {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.is-open .arrow-icon {
  transform: rotate(180deg);
}

.group-items {
  max-height: 0;
  padding-left: 8px;
  overflow: hidden;

  display: flex;
  flex-direction: column;

  transition: max-height 0.25s
    cubic-bezier(0, 1, 0, 1);
}

.is-open .group-items {
  max-height: 500px;
  transition: max-height 0.25s ease-in;
}

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

  transition: all 0.2s;
}

.menu-item:hover {
  color: white;
  background: rgba(255, 255, 255, 0.08);
}

.menu-icon {
  width: 18px;
  font-size: 16px;
  text-align: center;
  flex-shrink: 0;
}

.menu-item.active {
  color: white;
  background: rgba(255, 255, 255, 0.2);
  font-weight: 600;
}
</style>