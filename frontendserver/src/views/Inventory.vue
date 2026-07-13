<template>
    <div class="inventory-container">
      <div class="page-header">
        <h2>지점별 실시간 재고 현황</h2>
        <select v-model="selectedBranch" @change="fetchInventory" class="branch-select">
          <option :value="1">스윗스쿱 강남역점</option>
          <option :value="2">스윗스쿱 홍대점</option>
        </select>
      </div>
  
      <div class="inventory-grid">
        <div v-for="inv in inventoryData" :key="inv.itemId" class="inventory-card">
          <div class="card-title">{{ inv.itemName }}</div>
          <div class="stock-info">
            <span class="stock-amount">{{ inv.stockLevel.toLocaleString() }}</span> g
          </div>
          <!-- 재고 상태 바 표시 -->
          <div class="progress-bar-container">
            <div 
              class="progress-bar" 
              :style="{ width: getPercentage(inv.stockLevel) + '%' }"
              :class="getBarColor(inv.stockLevel)"
            ></div>
          </div>
          <div class="status-text" :class="getTextColor(inv.stockLevel)">
            {{ inv.stockLevel < 3000 ? '⚠️ 재고 부족 (발주 필요)' : '✅ 안정 상태' }}
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  
  const selectedBranch = ref(1);
  const inventoryData = ref([]);
  
  const fetchInventory = async () => {
    try {
      const res = await axios.get(`http://localhost:8888/api/admin/branches/${selectedBranch.value}/inventory`);
      inventoryData.value = res.data;
    } catch (err) {
      console.error("재고 데이터 로드 실패", err);
    }
  };
  
  const getPercentage = (stock) => Math.min((stock / 15000) * 100, 100); // 15,000g 기준 비율 계산
  const getBarColor = (stock) => stock < 3000 ? 'bar-danger' : 'bar-success';
  const getTextColor = (stock) => stock < 3000 ? 'text-danger' : 'text-success';
  
  onMounted(fetchInventory);
  </script>