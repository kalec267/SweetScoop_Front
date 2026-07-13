<template>
  <div class="app-layout">
    <!-- 고정 좌측 사이드바 -->
    <Sidebar />
    
    <!-- 우측 메인 콘텐츠 영역 -->
    <div class="main-content">
      <Header />
      <main class="page-body">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
</script>

<style>
/* 전역 스케일 가이드 레이아웃 */
body {
  margin: 0;
  background-color: #f8fafc;
}
.app-layout {
  display: flex;
}
.main-content {
  margin-left: 260px; /* 사이드바 가로폭만큼 마진 할당 */
  flex-grow: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.page-body {
  flex-grow: 1;
  padding: 0 30px 30px 30px;
}
</style>