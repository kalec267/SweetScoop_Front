import { defineStore } from 'pinia';
import { getDashboardSummary } from '@/api/inventory';

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    summary: {
      totalRequests: 0,
      pendingCount: 0,
      shippingCount: 0,
      activeBranches: 0
    },
    isLoading: false
  }),
  actions: {
    async fetchSummary() {
      this.isLoading = true;
      try {
        const data = await getDashboardSummary();
        this.summary = data;
      } catch (error) {
        console.error("실시간 대시보드 요약 수치 로드 실패. Mock 데이터를 유지합니다.");
        // API 연동 전 혹은 실패 시 화면 깨짐 방지용 기본값 (시안 기준)
        this.summary = { totalRequests: 248, pendingCount: 18, shippingCount: 7, activeBranches: 12 };
      } finally {
        this.isLoading = false;
      }
    }
  }
});