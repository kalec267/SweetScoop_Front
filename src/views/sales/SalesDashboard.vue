<template>
    <div class="dashboard-container">
      <!-- 상단 타이틀, 지점 선택 드롭다운, 필터 탭 -->
      <div class="dashboard-header">
        <div class="title-area">
          <h2>통계 / 리포트 데이터</h2>
          <select v-model="selectedBranchId" @change="fetchDashboardData" class="branch-select">
            <option :value="0">전체 지점 통합 통계</option>
            <option :value="1">1번 지점 (강남점)</option>
            <option :value="2">2번 지점 (홍대점)</option>
            <option :value="3">3번 지점 (부산점)</option>
          </select>
        </div>
        <div class="filter-tabs">
          <button :class="{ active: currentFilter === 'today' }" @click="setFilter('today')">오늘</button>
          <button :class="{ active: currentFilter === '7days' }" @click="setFilter('7days')">최근 7일</button>
          <button :class="{ active: currentFilter === '30days' }" @click="setFilter('30days')">최근 30일</button>
        </div>
      </div>
  
      <!-- 요약 카드 섹션 -->
      <div class="card-grid">
        <div class="stat-card">
          <div class="card-title">{{ selectedBranchId === 0 ? '전체 통합 누적 매출액' : '지점 단독 누적 매출액' }}</div>
          <div class="card-value">₩ {{ formatNumber(stats.cumulativeSales) }}</div>
        </div>
        <div class="stat-card">
          <div class="card-title">평균 객단가</div>
          <div class="card-value">₩ {{ formatNumber(stats.averageReceipt) }}</div>
        </div>
      </div>
  
      <!-- 레이아웃 스택 -->
      <div class="main-layout">
        
        <!-- [섹션 1] 상단 차트와 인기 메뉴 랭킹 -->
        <div class="content-grid">
          <div class="chart-section">
            <h3>기간별 전체 매출 통계 추이</h3>
            <div class="canvas-container">
              <canvas ref="periodChartCanvas"></canvas>
            </div>
          </div>
          
          <div class="ranking-section">
            <h3>골든 플레이버 TOP 5</h3>
            <div class="ranking-list">
              <div v-for="(flavor, index) in stats.topFlavors" :key="index" class="ranking-item">
                <div class="ranking-info">
                  <span class="rank-badge">{{ index + 1 }}</span>
                  <span class="flavor-name">{{ flavor.name }}</span>
                  <span class="flavor-share">{{ flavor.share }}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: flavor.share + '%' }"></div>
                </div>
              </div>
              <div v-if="!stats.topFlavors || stats.topFlavors.length === 0" class="empty-text">데이터가 없습니다.</div>
            </div>
          </div>
        </div>
  
        <!-- [섹션 2] 중간 레이아웃: 주문 유형 및 결제 수단 비율 분석 -->
        <div class="content-grid equal-grid" style="margin-top: 24px;">
          <div class="chart-section mini-chart">
            <h3>주문 유형 비율 (매장 vs 포장)</h3>
            <div class="canvas-container-mini">
              <canvas ref="orderTypeChartCanvas"></canvas>
            </div>
          </div>
          <div class="chart-section mini-chart">
            <h3>결제 수단별 이용 점유율</h3>
            <div class="canvas-container-mini">
              <canvas ref="paymentMethodChartCanvas"></canvas>
            </div>
          </div>
        </div>
  
        <!-- [섹션 3] 하단 차트: 시간대별 집중도 분석 -->
        <div class="content-grid" style="margin-top: 24px;">
          <div class="chart-section" style="grid-column: span 2;">
            <h3>시간대별 방문 및 매출 집중도 분석 (마케팅 인사이트용)</h3>
            <p class="chart-sub" style="font-size: 13px; color: #64748b; margin-top: -8px; margin-bottom: 12px;">
              * 최근 7일/30일 선택 시 각 시간대별 일평균 매출액으로 자동 환산되어 비수기를 파악하기 좋습니다.
            </p>
            <div class="canvas-container">
              <canvas ref="hourlyChartCanvas"></canvas>
            </div>
          </div>
        </div>
  
        <!-- [섹션 4] 최하단: 지점별 통계 표 -->
        <div v-if="selectedBranchId === 0" class="branch-ranking-section" style="margin-top: 24px;">
          <h3>지점별 매출 통계 랭킹</h3>
          <table class="ranking-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>지점 이름</th>
                <th>누적 매출액</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(branch, index) in stats.branchRanking" :key="index">
                <td class="rank-num">{{ index + 1 }}</td>
                <td class="branch-name">{{ branch.branchName }}</td>
                <td class="branch-amount">₩ {{ formatNumber(branch.totalAmount) }}</td>
              </tr>
              <tr v-if="!stats.branchRanking || stats.branchRanking.length === 0">
                <td colspan="3" class="table-empty">랭킹 데이터가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
  
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import { Chart, registerables } from 'chart.js';
  
  Chart.register(...registerables);
  
  export default {
    name: 'SalesDashboard',
    data() {
      return {
        selectedBranchId: 0, 
        currentFilter: 'today',
        stats: {
          cumulativeSales: 0,
          averageReceipt: 0,
          periodTrends: [],
          hourlyTrends: [],
          topFlavors: [],
          branchRanking: [],
          orderTypes: [],
          paymentMethods: []
        },
        periodChartInstance: null,
        hourlyChartInstance: null,
        orderTypeChartInstance: null,
        paymentMethodChartInstance: null
      };
    },
    mounted() {
      this.fetchDashboardData();
    },
    methods: {
      async fetchDashboardData() {
        try {
          const response = await axios.get('http://localhost:8888/api/sales/dashboard', {
            params: { branchId: this.selectedBranchId, filter: this.currentFilter }
          });
          this.stats = response.data;
          this.renderCharts();
        } catch (error) {
          console.error("통계 데이터를 가져오는 중 에러 발생:", error);
        }
      },
      setFilter(filterType) {
        this.currentFilter = filterType;
        this.fetchDashboardData();
      },
      renderCharts() {
        // 1. 기간별 매출 추이
        const canvasPeriod = this.$refs.periodChartCanvas;
        if (canvasPeriod) {
          if (this.periodChartInstance) this.periodChartInstance.destroy();
          this.periodChartInstance = new Chart(canvasPeriod.getContext('2d'), {
                type: 'line',
                data: {
                labels: this.stats.periodTrends.map(item => item.axisLabel),
                datasets: [{
                    label: '총 매출액 (₩)',
                    data: this.stats.periodTrends.map(item => item.amount),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)', 
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#3b82f6',
                    pointHoverRadius: 6
                }]
                },
                options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: { x: { grid: { display: false } }, y: { grid: { color: '#e2e8f0' } } }
                }
            });
        }
  
        // 2. 주문 유형 비율 (Doughnut)
        const canvasOrderType = this.$refs.orderTypeChartCanvas;
        if (canvasOrderType) {
          if (this.orderTypeChartInstance) this.orderTypeChartInstance.destroy();
          this.orderTypeChartInstance = new Chart(canvasOrderType.getContext('2d'), {
            type: 'doughnut',
            data: {
              labels: this.stats.orderTypes.map(item => item.label),
              datasets: [{
                data: this.stats.orderTypes.map(item => item.value),
                backgroundColor: ['#10b981', '#f59e0b']
              }]
            },
            options: { responsive: true, maintainAspectRatio: false }
          });
        }
  
        // 3. 결제 수단 점유율 (Pie)
        const canvasPayment = this.$refs.paymentMethodChartCanvas;
        if (canvasPayment) {
          if (this.paymentMethodChartInstance) this.paymentMethodChartInstance.destroy();
          this.paymentMethodChartInstance = new Chart(canvasPayment.getContext('2d'), {
            type: 'pie',
            data: {
              labels: this.stats.paymentMethods.map(item => item.label),
              datasets: [{
                data: this.stats.paymentMethods.map(item => item.value),
                backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#6b7280']
              }]
            },
            options: { responsive: true, maintainAspectRatio: false }
          });
        }
  
        // 4. 시간대별 집중도 분석 (Bar)
        const canvasHourly = this.$refs.hourlyChartCanvas;
        if (canvasHourly) {
          if (this.hourlyChartInstance) this.hourlyChartInstance.destroy();
          this.hourlyChartInstance = new Chart(canvasHourly.getContext('2d'), {
            type: 'bar',
            data: {
              labels: this.stats.hourlyTrends.map(item => item.axisLabel),
              datasets: [{
                label: '시간대별 매출액/평균액 (₩)',
                data: this.stats.hourlyTrends.map(item => item.amount),
                backgroundColor: '#6366f1',
                borderRadius: 4
              }]
            },
            options: { responsive: true, maintainAspectRatio: false }
          });
        }
      },
      formatNumber(val) {
        return String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
    }
  };
  </script>
  
  <style scoped>
  .dashboard-container { padding: 24px; background-color: #f8fafc; font-family: 'Inter', sans-serif; }
  .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .title-area { display: flex; align-items: center; gap: 16px; }
  .branch-select { padding: 8px 12px; font-size: 14px; border: 1px solid #cbd5e1; border-radius: 6px; background-color: #fff; font-weight: 500; outline: none; cursor: pointer; }
  .filter-tabs button { padding: 8px 16px; margin-left: 8px; border: 1px solid #cbd5e1; background-color: #fff; border-radius: 6px; cursor: pointer; font-weight: 500; }
  .filter-tabs button.active { background-color: #6366f1; color: #fff; border-color: #6366f1; }
  .card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card { background-color: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .card-title { color: #64748b; font-size: 14px; margin-bottom: 8px; }
  .card-value { font-size: 24px; font-weight: 700; color: #1e293b; }
  .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
  .equal-grid { grid-template-columns: 1fr 1fr !important; }
  .chart-section, .ranking-section { background-color: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .canvas-container { position: relative; height: 260px; width: 100%; }
  .canvas-container-mini { position: relative; height: 200px; width: 100%; }
  .ranking-list { margin-top: 16px; }
  .ranking-item { margin-bottom: 16px; }
  .ranking-info { display: flex; align-items: center; margin-bottom: 6px; }
  .rank-badge { background-color: #e2e8f0; color: #475569; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 12px; font-weight: 600; margin-right: 8px; }
  .flavor-name { flex-grow: 1; font-weight: 500; color: #334155; }
  .flavor-share { font-weight: 600; color: #6366f1; }
  .progress-bar { background-color: #f1f5f9; height: 8px; border-radius: 4px; overflow: hidden; }
  .progress-fill { background-color: #6366f1; height: 100%; border-radius: 4px; transition: width 0.3s ease; }
  .empty-text { text-align: center; color: #94a3b8; padding: 40px 0; }
  
  /* 랭킹 표 스타일 가이드 표준 보완 패치 */
  .branch-ranking-section { background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .ranking-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  .ranking-table th { color: #64748b; border-bottom: 2px solid #e2e8f0; font-size: 14px; font-weight: 600; padding: 12px 16px; }
  .ranking-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px; }
  .ranking-table th:nth-child(1), .rank-num { text-align: left; width: 80px; font-weight: 700; color: #6366f1; }
  .ranking-table th:nth-child(2), .branch-name { text-align: left; font-weight: 500; color: #334155; }
  .ranking-table th:nth-child(3), .branch-amount { text-align: right; font-weight: 700; color: #1e293b; }
  .table-empty { text-align: center !important; color: #94a3b8; padding: 40px 0; }
  </style>