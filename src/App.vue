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

        <main class="content-router-view">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";

import Sidebar from "./components/Sidebar.vue";
import Header from "./components/Header.vue";

const route = useRoute();

/*
 * requiresAuth가 true인 관리자 페이지에서만
 * Sidebar와 Header를 표시합니다.
 *
 * 표시되는 페이지 예:
 * /dashboard
 * /branch/dashboard
 * /inventory
 * /delivery
 * /analytics
 *
 * 표시되지 않는 페이지 예:
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

/* 관리자 화면 레이아웃 */
.app-layout.admin-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.main-container {
  width: 100%;
  min-height: 100vh;
}

/* 관리자 화면의 메인 영역 */
.admin-layout .main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: auto;
  height: 100vh;
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

/* 라우터 화면 출력 영역 */
.content-router-view {
  flex: 1;
  width: 100%;
  min-height: 0;
}
</style>