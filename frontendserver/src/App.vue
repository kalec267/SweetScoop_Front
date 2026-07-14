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
  display: flex;          /* 👈 핵심 1: 사이드바와 메인을 가로로 나란히 배치 */
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
.main-content {
  flex: 1;                /* 👈 핵심 2: 남은 가로 공간을 메인 영역이 100% 꽉 채우도록 설정 */
  display: flex;
  flex-direction: column; /* 헤더가 위, router-view가 아래로 가도록 설정 */
  height: 100vh;
  overflow-y: auto;       /* 콘텐츠가 길어지면 메인 영역 안에서만 스크롤되도록 설정 */
  background-color: #f8fafc;
}
.page-body {
  flex: 1;
  padding: 0;
}
</style>