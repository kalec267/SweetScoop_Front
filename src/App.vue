```vue
<template>
  <div id="app-container">
    <div
      class="app-layout"
      :class="{ 'admin-layout': showNavigation }"
    >
      <!-- 관리자 화면에서만 사이드바 표시 -->
      <Sidebar v-if="showNavigation" />

      <div
        class="main-container"
        :class="{ 'no-sidebar': !showNavigation }"
      >
        <!-- 관리자 화면에서만 헤더 표시 -->
        <Header v-if="showNavigation" />

        <!-- 현재 URL에 해당하는 페이지 출력 -->
        <main class="content-router-view">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import {
  RouterView,
  useRoute,
} from "vue-router";

import Sidebar from "./components/Sidebar.vue";
import Header from "./components/Header.vue";

const route = useRoute();

/*
 * requiresAuth가 true인 관리자 페이지에서만
 * Sidebar와 Header를 표시합니다.
 *
 * 관리자 화면:
 * /dashboard
 * /branch/dashboard
 * /inventory
 * /inventory/hq-orders
 * /sales
 * /delivery
 * /analytics
 *
 * 일반 화면:
 * /
 * /size
 * /cup
 * /menu
 * /payment
 * /login
 */
const showNavigation = computed(() => {
  return route.meta.requiresAuth === true;
});
</script>

<style>
/* 브라우저 기본 여백 제거 */
html,
body,
#app {
  width: 100%;
  min-height: 100%;
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
}

#app-container {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

.app-layout {
  width: 100%;
  min-height: 100vh;
}

/* 관리자 화면 전체 레이아웃 */
.app-layout.admin-layout {
  display: flex;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
}

/* 메인 화면 영역 */
.main-container {
  width: 100%;
  min-height: 100vh;
}

/* 사이드바가 있는 관리자 화면 */
.admin-layout .main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: auto;
  height: 100vh;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  background-color: #f8fafc;
}

/* 로그인 및 키오스크 화면 */
.main-container.no-sidebar {
  width: 100%;
  min-height: 100vh;
  background-color: transparent;
}

/* 라우터 페이지 출력 영역 */
.content-router-view {
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 0;
}
</style>
```
