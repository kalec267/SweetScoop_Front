<template>
  <div class="admin-layout">
    
    <!-- 💡 로그인 페이지가 아닐 때만 사이드바를 노출합니다 -->
    <Sidebar v-if="showNavigation" />

    <div class="main-container" :class="{ 'no-sidebar': !showNavigation }">
      <!-- 💡 로그인 페이지가 아닐 때만 상단 헤더를 노출합니다 -->
      <Header v-if="showNavigation" />
      
      <main class="content-router-view">
        <router-view />
      </main>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';

const route = useRoute();

// 현재 경로가 로그인(/login)이 아니면 네비게이션 요소들을 노출합니다.
const showNavigation = computed(() => route.path !== '/login');
</script>

<style>
.admin-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  background-color: #f8fafc;
}

/* 로그인 화면 전용 (사이드바가 없을 때 메인 영역이 100%를 쓰도록 대응) */
.main-container.no-sidebar {
  height: 100vh;
  background-color: transparent;
}

.content-router-view {
  flex: 1;
}
</style>