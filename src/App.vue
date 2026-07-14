<template>
  <div id="app">
    <!-- 상단 통합 내비게이션 바 -->
    <nav style="padding: 15px; background: #1f2028; border-bottom: 1px solid var(--border); text-align: left; display: flex; align-items: center; gap: 20px;">
      
      <!-- 1. 지점 재고 관리 링크 -->
      <router-link to="/inventory" style="color: var(--accent); text-decoration: none; font-weight: bold;">
        Store Inventory Management
      </router-link>

      <!-- 2. 본사 발주 승인 링크 -->
      <router-link to="/inventory/hq-orders" class="nav-item hq-link" style="color: #ffffff; text-decoration: none; font-weight: 500; font-size: 14px;">
        🏢 본사 발주 승인
      </router-link>

      <!-- 매출 통계 분석 링크 -->
      <router-link to="/sales" class="nav-item sales-link" style="color: #cbd5e1; text-decoration: none; font-weight: 500; font-size: 14px; margin-left: 10px; display: inline-flex; align-items: center; gap: 4px;">
        📊 매출 통계 분석
      </router-link>
    </nav>
    
    <!-- 본문 라우터 영역 -->
    <main style="flex-grow: 1;">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
main {
  background: var(--bg);
}

.nav-item:hover {
  color: var(--accent) !important;
  transition: color 0.2s ease;
}
</style>