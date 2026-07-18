<template>
  <!--
    App.vue에서 이미 Sidebar/Header를 표시하므로
    AdminLayout은 중첩 라우트 호환용 RouterView 역할만 담당합니다.
  -->
  <div class="admin-layout">
    <RouterView />
  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
</script>

<style scoped>
.admin-layout {
  width: 100%;
  min-width: 0;
  min-height: 100%;
}
</style>
