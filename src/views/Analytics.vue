<template>
    <div class="analytics-container">
      <h2>매출 통계 / 리포트</h2>
  
      <!-- 오늘 자 종합 리포트 정보 -->
      <div class="sales-summary-row">
        <div class="summary-box">
          <span class="box-label">금일 전 지점 총 매출액</span>
          <span class="box-value">{{ totalSalesAmount.toLocaleString() }} 원</span>
        </div>
      </div>
  
      <!-- 지점별 상세 매출 랭킹 리스트 -->
      <div class="table-card">
        <h3>지점별 당일 정산 현황</h3>
        <table>
          <thead>
            <tr>
              <th>순위</th>
              <th>지점명</th>
              <th>매출 일자</th>
              <th>당일 총 매출액</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(sale, index) in salesData" :key="sale.id">
              <td><strong>{{ index + 1 }}</strong></td>
              <td>{{ sale.branchName }}</td>
              <td>{{ sale.salesDate }}</td>
              <td class="text-right text-primary">{{ sale.totalAmount.toLocaleString() }} 원</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import axios from 'axios';
  
  const salesData = ref([]);
  
  const fetchSalesData = async () => {
    try {
      const res = await axios.get('/api/admin/sales/daily');
      salesData.value = res.data;
    } catch (err) {
      // 백엔드 연결 전 Mock 임시 수치 데이터 예시
      salesData.value = [
        { id: 1, branchName: "스윗스쿱 강남역점", salesDate: "2026-07-13", totalAmount: 1254900 },
        { id: 2, branchName: "스윗스쿱 홍대점", salesDate: "2026-07-13", totalAmount: 890400 }
      ];
    }
  };
  
  const totalSalesAmount = computed(() => {
    return salesData.value.reduce((acc, curr) => acc + curr.totalAmount, 0);
  });
  
  onMounted(fetchSalesData);
  </script>